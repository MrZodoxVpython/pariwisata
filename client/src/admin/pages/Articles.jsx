import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import adminApi from '../api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import { formatDate } from '../../lib/format';

export default function Articles() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminApi
      .get('/articles')
      .then((payload) => setRows(payload.articles || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const toggle = async (row) => {
    try {
      await adminApi.post(`/articles/${row.slug}/publish`, { published: !row.published });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete "${row.title}"? This cannot be undone.`)) return;
    try {
      await adminApi.del(`/articles/${row.slug}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Articles"
        subtitle="Journal stories. Drafts stay hidden from the public site."
        actions={<Link className="admin-btn primary" to="/admin/articles/new">New article</Link>}
      />
      {error ? <p className="admin-error">{error}</p> : null}

      <div className="admin-panel flush">
        <DataTable
          loading={loading}
          rows={rows}
          rowKey="slug"
          empty="No articles yet."
          columns={[
            {
              key: 'title',
              label: 'Title',
              render: (value, row) => <div className="admin-cell-stack"><strong>{value}</strong><small>{row.slug}</small></div>,
            },
            { key: 'kicker', label: 'Kicker' },
            { key: 'updated_at', label: 'Updated', render: (value) => formatDate(String(value || '').slice(0, 10)) },
            { key: 'published', label: 'Status', render: (value) => <span className={`admin-badge ${value ? 'admin-badge-confirmed' : 'admin-badge-archived'}`}>{value ? 'Published' : 'Draft'}</span> },
            {
              key: 'slug',
              label: 'Actions',
              render: (_, row) => (
                <div className="admin-inline">
                  <Link className="admin-btn ghost sm" to={`/admin/articles/${row.slug}`}>Edit</Link>
                  <button type="button" className="admin-btn ghost sm" onClick={() => toggle(row)}>{row.published ? 'Unpublish' : 'Publish'}</button>
                  {row.published ? <a className="admin-btn ghost sm" href={`/articles/${row.slug}`} target="_blank" rel="noreferrer">View ↗</a> : null}
                  <button type="button" className="admin-btn ghost sm danger" onClick={() => remove(row)}>Delete</button>
                </div>
              ),
            },
          ]}
        />
      </div>
    </>
  );
}