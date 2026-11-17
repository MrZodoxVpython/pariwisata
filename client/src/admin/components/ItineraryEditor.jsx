export default function ItineraryEditor({ value = [], onChange }) {
  const items = Array.isArray(value) ? value : [];

  const update = (index, key, text) => {
    const next = items.map((item, i) => (i === index ? { ...item, [key]: text } : item));
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
    <div className="admin-itinerary-editor">
      {items.map((item, index) => (
        <div className="admin-itinerary-row" key={index}>
          <input
            className="time"
            value={item.time || ''}
            onChange={(event) => update(index, 'time', event.target.value)}
            placeholder="07:00"
          />
          <input
            value={item.title || ''}
            onChange={(event) => update(index, 'title', event.target.value)}
            placeholder="Activity title"
          />
          <input
            value={item.text || ''}
            onChange={(event) => update(index, 'text', event.target.value)}
            placeholder="Short description"
          />
          <button type="button" className="admin-icon-btn" onClick={() => move(index, -1)}>
            ↑
          </button>
          <button type="button" className="admin-icon-btn" onClick={() => move(index, 1)}>
            ↓
          </button>
          <button
            type="button"
            className="admin-icon-btn danger"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        className="admin-btn ghost sm"
        onClick={() => onChange([...items, { time: '', title: '', text: '' }])}
      >
        + Add step
      </button>
    </div>
  );
}