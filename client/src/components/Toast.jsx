import { useApp } from '../context/AppContext';

export default function Toast() {
  const { toast } = useApp();

  return (
    <div
      className={`toast ${toast ? 'show' : ''}`}
      role="status"
      aria-live="polite"
      style={toast?.type === 'error' ? { background: '#b42318' } : undefined}
    >
      {toast?.message || ''}
    </div>
  );
}