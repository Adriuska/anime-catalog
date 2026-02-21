import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import AnimeListPage from './pages/animes/AnimeListPage';
import AnimeDetailPage from './pages/animes/AnimeDetailPage';
import AnimeFormPage from './pages/animes/AnimeFormPage';
import StudioListPage from './pages/studios/StudioListPage';
import StudioDetailPage from './pages/studios/StudioDetailPage';
import StudioFormPage from './pages/studios/StudioFormPage';
import './App.css';

function App() {
  return (
    <>
      <nav className="navbar navbar-expand-lg app-navbar">
        <div className="container">
          <Link className="navbar-brand app-brand" to="/animes">
            <span className="brand-dot" /> AniVerse
          </Link>
          <div className="collapse navbar-collapse show">
            <ul className="navbar-nav ms-auto app-nav-links">
              <li className="nav-item">
                <NavLink className={({ isActive }) => `nav-link app-nav-link ${isActive ? 'active' : ''}`} to="/animes">Explorar</NavLink>
              </li>
              <li className="nav-item">
                <NavLink className={({ isActive }) => `nav-link app-nav-link ${isActive ? 'active' : ''}`} to="/library">Biblioteca</NavLink>
              </li>
              <li className="nav-item">
                <NavLink className={({ isActive }) => `nav-link app-nav-link ${isActive ? 'active' : ''}`} to="/favorites">Favoritos</NavLink>
              </li>
              <li className="nav-item">
                <NavLink className={({ isActive }) => `nav-link app-nav-link ${isActive ? 'active' : ''}`} to="/studios">Estudios</NavLink>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <main className="container py-4">
        <Routes>
          <Route path="/" element={<Navigate to="/animes" replace />} />
          <Route path="/animes" element={<AnimeListPage view="catalog" />} />
          <Route path="/library" element={<AnimeListPage view="library" />} />
          <Route path="/favorites" element={<AnimeListPage view="favorites" />} />
          <Route path="/animes/new" element={<AnimeFormPage />} />
          <Route path="/animes/:id" element={<AnimeDetailPage />} />
          <Route path="/animes/:id/edit" element={<AnimeFormPage />} />
          <Route path="/studios" element={<StudioListPage />} />
          <Route path="/studios/new" element={<StudioFormPage />} />
          <Route path="/studios/:id" element={<StudioDetailPage />} />
          <Route path="/studios/:id/edit" element={<StudioFormPage />} />
          <Route path="*" element={<Navigate to="/animes" replace />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <div className="container d-flex flex-wrap justify-content-between align-items-center gap-2 py-3">
          <span>AniVerse · Frontend React</span>
          <span className="text-secondary">Catálogo CRUD · demo visual</span>
        </div>
      </footer>
    </>
  );
}

export default App;
