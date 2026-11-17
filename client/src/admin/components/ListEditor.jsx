export default function ListEditor({ value = [], onChange, placeholder = 'Add item', multiline = false }) {
  const items = Array.isArray(value) ? value : [];

  const update = (index, text) => {
    const next = [...items];
    next[index] = text;
    onChange(next);
  };

  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="admin-list-editor">
      {items.map((item, index) => (
        <div className="admin-list-row" key={index}>
          {multiline ? (
            <textarea
              value={item}
              rows={2}
              onChange={(event) => update(index, event.target.value)}
              placeholder={placeholder}
            />
          ) : (
            <input
              value={item}
              onChange={(event) => update(index, event.target.value)}
              placeholder={placeholder}
            />
          )}
          <button type="button" className="admin-icon-btn" onClick={() => move(index, -1)} title="Move up">
            ↑
          </button>
          <button type="button" className="admin-icon-btn" onClick={() => move(index, 1)} title="Move down">
            ↓
          </button>
          <button
            type="button"
            className="admin-icon-btn danger"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
            title="Remove"
          >
            ×
          </button>
        </div>
      ))}
      <button type="button" className="admin-btn ghost sm" onClick={() => onChange([...items, ''])}>
        + Add item
      </button>
    </div>
  );
}