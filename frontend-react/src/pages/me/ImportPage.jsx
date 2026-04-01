import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../../api/axios';
import AlertMessage from '../../components/AlertMessage';

const providers = [
  { key: 'anilist', label: 'AniList' },
  { key: 'jikan', label: 'Jikan' },
  { key: 'kitsu', label: 'Kitsu' },
];

export default function ImportPage({ isAuthenticated }) {
  const [query, setQuery] = useState('romance');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loadingProvider, setLoadingProvider] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const runImport = async (provider) => {
    try {
      setLoadingProvider(provider);
      setError('');
      const payload = {
        query: String(query || '').trim(),
        page: Math.max(1, Number(page) || 1),
        limit: Math.min(100, Math.max(1, Number(limit) || 10)),
      };

      const { data } = await api.post(`/import/${provider}`, payload);
      setResult(data);
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || 'No se pudo ejecutar la importacion.');
    } finally {
      setLoadingProvider('');
    }
  };

  return (
    <section>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Importacion externa</h1>
          <p className="text-secondary mb-0">Carga animes desde AniList, Jikan o Kitsu a tu base de datos.</p>
        </div>
      </div>

      <AlertMessage message={error} type="danger" />

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-5">
              <label className="form-label">Busqueda</label>
              <input className="form-control" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ej. psychological" />
            </div>
            <div className="col-md-2">
              <label className="form-label">Pagina</label>
              <input className="form-control" type="number" min="1" value={page} onChange={(event) => setPage(event.target.value)} />
            </div>
            <div className="col-md-2">
              <label className="form-label">Limite</label>
              <input className="form-control" type="number" min="1" max="100" value={limit} onChange={(event) => setLimit(event.target.value)} />
            </div>
            <div className="col-md-3 d-flex gap-2">
              {providers.map((provider) => (
                <button
                  key={provider.key}
                  className="btn btn-outline-primary flex-fill"
                  onClick={() => runImport(provider.key)}
                  disabled={Boolean(loadingProvider)}
                >
                  {loadingProvider === provider.key ? 'Importando...' : provider.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {result && (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <h2 className="h5 mb-3">Ultimo resultado</h2>
            <div className="row g-3">
              <div className="col-md-3"><div className="small text-secondary">Proveedor</div><div className="fw-semibold text-uppercase">{result.provider}</div></div>
              <div className="col-md-3"><div className="small text-secondary">Total recibido</div><div className="fw-semibold">{result.totalFetched}</div></div>
              <div className="col-md-3"><div className="small text-secondary">Nuevos</div><div className="fw-semibold">{result.imported}</div></div>
              <div className="col-md-3"><div className="small text-secondary">Actualizados</div><div className="fw-semibold">{result.updated}</div></div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
