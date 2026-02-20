import { Link, Navigate, Route, Routes } from 'react-router-dom';
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
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <Link className="navbar-brand fw-semibold" to="/animes">AniVerse</Link>
          <div className="collapse navbar-collapse show">
            <ul className="navbar-nav me-auto">
              <li className="nav-item"><Link className="nav-link" to="/animes">Browse</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/studios">Studios</Link></li>
            </ul>
          </div>
        </div>
      </nav>

      <main className="container py-4">
        <Routes>
          <Route path="/" element={<Navigate to="/animes" replace />} />
          <Route path="/animes" element={<AnimeListPage />} />
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
    </>
  );
}

export default App;
