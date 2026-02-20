import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/axios';
import Loader from '../../components/Loader';
import AlertMessage from '../../components/AlertMessage';
import ConfirmModal from '../../components/ConfirmModal';

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

const buildParams = (pageNumber, filters) => {
  const rawParams = { page: pageNumber, limit: 12, ...filters };
  return Object.fromEntries(
    Object.entries(rawParams).filter(([, value]) => value !== '' && value !== undefined && value !== null)
  );
};

function AnimeCard({ anime, onDelete }) {
  return (
    <article className="col">
      <div className="card h-100 shadow-sm anime-card border-0">
        <img src={anime.posterUrl} className="card-img-top anime-poster" alt={anime.title} />
        <div className="card-body d-flex flex-column">
          <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
            <h5 className="card-title mb-0 anime-title">{anime.title}</h5>
            <span className="badge text-bg-warning">★ {anime.rating.toFixed(1)}</span>
          </div>
          <div className="small text-secondary mb-2">{anime.studio?.name || 'Independent'} · {anime.year || 'N/A'}</div>
          <div className="d-flex flex-wrap gap-1 mb-3">
            {(anime.genres || []).slice(0, 3).map((genre) => (
              <span key={genre} className="badge rounded-pill text-bg-light border">{genre}</span>
            ))}
          </div>
          <div className="small text-secondary mb-3">{anime.isOngoing ? 'Ongoing' : 'Finished'} · {anime.episodes} eps</div>
          <div className="mt-auto d-flex gap-2">
            <Link className="btn btn-sm btn-primary" to={`/animes/${anime._id}`}>Detail</Link>
            <Link className="btn btn-sm btn-outline-secondary" to={`/animes/${anime._id}/edit`}>Edit</Link>
            <button className="btn btn-sm btn-outline-danger ms-auto" onClick={() => onDelete(anime)}>Delete</button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function AnimeListPage() {
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

  const loadStudios = async () => {
    try {
      const { data } = await api.get('/studios');
      setStudios(data);
    } catch {
      setError('Failed to load studios.');
    }
  };

  const loadDiscover = async () => {
    try {
      const { data } = await api.get('/animes/discover');
      setDiscover(data);
    } catch {
      setError('Failed to load highlights.');
    }
  };

  const loadAnimes = async (pageNumber = page, nextFilters = filters) => {
    try {
      setLoading(true);
      setError('');
      const params = buildParams(pageNumber, nextFilters);
      const { data } = await api.get('/animes', { params });
      setAnimes(data.data);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch {
      setError('Failed to load animes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudios();
    loadDiscover();
    loadAnimes(1);
  }, []);

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
      setSuccess('Anime deleted successfully.');
      setSelectedAnime(null);
      loadAnimes(page, filters);
      loadDiscover();
    } catch {
      setError('Failed to delete anime.');
      setSelectedAnime(null);
    }
  };

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">Anime Streaming Catalog</h1>
          <p className="text-secondary mb-0">Descubre, filtra y gestiona tu biblioteca como una mini plataforma tipo Crunchy.</p>
        </div>
        <Link className="btn btn-primary" to="/animes/new">+ New Anime</Link>
      </div>

      <AlertMessage message={error} type="danger" />
      <AlertMessage message={success} type="success" />

      {discover.hero && (
        <section className="card border-0 overflow-hidden shadow-sm mb-4 anime-hero">
          <div className="row g-0">
            <div className="col-lg-4">
              <img src={discover.hero.posterUrl} alt={discover.hero.title} className="img-fluid w-100 h-100 object-fit-cover" />
            </div>
            <div className="col-lg-8">
              <div className="card-body p-4 h-100 d-flex flex-column">
                <span className="badge text-bg-warning align-self-start mb-2">Top pick</span>
                <h2 className="h4 mb-2">{discover.hero.title}</h2>
                <p className="text-secondary mb-3">{discover.hero.description}</p>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {(discover.hero.genres || []).map((genre) => (
                    <span key={genre} className="badge rounded-pill text-bg-light border">{genre}</span>
                  ))}
                </div>
                <div className="d-flex flex-wrap gap-3 small text-secondary mb-4">
                  <span>★ {discover.hero.rating.toFixed(1)}</span>
                  <span>{discover.hero.episodes} episodes</span>
                  <span>{discover.hero.studio?.name || 'Independent'}</span>
                </div>
                <div className="mt-auto d-flex gap-2">
                  <Link className="btn btn-primary" to={`/animes/${discover.hero._id}`}>View details</Link>
                  <Link className="btn btn-outline-secondary" to={`/animes/${discover.hero._id}/edit`}>Edit</Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="row g-3 mb-4">
        <div className="col-md-4"><div className="card border-0 shadow-sm card-body"><div className="text-secondary small">Total titles</div><div className="h4 mb-0">{discover.stats.total}</div></div></div>
        <div className="col-md-4"><div className="card border-0 shadow-sm card-body"><div className="text-secondary small">Currently ongoing</div><div className="h4 mb-0">{discover.stats.ongoing}</div></div></div>
        <div className="col-md-4"><div className="card border-0 shadow-sm card-body"><div className="text-secondary small">Upcoming</div><div className="h4 mb-0">{discover.stats.upcoming}</div></div></div>
      </section>

      <form className="card border-0 shadow-sm card-body mb-4" onSubmit={applyFilters}>
        <h2 className="h5 mb-3">Explore catalog</h2>
        <div className="row g-2 align-items-end">
          <div className="col-md-3"><label className="form-label small mb-1">Search</label><input className="form-control" name="search" value={filters.search} onChange={handleFilterChange} placeholder="Title..." /></div>
          <div className="col-md-2">
            <label className="form-label small mb-1">Genre</label>
            <select className="form-select" name="genre" value={filters.genre} onChange={handleFilterChange}>
              <option value="">All genres</option>
              {discover.genres.map((genre) => <option key={genre} value={genre}>{genre}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label small mb-1">Season</label>
            <select className="form-select" name="season" value={filters.season} onChange={handleFilterChange}>
              <option value="">All seasons</option>
              <option value="Winter">Winter</option>
              <option value="Spring">Spring</option>
              <option value="Summer">Summer</option>
              <option value="Fall">Fall</option>
            </select>
          </div>
          <div className="col-md-1"><label className="form-label small mb-1">Year</label><input className="form-control" name="year" value={filters.year} onChange={handleFilterChange} placeholder="2024" /></div>
          <div className="col-md-2">
            <select className="form-select" name="isOngoing" value={filters.isOngoing} onChange={handleFilterChange}>
              <option value="">All status</option>
              <option value="true">Ongoing</option>
              <option value="false">Finished</option>
            </select>
          </div>
          <div className="col-md-2">
            <select className="form-select" name="studioId" value={filters.studioId} onChange={handleFilterChange}>
              <option value="">All studios</option>
              {studios.map((studio) => <option key={studio._id} value={studio._id}>{studio.name}</option>)}
            </select>
          </div>
          <div className="col-md-1"><label className="form-label small mb-1">Min ★</label><input className="form-control" name="minRating" value={filters.minRating} onChange={handleFilterChange} placeholder="0" /></div>
          <div className="col-md-1"><label className="form-label small mb-1">Max ★</label><input className="form-control" name="maxRating" value={filters.maxRating} onChange={handleFilterChange} placeholder="10" /></div>
          <div className="col-md-2">
            <label className="form-label small mb-1">Sort by</label>
            <select className="form-select" name="sortBy" value={filters.sortBy} onChange={handleFilterChange}>
              <option value="createdAt">Recently added</option>
              <option value="rating">Rating</option>
              <option value="releaseDate">Release date</option>
              <option value="title">Title</option>
              <option value="episodes">Episodes</option>
            </select>
          </div>
          <div className="col-md-1">
            <label className="form-label small mb-1">Order</label>
            <select className="form-select" name="order" value={filters.order} onChange={handleFilterChange}>
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
          <div className="col-md-2 d-flex gap-2">
            <button className="btn btn-dark w-100" type="submit">Apply</button>
            <button className="btn btn-outline-secondary w-100" type="button" onClick={clearFilters}>Reset</button>
          </div>
        </div>
      </form>

      <Loader visible={loading} />

      {!loading && (
        <>
          <h2 className="h5 mb-3">Catalog results</h2>
          {animes.length > 0 ? (
            <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3 mb-3">
              {animes.map((anime) => <AnimeCard key={anime._id} anime={anime} onDelete={setSelectedAnime} />)}
            </div>
          ) : (
            <div className="card card-body text-center text-secondary border-0 shadow-sm mb-3">No animes found with current filters.</div>
          )}

          <div className="d-flex justify-content-between align-items-center mb-4">
            <span className="text-secondary small">Page {page} / {totalPages}</span>
            <div className="btn-group">
              <button className="btn btn-outline-dark" disabled={page <= 1} onClick={() => loadAnimes(page - 1, filters)}>Prev</button>
              <button className="btn btn-outline-dark" disabled={page >= totalPages} onClick={() => loadAnimes(page + 1, filters)}>Next</button>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-lg-6">
              <h3 className="h6 text-uppercase text-secondary mb-2">Trending now</h3>
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
              <h3 className="h6 text-uppercase text-secondary mb-2">Top rated</h3>
              <div className="list-group shadow-sm rounded">
                {discover.topRated.slice(0, 5).map((anime) => (
                  <Link key={anime._id} to={`/animes/${anime._id}`} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                    <span>{anime.title}</span>
                    <span className="badge text-bg-warning">★ {anime.rating.toFixed(1)}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <ConfirmModal
        open={Boolean(selectedAnime)}
        message={`Delete anime ${selectedAnime?.title || ''}?`}
        onCancel={() => setSelectedAnime(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
