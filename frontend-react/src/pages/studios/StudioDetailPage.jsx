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
        setError('Failed to load studio.');
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
      setError('Failed to delete studio.');
      setDeleteOpen(false);
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between mb-3">
        <h2 className="mb-0">Studio Detail</h2>
        <Link className="btn btn-outline-secondary" to="/studios">Back</Link>
      </div>
      <AlertMessage message={error} type="danger" />
      <Loader visible={loading} />

      {studio && !loading && (
        <div className="card">
          <div className="card-body">
            <h4>{studio.name}</h4>
            <p><strong>Country:</strong> {studio.country || 'N/A'}</p>
            <p><strong>Founded:</strong> {studio.foundedDate ? new Date(studio.foundedDate).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Active:</strong> {studio.isActive ? 'Yes' : 'No'}</p>
            <div className="d-flex gap-2">
              <Link className="btn btn-primary" to={`/studios/${studio._id}/edit`}>Edit</Link>
              <button className="btn btn-danger" onClick={() => setDeleteOpen(true)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteOpen}
        message={`Delete studio ${studio?.name || ''}?`}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
