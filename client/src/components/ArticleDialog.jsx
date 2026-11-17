import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ArticleDialog() {
  const { articleSlug, closeArticle, content } = useApp();
  const article = content.articles.find((item) => item.slug === articleSlug);
  const open = Boolean(articleSlug);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeArticle();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, closeArticle]);

  if (!open || !article) return null;

  return (
    <div
      className="dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="article-dialog-title"
      onClick={(event) => event.target === event.currentTarget && closeArticle()}
    >
      <div className="dialog-card relative" style={{ maxWidth: 700 }}>
        <button type="button" onClick={closeArticle} className="dialog-close" aria-label="Close article">
          <X size={20} />
        </button>
        <div className="dialog-head">
          <div className="kicker">{article.kicker}</div>
          <h2 id="article-dialog-title">{article.title}</h2>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>{article.meta}</p>
        </div>
        <div className="prose px-6 pb-4" dangerouslySetInnerHTML={{ __html: article.body }} />
        <div className="dialog-actions">
          <button type="button" onClick={closeArticle} className="btn-ghost">Close</button>
        </div>
      </div>
    </div>
  );
}