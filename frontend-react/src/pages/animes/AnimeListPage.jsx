import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/axios';
import Loader from '../../components/Loader';
import AlertMessage from '../../components/AlertMessage';
import ConfirmModal from '../../components/ConfirmModal';
import { getAnimeImageByTitle, getPreferredAnimeImage } from '../../utils/animeImages';

const initialFilters = {
  search: '',
  genre: '',
  season: '',
  year: '',
  isOngoing: '',
  studioId: '',
  minRating: '',
  maxRating: '',
  sortBy: 'createdAt',
  order: 'desc',
};

const viewSettings = {
  catalog: {
    title: 'Catálogo de Anime',
    description: 'Descubre, filtra y gestiona tu biblioteca como una mini plataforma tipo Crunchy.',
    resultLabel: 'Resultados del catálogo',
  },
  library: {
    title: 'Mi Biblioteca',
    description: 'Aquí ves solo los animes guardados en tu biblioteca.',
    resultLabel: 'Títulos en biblioteca',
  },
  favorites: {
    title: 'Mis Favoritos',
    description: 'Tus animes marcados como favoritos para acceder rápido.',
    resultLabel: 'Títulos favoritos',
  },
};

const buildParams = (pageNumber, filters) => {
  const rawParams = { page: pageNumber, limit: 12, ...filters };
  return Object.fromEntries(
    Object.entries(rawParams).filter(([, value]) => value !== '' && value !== undefined && value !== null)
  );
};

const getViewFilters = (view) => {
  if (view === 'library') return { inLibrary: 'true' };
  if (view === 'favorites') return { isFavorite: 'true' };
  return {};
};

