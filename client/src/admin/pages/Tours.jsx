import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import adminApi from '../api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import { formatMoney } from '../../lib/format';

export default function Tours() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminApi
      .get('/tours')
      .then((payload) => setRows(payload.tours || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const duplicate = async (id) => {
    try {
      await adminApi.post(`/tours/${id}/duplicate`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const deactivate = async (tour) => {
    if (!window.confirm(`Deactivate "${tour.name}"? It will disappear from the public site but existing bookings stay.`)) return;
    try {
      await adminApi.del(`/tours/${tour.id}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Tours"
        subtitle="Canyons, pricing, capacity and everything shown on package pages."
        actions={<Link className="admin-btn primary" to="/admin/tours/new">New tour</Link>}
      />

      {error ? <p className="admin-error">{error}</p> : null}

      <div className="admin-panel flush">
        <DataTable
          loading={loading}
          rows={rows}
          rowKey="id"
          empty="No tours yet."
          columns={[
            {
              key: 'name',
              label: 'Tour',
              render: (value, row) => (
                <div className="admin-cell-stack">
                  <strong>{value}</strong>
                  <small>{row.id} · {row.duration}</small>
                </div>
              ),
            },
            { key: 'level', label: 'Level' },
            { key: 'price', label: 'Price', render: (value) => formatMoney(value) },
            { key: 'daily_capacity', label: 'Capacity' },
            { key: 'sort_order', label: 'Order' },
            {
              key: 'active',
              label: 'Status',
              render: (value) => (
                <span className={`admin-badge ${value ? 'admin-badge-confirmed' : 'admin-badge-archived'}`}>
                  {value ? 'Active' : 'Inactive'}
                </span>
              ),
            },
            {
              key: 'id',
              label: 'Actions',
              render: (_, row) => (
                <div className="admin-inline" onClick={(event) => event.stopPropagation()}>
                  <Link className="admin-btn ghost sm" to={`/admin/tours/${row.id}`}>Edit</Link>
                  <button type="button" className="admin-btn ghost sm" onClick={() => duplicate(row.id)}>Duplicate</button>
                  {row.active ? (
                    <button type="button" className="admin-btn ghost sm danger" onClick={() => deactivate(row)}>Deactivate</button>
                  ) : null}
                </div>
              ),
            },
          ]}
        />
      </div>
    </>
  );
}