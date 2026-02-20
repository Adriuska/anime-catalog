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
      setError('Failed to load studios.');
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
      setSuccess('Studio deleted successfully.');
      setSelectedStudio(null);
      loadStudios();
    } catch {
      setError('Failed to delete studio.');
      setSelectedStudio(null);
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Studios</h2>
        <Link className="btn btn-primary" to="/studios/new">New Studio</Link>
      </div>

      <AlertMessage message={error} type="danger" />
      <AlertMessage message={success} type="success" />
      <Loader visible={loading} />

      {!loading && (
        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead>
              <tr><th>Name</th><th>Country</th><th>Active</th><th className="text-end">Actions</th></tr>
            </thead>
            <tbody>
              {studios.map((studio) => (
                <tr key={studio._id}>
                  <td>{studio.name}</td>
                  <td>{studio.country || 'N/A'}</td>
                  <td>{studio.isActive ? 'Yes' : 'No'}</td>
                  <td className="text-end">
                    <Link className="btn btn-sm btn-outline-primary me-2" to={`/studios/${studio._id}`}>Detail</Link>
                    <Link className="btn btn-sm btn-outline-secondary me-2" to={`/studios/${studio._id}/edit`}>Edit</Link>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => setSelectedStudio(studio)}>Delete</button>
                  </td>
                </tr>
              ))}
              {studios.length === 0 && <tr><td colSpan="4" className="text-center">No studios found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={Boolean(selectedStudio)}
        message={`Delete studio ${selectedStudio?.name || ''}?`}
        onCancel={() => setSelectedStudio(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
