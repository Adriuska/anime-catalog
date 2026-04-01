import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api } from '../../api/axios';
import AlertMessage from '../../components/AlertMessage';

const initialForm = {
  email: '',
  password: '',
  displayName: '',
};

export default function AuthPage({ isAuthenticated, onSessionChange }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/animes" replace />;
  }

  const submit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError('');

      const url = mode === 'register' ? '/auth/register' : '/auth/login';
      const payload =
        mode === 'register'
          ? {
              email: form.email,
              password: form.password,
              displayName: form.displayName,
            }
          : {
              email: form.email,
              password: form.password,
            };

      const { data } = await api.post(url, payload);
      onSessionChange(data.token, data.user);
      navigate('/animes', { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || 'No se pudo autenticar el usuario.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  return (
    <section className="auth-shell mx-auto" style={{ maxWidth: '560px' }}>
      <div className="card border-0 shadow-sm">
        <div className="card-body p-4 p-md-5">
          <p className="text-uppercase small text-secondary mb-2">Sesion privada</p>
          <h1 className="h4 mb-3">{mode === 'register' ? 'Crear cuenta' : 'Iniciar sesion'}</h1>
          <p className="text-secondary mb-4">
            Tus listas y favoritos se guardan por usuario para que no se mezclen ni se pierdan.
          </p>

          <AlertMessage message={error} type="danger" />

          <form onSubmit={submit} className="d-grid gap-3">
            {mode === 'register' && (
              <div>
                <label className="form-label">Nombre visible</label>
                <input
                  className="form-control"
                  name="displayName"
                  value={form.displayName}
                  onChange={updateField}
                  required
                  minLength={2}
                />
              </div>
            )}

            <div>
              <label className="form-label">Email</label>
              <input
                className="form-control"
                name="email"
                type="email"
                value={form.email}
                onChange={updateField}
                required
              />
            </div>

            <div>
              <label className="form-label">Contrasena</label>
              <input
                className="form-control"
                name="password"
                type="password"
                value={form.password}
                onChange={updateField}
                required
                minLength={8}
              />
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Procesando...' : mode === 'register' ? 'Crear cuenta' : 'Entrar'}
            </button>
          </form>

          <div className="mt-3">
            {mode === 'register' ? 'Ya tienes cuenta?' : 'Aun no tienes cuenta?'}{' '}
            <button
              type="button"
              className="btn btn-link p-0 align-baseline"
              onClick={() => {
                setError('');
                setMode((prev) => (prev === 'register' ? 'login' : 'register'));
              }}
            >
              {mode === 'register' ? 'Inicia sesion' : 'Registrate'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
