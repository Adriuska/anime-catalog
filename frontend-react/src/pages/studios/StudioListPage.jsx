import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/axios';
import Loader from '../../components/Loader';
import AlertMessage from '../../components/AlertMessage';
import ConfirmModal from '../../components/ConfirmModal';

export default function StudioListPage() {
  const [studios, setStudios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedStudio, setSelectedStudio] = useState(null);

  const loadStudios = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/studios');
      setStudios(data);
    } catch {
      setError('No se pudieron cargar los estudios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudios();
  }, []);

  const handleDelete = async () => {
    if (!selectedStudio?._id) return;
    try {
      await api.delete(`/studios/${selectedStudio._id}`);
      setSuccess('Estudio eliminado correctamente.');
      setSelectedStudio(null);
      loadStudios();
    } catch {
      setError('No se pudo eliminar el estudio.');
      setSelectedStudio(null);
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Estudios</h2>
        <Link className="btn btn-primary" to="/studios/new">Nuevo estudio</Link>
      </div>

      <AlertMessage message={error} type="danger" />
      <AlertMessage message={success} type="success" />
      <Loader visible={loading} />

      {!loading && (
        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead>
              <tr><th>Nombre</th><th>País</th><th>Activo</th><th className="text-end">Acciones</th></tr>
            </thead>
            <tbody>
              {studios.map((studio) => (
                <tr key={studio._id}>
                  <td>{studio.name}</td>
                  <td>{studio.country || 'N/D'}</td>
                  <td>{studio.isActive ? 'Sí' : 'No'}</td>
                  <td className="text-end">
                    <Link className="btn btn-sm btn-outline-primary me-2" to={`/studios/${studio._id}`}>Detalle</Link>
                    <Link className="btn btn-sm btn-outline-secondary me-2" to={`/studios/${studio._id}/edit`}>Editar</Link>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => setSelectedStudio(studio)}>Eliminar</button>
                  </td>
                </tr>
              ))}
              {studios.length === 0 && <tr><td colSpan="4" className="text-center">No se encontraron estudios.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={Boolean(selectedStudio)}
        message={`¿Eliminar estudio ${selectedStudio?.name || ''}?`}
        onCancel={() => setSelectedStudio(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
