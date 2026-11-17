const LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  new: 'New',
  read: 'Read',
  replied: 'Replied',
  archived: 'Archived',
  sent: 'Sent',
  failed: 'Failed',
  queued: 'Queued',
  skipped: 'Skipped',
};

export default function StatusBadge({ status }) {
  return <span className={`admin-badge admin-badge-${status}`}>{LABELS[status] || status}</span>;
}