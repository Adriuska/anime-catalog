import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/axios';
import { meApi } from '../../api/me';
import Loader from '../../components/Loader';
import AlertMessage from '../../components/AlertMessage';
import ConfirmModal from '../../components/ConfirmModal';
import ModalSeleccionarLista from '../../components/ModalSeleccionarLista';
import { getAnimeImageByTitle, getPreferredAnimeImage } from '../../utils/animeImages';

const initialFilters = {
  search: '',
  genre: '',
  season: '',
  yearFrom: '',
  yearTo: '',
  isOngoing: '',
  animeType: '',
  episodesMin: '',
  episodesMax: '',
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
  favorites: {
    title: 'Mis Favoritos',
    description: 'Tus animes favoritos privados por usuario.',
    resultLabel: 'Títulos favoritos',
  },
};

const buildParams = (pageNumber, filters) => {
  const rawParams = { page: pageNumber, limit: 12, includeExternal: true, ...filters };
  return Object.fromEntries(
    Object.entries(rawParams).filter(([, value]) => value !== '' && value !== undefined && value !== null)
  );
};

const buildExternalAnimePayload = (anime) => {
  if (!anime?.external) return null;

  return {
    title: anime.title,
    description: anime.description,
    posterUrl: anime.posterUrl,
    bannerUrl: anime.bannerUrl,
    episodes: anime.episodes,
    releaseDate: anime.releaseDate,
    isOngoing: anime.isOngoing,
    rating: anime.rating,
    genres: anime.genres,
    animeType: anime.animeType,
    season: anime.season,
    sourceRefs: anime.sourceRefs,
  };
};

