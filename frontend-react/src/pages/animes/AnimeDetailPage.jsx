import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/axios';
import Loader from '../../components/Loader';
import AlertMessage from '../../components/AlertMessage';
import ConfirmModal from '../../components/ConfirmModal';
import { getAnimeImageByTitle, getPreferredAnimeImage } from '../../utils/animeImages';

export default function AnimeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    const fetchAnime = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/animes/${id}`);
        setAnime(data);
      } catch {
        setError('No se pudo cargar el anime.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnime();
  }, [id]);

  const handleDelete = async () => {
    try {
      await api.delete(`/animes/${id}`);
      navigate('/animes');
    } catch {
      setError('No se pudo eliminar el anime.');
      setDeleteOpen(false);
    }
  };

  const handleToggleLibrary = async () => {
    if (!anime?._id) return;
    try {
      const { data } = await api.patch(`/animes/${anime._id}`, { inLibrary: !anime.inLibrary });
      setAnime(data);
    } catch {
      setError('No se pudo actualizar el estado de biblioteca.');
    }
  };

  const handleToggleFavorite = async () => {
    if (!anime?._id) return;
    try {
      const { data } = await api.patch(`/animes/${anime._id}`, { isFavorite: !anime.isFavorite });
      setAnime(data);
    } catch {
      setError('No se pudo actualizar el estado de favorito.');
    }
  };

  const fallbackPoster = getAnimeImageByTitle(anime?.title, 'poster');

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Detalle del anime</h2>
        <Link className="btn btn-outline-secondary" to="/animes">Volver</Link>
      </div>
      <AlertMessage message={error} type="danger" />
      <Loader visible={loading} />

      {anime && !loading && (
        <div className="card border-0 shadow-sm overflow-hidden">
          <div className="anime-detail-banner" style={{ backgroundImage: `url(${getPreferredAnimeImage(anime, 'banner')})` }}>
            <div className="anime-detail-overlay">
              <div className="d-flex flex-wrap gap-2 mb-3">
                <span className="badge text-bg-warning">★ {anime.rating?.toFixed(1)}</span>
                <span className="badge text-bg-dark">{anime.isOngoing ? 'En emisión' : 'Finalizado'}</span>
                {anime.inLibrary && <span className="badge badge-library">En biblioteca</span>}
                {anime.isFavorite && <span className="badge badge-favorite">★ Favorito</span>}
                {anime.ageRating && <span className="badge text-bg-secondary">{anime.ageRating}</span>}
              </div>
              <h3 className="mb-2">{anime.title}</h3>
              <p className="mb-0 text-light-emphasis">{anime.description}</p>
            </div>
          </div>

          <div className="card-body">
            <div className="row g-4">
              <div className="col-md-4 col-lg-3">
                <img
                  src={getPreferredAnimeImage(anime, 'poster')}
                  className="img-fluid rounded anime-detail-poster"
                  alt={anime.title}
                  onError={(event) => {
                    if (event.currentTarget.src !== fallbackPoster) {
                      event.currentTarget.src = fallbackPoster;
                    }
                  }}
                />
              </div>
              <div className="col-md-8 col-lg-9">
                <div className="row g-3 mb-3">
                  <div className="col-sm-6 col-lg-3"><div className="small text-secondary">Episodios</div><div className="fw-semibold">{anime.episodes}</div></div>
                  <div className="col-sm-6 col-lg-3"><div className="small text-secondary">Año</div><div className="fw-semibold">{anime.year || 'N/D'}</div></div>
                  <div className="col-sm-6 col-lg-3"><div className="small text-secondary">Temporada</div><div className="fw-semibold">{anime.season || 'N/D'}</div></div>
                  <div className="col-sm-6 col-lg-3"><div className="small text-secondary">Duración</div><div className="fw-semibold">{anime.durationMinutes ? `${anime.durationMinutes} min` : 'N/D'}</div></div>
                </div>

                <div className="mb-3">
                  <div className="small text-secondary mb-1">Estudio</div>
                  <div className="fw-semibold">{anime.studio?.name || 'Independiente'}</div>
                </div>

                <div className="mb-4">
                  <div className="small text-secondary mb-2">Géneros</div>
                  <div className="d-flex flex-wrap gap-2">
                    {anime.genres.map((genre) => (
                      <span key={genre} className="badge rounded-pill text-bg-light border">{genre}</span>
                    ))}
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-2">
                  <Link className="btn btn-primary" to={`/animes/${anime._id}/edit`}>Editar</Link>
                  <button className="btn btn-danger" onClick={() => setDeleteOpen(true)}>Eliminar</button>
                  <button className={`btn ${anime.inLibrary ? 'btn-primary' : 'btn-outline-primary'}`} onClick={handleToggleLibrary}>
                    {anime.inLibrary ? 'En biblioteca' : 'Añadir a biblioteca'}
                  </button>
                  <button className={`btn ${anime.isFavorite ? 'btn-warning' : 'btn-outline-warning'}`} onClick={handleToggleFavorite}>
                    {anime.isFavorite ? '★ Favorito' : '☆ Favorito'}
                  </button>
                  {anime.trailerUrl && <a className="btn btn-outline-dark" href={anime.trailerUrl} target="_blank" rel="noreferrer">Ver tráiler</a>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteOpen}
        message={`¿Eliminar anime ${anime?.title || ''}?`}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
