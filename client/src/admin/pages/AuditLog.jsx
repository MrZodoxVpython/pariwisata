import { useEffect, useState } from 'react';
import adminApi from '../api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';

export default function AuditLog() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ entity: '', action: '', actor: '', from: '', to: '', page: 1 });

  const load = () => {
    setLoading(true);
    const search = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) search.set(key, String(value));
    });
    search.set('limit', '40');
    adminApi
      .get(`/audit?${search.toString()}`)
      .then((payload) => {
        setRows(payload.logs || []);
        setTotal(payload.total || 0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filters.entity, filters.action, filters.actor, filters.from, filters.to, filters.page]);

  const set = (key, value) => setFilters((prev) => ({ ...prev, [key]: value, page: key === 'page' ? value : 1 }));
  const pages = Math.max(1, Math.ceil(total / 40));

  return (
    <>
      <PageHeader title="Audit log" subtitle={`${total} recorded action(s). Owner-only.`} />
      {error ? <p className="admin-error">{error}</p> : null}

      <div className="admin-filters">
        <input placeholder="Entity (booking, tour…)" value={filters.entity} onChange={(event) => set('entity', event.target.value)} />
        <input placeholder="Action (create, update…)" value={filters.action} onChange={(event) => set('action', event.target.value)} />
        <input placeholder="Actor email" value={filters.actor} onChange={(event) => set('actor', event.target.value)} />
        <input type="date" value={filters.from} onChange={(event) => set('from', event.target.value)} />
        <input type="date" value={filters.to} onChange={(event) => set('to', event.target.value)} />
        <button type="button" className="admin-btn ghost" onClick={() => setFilters({ entity: '', action: '', actor: '', from: '', to: '', page: 1 })}>Reset</button>
      </div>

      <div className="admin-panel flush">
        <DataTable
          loading={loading}
          rows={rows}
          empty="No audit entries."
          onRowClick={(row) => row.diff && window.alert(JSON.stringify(row.diff, null, 2))}
          columns={[
            { key: 'createdAt', label: 'When', render: (value) => new Date(value).toLocaleString('en-GB') },
            { key: 'actorEmail', label: 'Actor' },
            { key: 'action', label: 'Action' },
            { key: 'entity', label: 'Entity' },
            { key: 'entityId', label: 'Entity id' },
            { key: 'diff', label: 'Details', render: (value) => (value ? <span className="admin-clamp">{JSON.stringify(value)}</span> : '—') },
          ]}
        />
      </div>

      <div className="admin-pagination">
        <button type="button" className="admin-btn ghost sm" disabled={filters.page <= 1} onClick={() => set('page', filters.page - 1)}>← Previous</button>
        <span>Page {filters.page} of {pages}</span>
        <button type="button" className="admin-btn ghost sm" disabled={filters.page >= pages} onClick={() => set('page', filters.page + 1)}>Next →</button>
      </div>
    </>
  );
}