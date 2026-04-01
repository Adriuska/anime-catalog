import { useEffect, useState } from 'react';
import { meApi } from '../api/me';

export default function ModalSeleccionarLista({ animeId, externalAnime, onClose, onSuccess }) {
  const [listas, setListas] = useState([]);
  const [selectedListId, setSelectedListId] = useState('');
  const [nuevaLista, setNuevaLista] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargarListas = async () => {
      try {
        const response = await meApi.getLists();
        const nextLists = response.data || [];
        setListas(nextLists);
        if (nextLists.length) {
          setSelectedListId(nextLists[0]._id);
        }
      } catch (err) {
        setError('Error al cargar listas');
        console.error(err);
      }
    };
    cargarListas();
  }, []);

  const handleCrearNuevaLista = async () => {
    if (!nuevaLista.trim()) {
      setError('El nombre de la lista no puede estar vacío');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const listaCreada = await meApi.createList(nuevaLista.trim());
      setListas((prev) => [...prev, listaCreada]);
      setSelectedListId(listaCreada._id);
      setNuevaLista('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear la lista');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarALista = async () => {
    if (!selectedListId) {
      setError('Selecciona una lista o crea una nueva');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await meApi.addListItem(selectedListId, animeId, externalAnime);
      if (onSuccess) {
        onSuccess(selectedListId);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al agregar a la lista');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content bg-dark text-light">
          <div className="modal-header border-secondary">
            <h5 className="modal-title">Seleccionar lista</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} disabled={loading} />
          </div>

          <div className="modal-body">
            {error && (
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                {error}
                <button type="button" className="btn-close" onClick={() => setError('')} />
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="listasSelect" className="form-label fw-bold">
                Mis listas
              </label>
              <select
                id="listasSelect"
                className="form-select form-select-sm bg-secondary text-light border-0"
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value)}
                disabled={loading}
              >
                <option value="">-- Selecciona una lista --</option>
                {listas.map((lista) => (
                  <option key={lista._id} value={lista._id}>
                    {lista.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="form-label fw-bold">O crea una nueva lista</label>
              <div className="input-group input-group-sm">
                <input
                  type="text"
                  className="form-control bg-secondary text-light border-0"
                  placeholder="Nombre de la lista..."
                  value={nuevaLista}
                  onChange={(e) => setNuevaLista(e.target.value)}
                  disabled={loading}
                  onKeyPress={(e) => e.key === 'Enter' && handleCrearNuevaLista()}
                />
                <button
                  type="button"
                  className="btn btn-outline-success btn-sm"
                  onClick={handleCrearNuevaLista}
                  disabled={loading}
                >
                  {loading ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </div>

            <small className="text-muted d-block">
              El anime será agregado a la lista seleccionada
            </small>
          </div>

          <div className="modal-footer border-secondary">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleAgregarALista}
              disabled={!selectedListId || loading}
            >
              {loading ? 'Agregando...' : 'Agregar a lista'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
