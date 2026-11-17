import { useEffect, useState } from 'react';
import adminApi from '../api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';

export default function Notifications() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const search = new URLSearchParams({ limit: '100' });
    if (status) search.set('status', status);
    adminApi
      .get(`/notifications?${search.toString()}`)
      .then((payload) => setRows(payload.notifications || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [status]);

  const dispatch = async () => {
    setError('');
    setNotice('');
    try {
      const payload = await adminApi.post('/notifications/dispatch');
      setNotice(`Processed ${payload.processed}: ${payload.sent} sent, ${payload.failed} failed.`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const retry = async (row) => {
    try {
      await adminApi.post(`/notifications/${row.id}/retry`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Outbox for booking and contact alerts. Email uses Resend, WhatsApp uses Fonnte."
        actions={
          <>
            <button type="button" className="admin-btn ghost" onClick={load}>Refresh</button>
            <button type="button" className="admin-btn primary" onClick={dispatch}>Send queued now</button>
          </>
        }
      />
      {error ? <p className="admin-error">{error}</p> : null}
      {notice ? <p className="admin-success">{notice}</p> : null}

      <p className="admin-note">
        Providers are configured with server environment variables: <code>RESEND_API_KEY</code>, <code>MAIL_FROM</code> and
        <code> FONNTE_TOKEN</code>. Queued messages are also processed by the Vercel cron endpoint.
      </p>

      <div className="admin-filters">
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option value="queued">Queued</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="admin-panel flush">
        <DataTable
          loading={loading}
          rows={rows}
          empty="No notifications yet."
          columns={[
            { key: 'createdAt', label: 'Created', render: (value) => new Date(value).toLocaleString('en-GB') },
            { key: 'channel', label: 'Channel' },
            { key: 'recipient', label: 'Recipient' },
            { key: 'template', label: 'Template' },
            { key: 'status', label: 'Status', render: (value) => <StatusBadge status={value} /> },
            { key: 'attempts', label: 'Tries' },
            { key: 'error', label: 'Error', render: (value) => <span className="admin-clamp">{value || '—'}</span> },
            {
              key: 'id',
              label: 'Actions',
              render: (_, row) => (
                <button type="button" className="admin-btn ghost sm" onClick={() => retry(row)}>Retry</button>
              ),
            },
          ]}
        />
      </div>
    </>
  );
}