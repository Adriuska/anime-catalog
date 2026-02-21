import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/axios';
import Loader from '../../components/Loader';
import AlertMessage from '../../components/AlertMessage';
import ConfirmModal from '../../components/ConfirmModal';

export default function StudioDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [studio, setStudio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    const fetchStudio = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/studios/${id}`);
        setStudio(data);
      } catch {
        setError('No se pudo cargar el estudio.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudio();
  }, [id]);

  const handleDelete = async () => {
    try {
      await api.delete(`/studios/${id}`);
      navigate('/studios');
    } catch {
      setError('No se pudo eliminar el estudio.');
      setDeleteOpen(false);
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between mb-3">
        <h2 className="mb-0">Detalle del estudio</h2>
        <Link className="btn btn-outline-secondary" to="/studios">Volver</Link>
      </div>
      <AlertMessage message={error} type="danger" />
      <Loader visible={loading} />

      {studio && !loading && (
        <div className="card">
          <div className="card-body">
            <h4>{studio.name}</h4>
            <p><strong>País:</strong> {studio.country || 'N/D'}</p>
            <p><strong>Fundado:</strong> {studio.foundedDate ? new Date(studio.foundedDate).toLocaleDateString() : 'N/D'}</p>
            <p><strong>Activo:</strong> {studio.isActive ? 'Sí' : 'No'}</p>
            <div className="d-flex gap-2">
              <Link className="btn btn-primary" to={`/studios/${studio._id}/edit`}>Editar</Link>
              <button className="btn btn-danger" onClick={() => setDeleteOpen(true)}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteOpen}
        message={`¿Eliminar estudio ${studio?.name || ''}?`}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
