import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/axios';
import Loader from '../../components/Loader';
import AlertMessage from '../../components/AlertMessage';
import { getAnimeImageByTitle } from '../../utils/animeImages';

const initialForm = {
  title: '',
  description: '',
  posterUrl: '',
  bannerUrl: '',
  trailerUrl: '',
  episodes: 1,
  durationMinutes: '',
  releaseDate: '',
  season: '',
  year: '',
  ageRating: '',
  isOngoing: false,
  rating: 0,
  genres: '',
  studio: '',
};

export default function AnimeFormPage() {
  const { id } = useParams();
  const isEdit = useMemo(() => Boolean(id), [id]);
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [studios, setStudios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualImageUrls, setManualImageUrls] = useState({ poster: false, banner: false });

  const suggestedPosterUrl = useMemo(() => getAnimeImageByTitle(form.title, 'poster'), [form.title]);
  const suggestedBannerUrl = useMemo(() => getAnimeImageByTitle(form.title, 'banner'), [form.title]);

  useEffect(() => {
    const loadStudios = async () => {
      try {
        const { data } = await api.get('/studios');
        setStudios(data);
      } catch {
        setError('No se pudieron cargar los estudios.');
      }
    };

    const loadAnime = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const { data } = await api.get(`/animes/${id}`);
        setForm({
          title: data.title,
          description: data.description,
          posterUrl: data.posterUrl,
          bannerUrl: data.bannerUrl || '',
          trailerUrl: data.trailerUrl || '',
          episodes: data.episodes,
          durationMinutes: data.durationMinutes || '',
          releaseDate: data.releaseDate?.slice(0, 10) || '',
          season: data.season || '',
          year: data.year || '',
          ageRating: data.ageRating || '',
          isOngoing: data.isOngoing,
          rating: data.rating,
          genres: data.genres.join(', '),
          studio: data.studio?._id || data.studio || '',
        });
        setManualImageUrls({ poster: true, banner: true });
      } catch {
        setError('No se pudo cargar el anime.');
      } finally {
        setLoading(false);
      }
    };

    loadStudios();
    loadAnime();
  }, [id]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (name === 'title') {
      setForm((prev) => ({
        ...prev,
        title: value,
        posterUrl: !manualImageUrls.poster || !prev.posterUrl ? getAnimeImageByTitle(value, 'poster') : prev.posterUrl,
        bannerUrl: !manualImageUrls.banner || !prev.bannerUrl ? getAnimeImageByTitle(value, 'banner') : prev.bannerUrl,
      }));
      return;
    }

    if (name === 'posterUrl') {
      setManualImageUrls((prev) => ({ ...prev, poster: true }));
    }

    if (name === 'bannerUrl') {
      setManualImageUrls((prev) => ({ ...prev, banner: true }));
    }

    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const applySuggestedUrl = (field) => {
    if (field === 'poster') {
      setForm((prev) => ({ ...prev, posterUrl: suggestedPosterUrl }));
      setManualImageUrls((prev) => ({ ...prev, poster: false }));
      return;
    }

    setForm((prev) => ({ ...prev, bannerUrl: suggestedBannerUrl }));
    setManualImageUrls((prev) => ({ ...prev, banner: false }));
  };

  const validate = () => {
    if (!form.title.trim()) return 'El título es obligatorio.';
    if (!form.description || form.description.trim().length < 10) return 'La descripción debe tener al menos 10 caracteres.';
    if (!/^https?:\/\//i.test(form.posterUrl)) return 'La URL del póster debe comenzar con http:// o https://';
    if (form.bannerUrl && !/^https?:\/\//i.test(form.bannerUrl)) return 'La URL del banner debe comenzar con http:// o https://';
    if (form.trailerUrl && !/^https?:\/\//i.test(form.trailerUrl)) return 'La URL del tráiler debe comenzar con http:// o https://';
    if (Number(form.episodes) < 1) return 'Los episodios deben ser al menos 1.';
    if (form.durationMinutes && Number(form.durationMinutes) < 1) return 'La duración debe ser al menos 1 minuto.';
    if (Number(form.rating) < 0 || Number(form.rating) > 10) return 'La puntuación debe estar entre 0 y 10.';
    if (form.year && (Number(form.year) < 1950 || Number(form.year) > 2100)) return 'El año debe estar entre 1950 y 2100.';
    if (!form.genres.split(',').map((genre) => genre.trim()).filter(Boolean).length) return 'Se requiere al menos un género.';
    return '';
  };

  const submit = async (event) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        posterUrl: form.posterUrl.trim(),
        bannerUrl: form.bannerUrl.trim() || undefined,
        trailerUrl: form.trailerUrl.trim() || undefined,
        episodes: Number(form.episodes),
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
        releaseDate: form.releaseDate,
        season: form.season || undefined,
        year: form.year ? Number(form.year) : undefined,
        ageRating: form.ageRating || undefined,
        isOngoing: Boolean(form.isOngoing),
        rating: Number(form.rating),
        genres: form.genres.split(',').map((genre) => genre.trim()).filter(Boolean),
        studio: form.studio || undefined,
      };

      if (isEdit) {
        await api.patch(`/animes/${id}`, payload);
      } else {
        await api.post('/animes', payload);
      }

      navigate('/animes');
    } catch {
      setError('No se pudo guardar el anime.');
      setLoading(false);
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">{isEdit ? 'Editar anime' : 'Nuevo anime'}</h2>
        <Link className="btn btn-outline-secondary" to="/animes">Volver</Link>
      </div>

      <AlertMessage message={error} type="danger" />

      <form className="card card-body" onSubmit={submit}>
        <div className="row g-3">
          <div className="col-md-6"><label className="form-label">Título</label><input className="form-control" name="title" value={form.title} onChange={handleChange} /></div>
          <div className="col-md-6"><label className="form-label">URL del póster</label><input className="form-control" name="posterUrl" value={form.posterUrl} onChange={handleChange} /></div>
          <div className="col-md-6"><label className="form-label">URL del banner (opcional)</label><input className="form-control" name="bannerUrl" value={form.bannerUrl} onChange={handleChange} /></div>
          <div className="col-md-6"><label className="form-label">URL del tráiler (opcional)</label><input className="form-control" name="trailerUrl" value={form.trailerUrl} onChange={handleChange} /></div>
          <div className="col-md-6">
            <div className="card h-100 border-0 shadow-sm">
              <img src={form.posterUrl || suggestedPosterUrl} alt="Vista previa del póster" className="card-img-top anime-poster" onError={(event) => { if (event.currentTarget.src !== suggestedPosterUrl) event.currentTarget.src = suggestedPosterUrl; }} />
              <div className="card-body py-2 px-3">
                <div className="small text-secondary mb-2">Póster sugerido según el título</div>
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => applySuggestedUrl('poster')}>Usar póster sugerido</button>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card h-100 border-0 shadow-sm">
              <img src={form.bannerUrl || suggestedBannerUrl} alt="Vista previa del banner" className="card-img-top" style={{ height: '170px', objectFit: 'cover' }} onError={(event) => { if (event.currentTarget.src !== suggestedBannerUrl) event.currentTarget.src = suggestedBannerUrl; }} />
              <div className="card-body py-2 px-3">
                <div className="small text-secondary mb-2">Banner sugerido según el título</div>
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => applySuggestedUrl('banner')}>Usar banner sugerido</button>
              </div>
            </div>
          </div>
          <div className="col-12"><label className="form-label">Descripción</label><textarea className="form-control" rows="3" name="description" value={form.description} onChange={handleChange}></textarea></div>
          <div className="col-md-2"><label className="form-label">Episodios</label><input type="number" className="form-control" name="episodes" value={form.episodes} onChange={handleChange} /></div>
          <div className="col-md-2"><label className="form-label">Duración (min)</label><input type="number" className="form-control" name="durationMinutes" value={form.durationMinutes} onChange={handleChange} /></div>
          <div className="col-md-2"><label className="form-label">Puntuación</label><input type="number" step="0.1" className="form-control" name="rating" value={form.rating} onChange={handleChange} /></div>
          <div className="col-md-2"><label className="form-label">Año</label><input type="number" className="form-control" name="year" value={form.year} onChange={handleChange} placeholder="Auto" /></div>
          <div className="col-md-2">
            <label className="form-label">Temporada</label>
            <select className="form-select" name="season" value={form.season} onChange={handleChange}>
              <option value="">Auto / Ninguna</option>
              <option value="Invierno">Invierno</option>
              <option value="Primavera">Primavera</option>
              <option value="Verano">Verano</option>
              <option value="Otoño">Otoño</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Clasificación</label>
            <select className="form-select" name="ageRating" value={form.ageRating} onChange={handleChange}>
              <option value="">Sin clasificación</option>
              <option value="G">G</option>
              <option value="PG">PG</option>
              <option value="PG-13">PG-13</option>
              <option value="R">R</option>
              <option value="R+">R+</option>
              <option value="RX">RX</option>
            </select>
          </div>
          <div className="col-md-2"><label className="form-label">Fecha de estreno</label><input type="date" className="form-control" name="releaseDate" value={form.releaseDate} onChange={handleChange} /></div>
          <div className="col-md-3">
            <label className="form-label">Estudio</label>
            <select className="form-select" name="studio" value={form.studio} onChange={handleChange}>
              <option value="">Sin estudio</option>
              {studios.map((studio) => <option key={studio._id} value={studio._id}>{studio.name}</option>)}
            </select>
          </div>
          <div className="col-md-2 d-flex align-items-end"><div className="form-check"><input id="isOngoing" type="checkbox" className="form-check-input" name="isOngoing" checked={form.isOngoing} onChange={handleChange} /><label className="form-check-label" htmlFor="isOngoing">En emisión</label></div></div>
          <div className="col-12"><label className="form-label">Géneros (separados por coma)</label><input className="form-control" name="genres" value={form.genres} onChange={handleChange} /></div>
        </div>
        <div className="mt-3"><button className="btn btn-primary" disabled={loading} type="submit">{isEdit ? 'Actualizar' : 'Crear'}</button></div>
      </form>

      <Loader visible={loading} />
    </>
  );
}
