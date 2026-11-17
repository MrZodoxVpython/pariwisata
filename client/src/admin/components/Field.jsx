export default function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`admin-field ${className}`}>
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}