import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import AnimeListPage from './pages/animes/AnimeListPage';
import AnimeDetailPage from './pages/animes/AnimeDetailPage';
import StudioListPage from './pages/studios/StudioListPage';
import StudioDetailPage from './pages/studios/StudioDetailPage';
import StudioFormPage from './pages/studios/StudioFormPage';
import AuthPage from './pages/auth/AuthPage';
import MyListsPage from './pages/me/MyListsPage';
import ImportPage from './pages/me/ImportPage';
import { api } from './api/axios';
import { clearStoredSession, getStoredToken, getStoredUser, setStoredSession } from './utils/authSession';
import { ROUTES, NAV_ITEMS } from './constants/routes';
import { useFavorites } from './hooks/useFavorites';
import './App.css';

function RequireAuth({ isAuthenticated, children }) {
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

function App() {
  const [token, setToken] = useState(getStoredToken());
  const [currentUser, setCurrentUser] = useState(getStoredUser());

  const isAuthenticated = Boolean(token && currentUser?._id);
  const { count: favoritesCount } = useFavorites(isAuthenticated);

  useEffect(() => {
    const refreshSession = async () => {
      if (!token) return;
      try {
        const { data } = await api.get('/auth/me');
        if (data?.user?._id) {
          setCurrentUser(data.user);
          setStoredSession({ token, user: data.user });
        }
      } catch {
        setToken('');
        setCurrentUser(null);
        clearStoredSession();
      }
    };

    refreshSession();
  }, [token]);

  const handleSessionChange = (nextToken, user) => {
    setToken(nextToken || '');
    setCurrentUser(user || null);

    if (nextToken && user) {
      setStoredSession({ token: nextToken, user });
      return;
    }

    clearStoredSession();
  };

  const logout = () => {
    handleSessionChange('', null);
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg app-navbar">
        <div className="container">
          <Link className="navbar-brand app-brand" to={ROUTES.HOME}>
            <span className="brand-dot" /> AniVerse
          </Link>
          <div className="collapse navbar-collapse show">
            <ul className="navbar-nav ms-auto app-nav-links">
              {NAV_ITEMS.map((item) => {
                if (item.requiresAuth && !isAuthenticated) return null;

                const isFavoritesItem = item.path === ROUTES.FAVORITES;

                return (
                  <li className="nav-item" key={item.path}>
                    <NavLink 
                      className={({ isActive }) => `nav-link app-nav-link ${isActive ? 'active' : ''}`} 
                      to={item.path}
                    >
                      {item.label}
                      {isFavoritesItem && favoritesCount > 0 && (
                        <span className="badge text-bg-warning ms-2">{favoritesCount}</span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
              {isAuthenticated ? (
                <li className="nav-item d-flex align-items-center gap-2 ms-lg-3">
                  <span className="small text-light-emphasis">{currentUser?.displayName || currentUser?.email}</span>
                  <button className="btn btn-sm btn-outline-light" onClick={logout}>Salir</button>
                </li>
              ) : (
                <li className="nav-item ms-lg-3">
                  <NavLink className={({ isActive }) => `nav-link app-nav-link ${isActive ? 'active' : ''}`} to={ROUTES.AUTH}>Acceder</NavLink>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>

      <main className="container py-4">
        <Routes>
          <Route path={ROUTES.AUTH} element={<AuthPage isAuthenticated={isAuthenticated} onSessionChange={handleSessionChange} />} />
          <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.ANIMES} replace />} />
          <Route path={ROUTES.ANIMES} element={<AnimeListPage view="catalog" isAuthenticated={isAuthenticated} />} />
          <Route path={ROUTES.LIBRARY} element={<RequireAuth isAuthenticated={isAuthenticated}><MyListsPage isAuthenticated={isAuthenticated} /></RequireAuth>} />
          <Route path={ROUTES.FAVORITES} element={<RequireAuth isAuthenticated={isAuthenticated}><AnimeListPage view="favorites" isAuthenticated={isAuthenticated} /></RequireAuth>} />
          <Route path="/animes/:id" element={<AnimeDetailPage isAuthenticated={isAuthenticated} />} />
          <Route path={ROUTES.STUDIOS} element={<RequireAuth isAuthenticated={isAuthenticated}><StudioListPage /></RequireAuth>} />
          <Route path={ROUTES.STUDIO_NEW} element={<RequireAuth isAuthenticated={isAuthenticated}><StudioFormPage /></RequireAuth>} />
          <Route path="/studios/:id" element={<RequireAuth isAuthenticated={isAuthenticated}><StudioDetailPage /></RequireAuth>} />
          <Route path="/studios/:id/edit" element={<RequireAuth isAuthenticated={isAuthenticated}><StudioFormPage /></RequireAuth>} />
          <Route path={ROUTES.IMPORT} element={<RequireAuth isAuthenticated={isAuthenticated}><ImportPage isAuthenticated={isAuthenticated} /></RequireAuth>} />
          <Route path="*" element={<Navigate to={ROUTES.ANIMES} replace />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <div className="container d-flex flex-wrap justify-content-between align-items-center gap-2 py-3">
          <span>AniVerse · Frontend React</span>
          <span className="text-secondary">Biblioteca privada · catálogo unificado</span>
        </div>
      </footer>
    </>
  );
}

export default App;
