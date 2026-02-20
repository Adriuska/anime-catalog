import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/axios';
import Loader from '../../components/Loader';
import AlertMessage from '../../components/AlertMessage';

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

  useEffect(() => {
    const loadStudios = async () => {
      try {
        const { data } = await api.get('/studios');
        setStudios(data);
      } catch {
        setError('Failed to load studios.');
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
      } catch {
        setError('Failed to load anime.');
      } finally {
        setLoading(false);
      }
    };

    loadStudios();
    loadAnime();
  }, [id]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const validate = () => {
    if (!form.title.trim()) return 'Title is required.';
    if (!form.description || form.description.trim().length < 10) return 'Description must be at least 10 chars.';
    if (!/^https?:\/\//i.test(form.posterUrl)) return 'Poster URL must start with http:// or https://';
    if (form.bannerUrl && !/^https?:\/\//i.test(form.bannerUrl)) return 'Banner URL must start with http:// or https://';
    if (form.trailerUrl && !/^https?:\/\//i.test(form.trailerUrl)) return 'Trailer URL must start with http:// or https://';
    if (Number(form.episodes) < 1) return 'Episodes must be at least 1.';
    if (form.durationMinutes && Number(form.durationMinutes) < 1) return 'Duration must be at least 1 minute.';
    if (Number(form.rating) < 0 || Number(form.rating) > 10) return 'Rating must be between 0 and 10.';
    if (form.year && (Number(form.year) < 1950 || Number(form.year) > 2100)) return 'Year must be between 1950 and 2100.';
    if (!form.genres.split(',').map((genre) => genre.trim()).filter(Boolean).length) return 'At least one genre is required.';
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
      setError('Failed to save anime.');
      setLoading(false);
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">{isEdit ? 'Edit Anime' : 'New Anime'}</h2>
        <Link className="btn btn-outline-secondary" to="/animes">Back</Link>
      </div>

      <AlertMessage message={error} type="danger" />

      <form className="card card-body" onSubmit={submit}>
        <div className="row g-3">
          <div className="col-md-6"><label className="form-label">Title</label><input className="form-control" name="title" value={form.title} onChange={handleChange} /></div>
          <div className="col-md-6"><label className="form-label">Poster URL</label><input className="form-control" name="posterUrl" value={form.posterUrl} onChange={handleChange} /></div>
          <div className="col-md-6"><label className="form-label">Banner URL (optional)</label><input className="form-control" name="bannerUrl" value={form.bannerUrl} onChange={handleChange} /></div>
          <div className="col-md-6"><label className="form-label">Trailer URL (optional)</label><input className="form-control" name="trailerUrl" value={form.trailerUrl} onChange={handleChange} /></div>
          <div className="col-12"><label className="form-label">Description</label><textarea className="form-control" rows="3" name="description" value={form.description} onChange={handleChange}></textarea></div>
          <div className="col-md-2"><label className="form-label">Episodes</label><input type="number" className="form-control" name="episodes" value={form.episodes} onChange={handleChange} /></div>
          <div className="col-md-2"><label className="form-label">Duration (min)</label><input type="number" className="form-control" name="durationMinutes" value={form.durationMinutes} onChange={handleChange} /></div>
          <div className="col-md-2"><label className="form-label">Rating</label><input type="number" step="0.1" className="form-control" name="rating" value={form.rating} onChange={handleChange} /></div>
          <div className="col-md-2"><label className="form-label">Year</label><input type="number" className="form-control" name="year" value={form.year} onChange={handleChange} placeholder="Auto" /></div>
          <div className="col-md-2">
            <label className="form-label">Season</label>
            <select className="form-select" name="season" value={form.season} onChange={handleChange}>
              <option value="">Auto / None</option>
              <option value="Winter">Winter</option>
              <option value="Spring">Spring</option>
              <option value="Summer">Summer</option>
              <option value="Fall">Fall</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Age rating</label>
            <select className="form-select" name="ageRating" value={form.ageRating} onChange={handleChange}>
              <option value="">No rating</option>
              <option value="G">G</option>
              <option value="PG">PG</option>
              <option value="PG-13">PG-13</option>
              <option value="R">R</option>
              <option value="R+">R+</option>
              <option value="RX">RX</option>
            </select>
          </div>
          <div className="col-md-2"><label className="form-label">Release Date</label><input type="date" className="form-control" name="releaseDate" value={form.releaseDate} onChange={handleChange} /></div>
          <div className="col-md-3">
            <label className="form-label">Studio</label>
            <select className="form-select" name="studio" value={form.studio} onChange={handleChange}>
              <option value="">No studio</option>
              {studios.map((studio) => <option key={studio._id} value={studio._id}>{studio.name}</option>)}
            </select>
          </div>
          <div className="col-md-2 d-flex align-items-end"><div className="form-check"><input id="isOngoing" type="checkbox" className="form-check-input" name="isOngoing" checked={form.isOngoing} onChange={handleChange} /><label className="form-check-label" htmlFor="isOngoing">Ongoing</label></div></div>
          <div className="col-12"><label className="form-label">Genres (comma separated)</label><input className="form-control" name="genres" value={form.genres} onChange={handleChange} /></div>
        </div>
        <div className="mt-3"><button className="btn btn-primary" disabled={loading} type="submit">{isEdit ? 'Update' : 'Create'}</button></div>
      </form>

      <Loader visible={loading} />
    </>
  );
}