function AnimeCard({ anime, onDelete, onAddToList, onToggleFavorite }) {
  const fallbackPoster = getAnimeImageByTitle(anime.title, 'poster');
  const canManageLocalAnime = !anime.external;

  const handleImageError = (event) => {
    const img = event.currentTarget;
    const attemptCount = parseInt(img.dataset.attempt || '0', 10);

    if (attemptCount === 0) {
      img.dataset.attempt = '1';
      img.src = fallbackPoster;
      return;
    }

    if (attemptCount === 1) {
      img.dataset.attempt = '2';
      img.src = 'https://placehold.co/600x900/1a1a2e/00d4ff?text=No+Image';
      return;
    }
  };

  return (
    <article className="col">
      <div className="card h-100 shadow-sm anime-card border-0">
        {canManageLocalAnime ? (
          <Link className="anime-poster-link" to={`/animes/${anime._id}`} aria-label={`Abrir ${anime.title}`}>
            <img
              src={getPreferredAnimeImage(anime, 'poster')}
              className="card-img-top anime-poster"
              alt={anime.title}
              data-attempt="0"
              onError={handleImageError}
              loading="lazy"
            />
          </Link>
        ) : (
          <img
            src={getPreferredAnimeImage(anime, 'poster')}
            className="card-img-top anime-poster"
            alt={anime.title}
            data-attempt="0"
            onError={handleImageError}
            loading="lazy"
          />
        )}
        <div className="card-body d-flex flex-column">
          <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
            <h5 className="card-title mb-0 anime-title">{anime.title}</h5>
            <span className="badge text-bg-warning">★ {anime.rating.toFixed(1)}</span>
          </div>
          <div className="small text-secondary mb-2">{anime.studio?.name || 'Independiente'} · {anime.year || 'N/D'}</div>
          {anime.external && <div className="small text-info mb-2">Resultado externo (se guarda al añadir)</div>}
          <div className="d-flex flex-wrap gap-1 mb-3">
            {(anime.genres || []).slice(0, 3).map((genre) => (
              <span key={genre} className="badge rounded-pill text-bg-light border">{genre}</span>
            ))}
          </div>
          <div className="small text-secondary mb-3">{anime.isOngoing ? 'En emisión' : 'Finalizado'} · {anime.episodes} eps</div>
          <div className="d-flex flex-wrap gap-2 mb-3">
            <button className="btn btn-sm btn-outline-primary" onClick={() => onAddToList(anime)}>
              Añadir a lista
            </button>
            <button className={`btn btn-sm ${anime.isFavorite ? 'btn-warning' : 'btn-outline-warning'}`} onClick={() => onToggleFavorite(anime)}>
              {anime.isFavorite ? '★ Favorito' : '☆ Favorito'}
            </button>
          </div>
          <div className="mt-auto d-flex gap-2">
            {canManageLocalAnime && <button className="btn btn-sm btn-outline-danger ms-auto" onClick={() => onDelete(anime)}>Eliminar</button>}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function AnimeListPage({ view = 'catalog', isAuthenticated = false }) {
  const [animes, setAnimes] = useState([]);
  const [studios, setStudios] = useState([]);
  const [discover, setDiscover] = useState({
    topRated: [],
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
  const [userLists, setUserLists] = useState([]);
  const [showListModal, setShowListModal] = useState(false);
  const [selectedAnimeForModal, setSelectedAnimeForModal] = useState(null);

  const currentView = viewSettings[view] || viewSettings.catalog;
  const isCatalogView = view === 'catalog';
  const isFavoritesView = view === 'favorites';

  const formatApprox = (value, floor) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return `${floor}+`;
    }

    if (value < floor) {
      return `${floor}+`;
    }

    return `${value.toLocaleString('es-ES')}+`;
  };

  const loadLists = useCallback(async () => {
    if (!isAuthenticated) {
      setUserLists([]);
      return [];
    }

    try {
      const result = await meApi.getLists();
      const lists = result.data || [];
      setUserLists(lists);
      return lists;
    } catch {
      setError('No se pudieron cargar tus listas privadas.');
      return [];
    }
  }, [isAuthenticated]);

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

      if (isFavoritesView) {
        if (!isAuthenticated) {
          setAnimes([]);
          setPage(1);
          setTotalPages(1);
          return;
        }

        const favoritesResult = await meApi.getFavorites();
        const favoriteAnimes = (favoritesResult.data || [])
          .map((item) => ({ ...item.anime, isFavorite: true }))
          .filter((anime) => anime?._id);

        setAnimes(favoriteAnimes);
        setPage(1);
        setTotalPages(1);
        return;
      }

      const params = buildParams(pageNumber, nextFilters);
      const { data } = await api.get('/animes', { params });
      setAnimes(data.data);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch {
      setError('No se pudieron cargar los animes.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isFavoritesView]);

  useEffect(() => {
    setFilters(initialFilters);
    setPage(1);
    loadStudios();
    if (isAuthenticated) {
      loadLists();
    }
    if (view === 'catalog') {
      loadDiscover();
    }
  }, [view, isAuthenticated, loadAnimes, loadDiscover, loadLists, loadStudios]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      loadAnimes(page, filters);
    }, 250);

    return () => clearTimeout(debounce);
  }, [page, filters, loadAnimes]);

  const handleFilterChange = (event) => {
    setFilters((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setPage(1);
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

  const addToList = (anime) => {
    if (!isAuthenticated) {
      setError('Debes iniciar sesión para usar listas privadas.');
      return;
    }

    setSelectedAnimeForModal(anime);
    setShowListModal(true);
  };

  const toggleFavorite = async (anime) => {
    if (!isAuthenticated) {
      setError('Debes iniciar sesión para usar favoritos privados.');
      return;
    }

    try {
      if (anime.isFavorite) {
        await meApi.removeFavorite(anime._id);
        setSuccess('Eliminado de favoritos.');
      } else {
        await meApi.addFavorite(anime.external ? null : anime._id, buildExternalAnimePayload(anime));
        setSuccess('Añadido a favoritos.');
      }
      // Reload animes para sincronizar estado de favoritos
      await loadAnimes(page, filters);
    } catch (err) {
      setError('No se pudo actualizar favoritos.');
      console.error(err);
    }
  };

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">{currentView.title}</h1>
          <p className="text-secondary mb-0">{currentView.description}</p>
        </div>
      </div>

      <div className="d-flex flex-wrap gap-2 mb-4">
        <Link className={`btn btn-sm ${view === 'catalog' ? 'btn-dark' : 'btn-outline-dark'}`} to="/animes">Catálogo</Link>
        <Link className="btn btn-sm btn-outline-dark" to="/library">Mis listas</Link>
        <Link className={`btn btn-sm ${view === 'favorites' ? 'btn-dark' : 'btn-outline-dark'}`} to="/favorites">Favoritos</Link>
      </div>

      {isFavoritesView && !isAuthenticated && (
        <div className="card card-body border-0 shadow-sm mb-3">
          <span className="text-secondary">Inicia sesión para ver tus favoritos privados.</span>
          <div className="mt-2">
            <Link className="btn btn-sm btn-primary" to="/auth">Iniciar sesión</Link>
          </div>
        </div>
      )}

      <AlertMessage message={error} type="danger" />
      <AlertMessage message={success} type="success" />

      {isCatalogView && <section className="row g-3 mb-4">
        <div className="col-md-4"><div className="card border-0 shadow-sm card-body"><div className="text-secondary small">Total de títulos</div><div className="h4 mb-0">{formatApprox(discover.stats.total, 1000)}</div></div></div>
        <div className="col-md-4"><div className="card border-0 shadow-sm card-body"><div className="text-secondary small">En emisión</div><div className="h4 mb-0">{formatApprox(discover.stats.ongoing, 300)}</div></div></div>
        <div className="col-md-4"><div className="card border-0 shadow-sm card-body"><div className="text-secondary small">Próximos</div><div className="h4 mb-0">{formatApprox(discover.stats.upcoming, 120)}</div></div></div>
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

      {showFilters && <div className="card border-0 shadow-sm card-body mb-4">
        <div className="small text-secondary mb-3">Los filtros se aplican automaticamente mientras escribes o seleccionas opciones.</div>
        <div className="row g-2 align-items-end">
          <div className="col-md-4"><label className="form-label small mb-1">Buscar</label><input className="form-control" name="search" value={filters.search} onChange={handleFilterChange} placeholder="Titulo..." /></div>
          <div className="col-md-2">
            <label className="form-label small mb-1">Género</label>
            <select className="form-select" name="genre" value={filters.genre} onChange={handleFilterChange}>
              <option value="">Todos los géneros</option>
              {discover.genres.map((genre) => <option key={genre} value={genre}>{genre}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label small mb-1">Estado</label>
            <select className="form-select" name="isOngoing" value={filters.isOngoing} onChange={handleFilterChange}>
              <option value="">Todos los estados</option>
              <option value="true">En emisión</option>
              <option value="false">Finalizado</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label small mb-1">Tipo</label>
            <select className="form-select" name="animeType" value={filters.animeType} onChange={handleFilterChange}>
              <option value="">Todos los tipos</option>
              <option value="TV">TV</option>
              <option value="OVA">OVA</option>
              <option value="ONA">ONA</option>
              <option value="Movie">Movie</option>
              <option value="Special">Special</option>
            </select>
          </div>
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
          <div className="col-md-2">
            <label className="form-label small mb-1">Orden</label>
            <select className="form-select" name="order" value={filters.order} onChange={handleFilterChange}>
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
          <div className="col-md-12">
            <details>
              <summary className="small fw-semibold">Filtros avanzados</summary>
              <div className="row g-2 mt-2">
                <div className="col-md-3">
                  <label className="form-label small mb-1">Estudio</label>
                  <select className="form-select" name="studioId" value={filters.studioId} onChange={handleFilterChange}>
                    <option value="">Todos los estudios</option>
                    {studios.map((studio) => <option key={studio._id} value={studio._id}>{studio.name}</option>)}
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label small mb-1">Temporada</label>
                  <select className="form-select" name="season" value={filters.season} onChange={handleFilterChange}>
                    <option value="">Todas</option>
                    <option value="Invierno">Invierno</option>
                    <option value="Primavera">Primavera</option>
                    <option value="Verano">Verano</option>
                    <option value="Otoño">Otoño</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label small mb-1">Año desde</label>
                  <select className="form-select" name="yearFrom" value={filters.yearFrom} onChange={handleFilterChange}>
                    <option value="">Cualquiera</option>
                    <option value="1980">1980</option>
                    <option value="1990">1990</option>
                    <option value="2000">2000</option>
                    <option value="2010">2010</option>
                    <option value="2020">2020</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label small mb-1">Año hasta</label>
                  <select className="form-select" name="yearTo" value={filters.yearTo} onChange={handleFilterChange}>
                    <option value="">Cualquiera</option>
                    <option value="1990">1990</option>
                    <option value="2000">2000</option>
                    <option value="2010">2010</option>
                    <option value="2020">2020</option>
                    <option value="2026">2026</option>
                  </select>
                </div>
                <div className="col-md-1">
                  <label className="form-label small mb-1">Eps min</label>
                  <select className="form-select" name="episodesMin" value={filters.episodesMin} onChange={handleFilterChange}>
                    <option value="">-</option>
                    <option value="1">1</option>
                    <option value="12">12</option>
                    <option value="24">24</option>
                    <option value="50">50</option>
                  </select>
                </div>
                <div className="col-md-1">
                  <label className="form-label small mb-1">Eps max</label>
                  <select className="form-select" name="episodesMax" value={filters.episodesMax} onChange={handleFilterChange}>
                    <option value="">-</option>
                    <option value="12">12</option>
                    <option value="24">24</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
                <div className="col-md-1">
                  <label className="form-label small mb-1">Min ★</label>
                  <select className="form-select" name="minRating" value={filters.minRating} onChange={handleFilterChange}>
                    <option value="">-</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                  </select>
                </div>
                <div className="col-md-1">
                  <label className="form-label small mb-1">Max ★</label>
                  <select className="form-select" name="maxRating" value={filters.maxRating} onChange={handleFilterChange}>
                    <option value="">-</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                  </select>
                </div>
              </div>
            </details>
          </div>
          <div className="col-md-2 d-flex gap-2">
            <button className="btn btn-outline-secondary w-100" type="button" onClick={clearFilters}>Limpiar</button>
          </div>
        </div>
      </div>}

      <Loader visible={loading} />

      {!loading && (
        <>
          <h2 className="h5 mb-3">{currentView.resultLabel}</h2>
          {animes.length > 0 ? (
            <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4 g-3 mb-3">
              {animes.map((anime) => (
                <AnimeCard
                  key={anime._id}
                  anime={anime}
                  onDelete={setSelectedAnime}
                  onAddToList={addToList}
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
              <button className="btn btn-outline-dark" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>Anterior</button>
              <button className="btn btn-outline-dark" disabled={page >= totalPages} onClick={() => setPage((prev) => prev + 1)}>Siguiente</button>
            </div>
          </div>

          {isCatalogView && <div className="row g-4">
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

      {showListModal && selectedAnimeForModal && (
        <ModalSeleccionarLista
          animeId={selectedAnimeForModal.external ? null : selectedAnimeForModal._id}
          externalAnime={buildExternalAnimePayload(selectedAnimeForModal)}
          onClose={() => {
            setShowListModal(false);
            setSelectedAnimeForModal(null);
          }}
          onSuccess={() => {
            loadLists();
            loadAnimes(page, filters);
          }}
        />
      )}
    </>
  );
}
