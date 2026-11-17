export default function StatCard({ label, value, hint, tone = 'default' }) {
  return (
    <div className={`admin-stat ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {hint ? <small>{hint}</small> : null}
    </div>
  );
}