function AnimeCard({ anime, onDelete, onToggleLibrary, onToggleFavorite }) {
  const fallbackPoster = getAnimeImageByTitle(anime.title, 'poster');

  return (
    <article className="col">
      <div className="card h-100 shadow-sm anime-card border-0">
        <img
          src={getPreferredAnimeImage(anime, 'poster')}
          className="card-img-top anime-poster"
          alt={anime.title}
          onError={(event) => {
            if (event.currentTarget.src !== fallbackPoster) {
              event.currentTarget.src = fallbackPoster;
            }
          }}
        />
        <div className="card-body d-flex flex-column">
          <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
            <h5 className="card-title mb-0 anime-title">{anime.title}</h5>
            <span className="badge text-bg-warning">★ {anime.rating.toFixed(1)}</span>
          </div>
          <div className="small text-secondary mb-2">{anime.studio?.name || 'Independiente'} · {anime.year || 'N/D'}</div>
          <div className="d-flex flex-wrap gap-1 mb-3">
            {(anime.genres || []).slice(0, 3).map((genre) => (
              <span key={genre} className="badge rounded-pill text-bg-light border">{genre}</span>
            ))}
          </div>
          <div className="small text-secondary mb-3">{anime.isOngoing ? 'En emisión' : 'Finalizado'} · {anime.episodes} eps</div>
          <div className="d-flex flex-wrap gap-2 mb-3">
            <button className={`btn btn-sm ${anime.inLibrary ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => onToggleLibrary(anime)}>
              {anime.inLibrary ? 'En biblioteca' : 'Añadir a biblioteca'}
            </button>
            <button className={`btn btn-sm ${anime.isFavorite ? 'btn-warning' : 'btn-outline-warning'}`} onClick={() => onToggleFavorite(anime)}>
              {anime.isFavorite ? '★ Favorito' : '☆ Favorito'}
            </button>
          </div>
          <div className="mt-auto d-flex gap-2">
            <Link className="btn btn-sm btn-primary" to={`/animes/${anime._id}`}>Detalle</Link>
            <Link className="btn btn-sm btn-outline-secondary" to={`/animes/${anime._id}/edit`}>Editar</Link>
            <button className="btn btn-sm btn-outline-danger ms-auto" onClick={() => onDelete(anime)}>Eliminar</button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function AnimeListPage({ view = 'catalog' }) {
  const [animes, setAnimes] = useState([]);
  const [studios, setStudios] = useState([]);
  const [discover, setDiscover] = useState({
    hero: null,
    topRated: [],
    trending: [],
    ongoing: [],
    upcoming: [],
    genres: [],
    stats: { total: 0, ongoing: 0, upcoming: 0 },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState(initialFilters);
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [showFilters, setShowFilters] = useState(true);

  const currentView = viewSettings[view] || viewSettings.catalog;
  const isCatalogView = view === 'catalog';

  const loadStudios = useCallback(async () => {
    try {
      const { data } = await api.get('/studios');
      setStudios(data);
    } catch {
      setError('No se pudieron cargar los estudios.');
    }
  }, []);

  const loadDiscover = useCallback(async () => {
    try {
      const { data } = await api.get('/animes/discover');
      setDiscover(data);
    } catch {
      setError('No se pudieron cargar los destacados.');
    }
  }, []);

  const loadAnimes = useCallback(async (pageNumber, nextFilters) => {
    try {
      setLoading(true);
      setError('');
      const params = buildParams(pageNumber, { ...nextFilters, ...getViewFilters(view) });
      const { data } = await api.get('/animes', { params });
      setAnimes(data.data);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch {
      setError('No se pudieron cargar los animes.');
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    setFilters(initialFilters);
    loadStudios();
    if (view === 'catalog') {
      loadDiscover();
    }
    loadAnimes(1, initialFilters);
  }, [view, loadAnimes, loadDiscover, loadStudios]);

  const handleFilterChange = (event) => {
    setFilters((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    setPage(1);
    loadAnimes(1, filters);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    loadAnimes(1, initialFilters);
  };

  const handleDelete = async () => {
    if (!selectedAnime?._id) return;
    try {
      await api.delete(`/animes/${selectedAnime._id}`);
      setSuccess('Anime eliminado correctamente.');
      setSelectedAnime(null);
      loadAnimes(page, filters);
      if (isCatalogView) {
        loadDiscover();
      }
    } catch {
      setError('No se pudo eliminar el anime.');
      setSelectedAnime(null);
    }
  };

  const toggleLibrary = async (anime) => {
    try {
      await api.patch(`/animes/${anime._id}`, { inLibrary: !anime.inLibrary });
      setSuccess(anime.inLibrary ? 'Eliminado de la biblioteca.' : 'Añadido a la biblioteca.');
      loadAnimes(page, filters);
    } catch {
      setError('No se pudo actualizar la biblioteca.');
    }
  };

  const toggleFavorite = async (anime) => {
    try {
      await api.patch(`/animes/${anime._id}`, { isFavorite: !anime.isFavorite });
      setSuccess(anime.isFavorite ? 'Eliminado de favoritos.' : 'Añadido a favoritos.');
      loadAnimes(page, filters);
    } catch {
      setError('No se pudo actualizar favoritos.');
    }
  };

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">{currentView.title}</h1>
          <p className="text-secondary mb-0">{currentView.description}</p>
        </div>
        <Link className="btn btn-primary" to="/animes/new">+ Nuevo anime</Link>
      </div>

      <div className="d-flex flex-wrap gap-2 mb-4">
        <Link className={`btn btn-sm ${view === 'catalog' ? 'btn-dark' : 'btn-outline-dark'}`} to="/animes">Catálogo</Link>
        <Link className={`btn btn-sm ${view === 'library' ? 'btn-dark' : 'btn-outline-dark'}`} to="/library">Biblioteca</Link>
        <Link className={`btn btn-sm ${view === 'favorites' ? 'btn-dark' : 'btn-outline-dark'}`} to="/favorites">Favoritos</Link>
      </div>

      <AlertMessage message={error} type="danger" />
      <AlertMessage message={success} type="success" />

      {isCatalogView && discover.hero && (
        <section className="card border-0 overflow-hidden shadow-sm mb-4 anime-hero">
          <div className="row g-0">
            <div className="col-lg-4">
              <img src={discover.hero.posterUrl} alt={discover.hero.title} className="img-fluid w-100 h-100 object-fit-cover" />
            </div>
            <div className="col-lg-8">
              <div className="card-body p-4 h-100 d-flex flex-column">
                <span className="badge text-bg-warning align-self-start mb-2">Destacado</span>
                <h2 className="h4 mb-2">{discover.hero.title}</h2>
                <p className="text-secondary mb-3">{discover.hero.description}</p>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {(discover.hero.genres || []).map((genre) => (
                    <span key={genre} className="badge rounded-pill text-bg-light border">{genre}</span>
                  ))}
                </div>
                <div className="d-flex flex-wrap gap-3 small text-secondary mb-4">
                  <span>★ {discover.hero.rating.toFixed(1)}</span>
                  <span>{discover.hero.episodes} episodios</span>
                  <span>{discover.hero.studio?.name || 'Independiente'}</span>
                </div>
                <div className="mt-auto d-flex gap-2">
                  <Link className="btn btn-primary" to={`/animes/${discover.hero._id}`}>Ver detalle</Link>
                  <Link className="btn btn-outline-secondary" to={`/animes/${discover.hero._id}/edit`}>Editar</Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {isCatalogView && <section className="row g-3 mb-4">
        <div className="col-md-4"><div className="card border-0 shadow-sm card-body"><div className="text-secondary small">Total de títulos</div><div className="h4 mb-0">{discover.stats.total}</div></div></div>
        <div className="col-md-4"><div className="card border-0 shadow-sm card-body"><div className="text-secondary small">En emisión</div><div className="h4 mb-0">{discover.stats.ongoing}</div></div></div>
        <div className="col-md-4"><div className="card border-0 shadow-sm card-body"><div className="text-secondary small">Próximos</div><div className="h4 mb-0">{discover.stats.upcoming}</div></div></div>
      </section>}

      <div className="d-flex justify-content-between align-items-center mb-2">
        <h2 className="h5 mb-0">Explorar catálogo</h2>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => setShowFilters((prev) => !prev)}
          aria-expanded={showFilters}
        >
          {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
        </button>
      </div>

      {showFilters && <form className="card border-0 shadow-sm card-body mb-4" onSubmit={applyFilters}>
        <div className="row g-2 align-items-end">
          <div className="col-md-3"><label className="form-label small mb-1">Buscar</label><input className="form-control" name="search" value={filters.search} onChange={handleFilterChange} placeholder="Título..." /></div>
          <div className="col-md-2">
            <label className="form-label small mb-1">Género</label>
            <select className="form-select" name="genre" value={filters.genre} onChange={handleFilterChange}>
              <option value="">Todos los géneros</option>
              {discover.genres.map((genre) => <option key={genre} value={genre}>{genre}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label small mb-1">Temporada</label>
            <select className="form-select" name="season" value={filters.season} onChange={handleFilterChange}>
              <option value="">Todas las temporadas</option>
              <option value="Invierno">Invierno</option>
              <option value="Primavera">Primavera</option>
              <option value="Verano">Verano</option>
              <option value="Otoño">Otoño</option>
            </select>
          </div>
          <div className="col-md-1"><label className="form-label small mb-1">Año</label><input className="form-control" name="year" value={filters.year} onChange={handleFilterChange} placeholder="2024" /></div>
          <div className="col-md-2">
            <select className="form-select" name="isOngoing" value={filters.isOngoing} onChange={handleFilterChange}>
              <option value="">Todos los estados</option>
              <option value="true">En emisión</option>
              <option value="false">Finalizado</option>
            </select>
          </div>
          <div className="col-md-2">
            <select className="form-select" name="studioId" value={filters.studioId} onChange={handleFilterChange}>
              <option value="">Todos los estudios</option>
              {studios.map((studio) => <option key={studio._id} value={studio._id}>{studio.name}</option>)}
            </select>
          </div>
          <div className="col-md-1"><label className="form-label small mb-1">Mín ★</label><input className="form-control" name="minRating" value={filters.minRating} onChange={handleFilterChange} placeholder="0" /></div>
          <div className="col-md-1"><label className="form-label small mb-1">Máx ★</label><input className="form-control" name="maxRating" value={filters.maxRating} onChange={handleFilterChange} placeholder="10" /></div>
          <div className="col-md-2">
            <label className="form-label small mb-1">Ordenar por</label>
            <select className="form-select" name="sortBy" value={filters.sortBy} onChange={handleFilterChange}>
              <option value="createdAt">Recién añadidos</option>
              <option value="rating">Puntuación</option>
              <option value="releaseDate">Fecha de estreno</option>
              <option value="title">Título</option>
              <option value="episodes">Episodios</option>
            </select>
          </div>
          <div className="col-md-1">
            <label className="form-label small mb-1">Orden</label>
            <select className="form-select" name="order" value={filters.order} onChange={handleFilterChange}>
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
          <div className="col-md-2 d-flex gap-2">
            <button className="btn btn-dark w-100" type="submit">Aplicar</button>
            <button className="btn btn-outline-secondary w-100" type="button" onClick={clearFilters}>Limpiar</button>
          </div>
        </div>
      </form>}

      <Loader visible={loading} />

      {!loading && (
        <>
          <h2 className="h5 mb-3">{currentView.resultLabel}</h2>
          {animes.length > 0 ? (
            <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3 mb-3">
              {animes.map((anime) => (
                <AnimeCard
                  key={anime._id}
                  anime={anime}
                  onDelete={setSelectedAnime}
                  onToggleLibrary={toggleLibrary}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="card card-body text-center text-secondary border-0 shadow-sm mb-3">No hay animes en esta sección.</div>
          )}

          <div className="d-flex justify-content-between align-items-center mb-4">
            <span className="text-secondary small">Página {page} / {totalPages}</span>
            <div className="btn-group">
              <button className="btn btn-outline-dark" disabled={page <= 1} onClick={() => loadAnimes(page - 1, filters)}>Anterior</button>
              <button className="btn btn-outline-dark" disabled={page >= totalPages} onClick={() => loadAnimes(page + 1, filters)}>Siguiente</button>
            </div>
          </div>

          {isCatalogView && <div className="row g-4">
            <div className="col-lg-6">
              <h3 className="h6 text-uppercase text-secondary mb-2">Tendencias</h3>
              <div className="list-group shadow-sm rounded">
                {discover.trending.slice(0, 5).map((anime) => (
                  <Link key={anime._id} to={`/animes/${anime._id}`} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                    <span>{anime.title}</span>
                    <span className="badge text-bg-warning">★ {anime.rating.toFixed(1)}</span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="col-lg-6">
              <h3 className="h6 text-uppercase text-secondary mb-2">Mejor valorados</h3>
              <div className="list-group shadow-sm rounded">
                {discover.topRated.slice(0, 5).map((anime) => (
                  <Link key={anime._id} to={`/animes/${anime._id}`} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                    <span>{anime.title}</span>
                    <span className="badge text-bg-warning">★ {anime.rating.toFixed(1)}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>}
        </>
      )}

      <ConfirmModal
        open={Boolean(selectedAnime)}
        message={`¿Eliminar anime ${selectedAnime?.title || ''}?`}
        onCancel={() => setSelectedAnime(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
