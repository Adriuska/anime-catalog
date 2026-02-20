import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/axios';
import Loader from '../../components/Loader';
import AlertMessage from '../../components/AlertMessage';

const initialForm = {
  name: '',
  country: '',
  foundedDate: '',
  isActive: true,
};

export default function StudioFormPage() {
  const { id } = useParams();
  const isEdit = useMemo(() => Boolean(id), [id]);
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStudio = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const { data } = await api.get(`/studios/${id}`);
        setForm({
          name: data.name,
          country: data.country || '',
          foundedDate: data.foundedDate?.slice(0, 10) || '',
          isActive: data.isActive,
        });
      } catch {
        setError('Failed to load studio.');
      } finally {
        setLoading(false);
      }
    };

    loadStudio();
  }, [id]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const payload = {
        name: form.name.trim(),
        country: form.country.trim() || undefined,
        foundedDate: form.foundedDate || undefined,
        isActive: Boolean(form.isActive),
      };

      if (isEdit) {
        await api.patch(`/studios/${id}`, payload);
      } else {
        await api.post('/studios', payload);
      }

      navigate('/studios');
    } catch {
      setError('Failed to save studio.');
      setLoading(false);
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">{isEdit ? 'Edit Studio' : 'New Studio'}</h2>
        <Link className="btn btn-outline-secondary" to="/studios">Back</Link>
      </div>

      <AlertMessage message={error} type="danger" />

      <form className="card card-body" onSubmit={submit}>
        <div className="row g-3">
          <div className="col-md-6"><label className="form-label">Name</label><input className="form-control" name="name" value={form.name} onChange={handleChange} /></div>
          <div className="col-md-6"><label className="form-label">Country</label><input className="form-control" name="country" value={form.country} onChange={handleChange} /></div>
          <div className="col-md-4"><label className="form-label">Founded Date</label><input type="date" className="form-control" name="foundedDate" value={form.foundedDate} onChange={handleChange} /></div>
          <div className="col-md-4 d-flex align-items-end"><div className="form-check"><input id="isActive" type="checkbox" className="form-check-input" name="isActive" checked={form.isActive} onChange={handleChange} /><label className="form-check-label" htmlFor="isActive">Active</label></div></div>
        </div>
        <div className="mt-3"><button className="btn btn-primary" disabled={loading} type="submit">{isEdit ? 'Update' : 'Create'}</button></div>
      </form>

      <Loader visible={loading} />
    </>
  );
}
