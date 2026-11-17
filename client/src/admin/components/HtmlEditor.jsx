import { useRef, useState } from 'react';

export default function HtmlEditor({ value = '', onChange, rows = 16 }) {
  const areaRef = useRef(null);
  const [preview, setPreview] = useState(false);

  const wrap = (open, close = '') => {
    const area = areaRef.current;
    if (!area) return;
    const { selectionStart, selectionEnd } = area;
    const selected = value.slice(selectionStart, selectionEnd) || 'text';
    const next = `${value.slice(0, selectionStart)}${open}${selected}${close}${value.slice(selectionEnd)}`;
    onChange(next);
    requestAnimationFrame(() => {
      area.focus();
      area.selectionStart = selectionStart + open.length;
      area.selectionEnd = selectionStart + open.length + selected.length;
    });
  };

  const insert = (snippet) => wrap(snippet, '');

  const addLink = () => {
    const url = window.prompt('Link URL');
    if (!url) return;
    wrap(`<a href="${url}">`, '</a>');
  };

  const addImage = () => {
    const url = window.prompt('Image URL');
    if (!url) return;
    insert(`<img src="${url}" alt="" loading="lazy" />`);
  };

  return (
    <div className="admin-editor">
      <div className="admin-editor-toolbar">
        <button type="button" onClick={() => wrap('<h2>', '</h2>')}>H2</button>
        <button type="button" onClick={() => wrap('<h3>', '</h3>')}>H3</button>
        <button type="button" onClick={() => wrap('<strong>', '</strong>')}><strong>B</strong></button>
        <button type="button" onClick={() => wrap('<em>', '</em>')}><em>I</em></button>
        <button type="button" onClick={() => wrap('<p>', '</p>')}>P</button>
        <button type="button" onClick={() => wrap('<ul>\n  <li>', '</li>\n</ul>')}>UL</button>
        <button type="button" onClick={() => insert('<hr />')}>HR</button>
        <button type="button" onClick={addLink}>Link</button>
        <button type="button" onClick={addImage}>Image</button>
        <button type="button" className={preview ? 'active' : ''} onClick={() => setPreview((prev) => !prev)}>
          {preview ? 'Edit' : 'Preview'}
        </button>
      </div>
      {preview ? (
        <div className="admin-editor-preview" dangerouslySetInnerHTML={{ __html: value }} />
      ) : (
        <textarea
          ref={areaRef}
          rows={rows}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          spellCheck={false}
        />
      )}
    </div>
  );
}