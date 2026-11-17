import Dialog from './Dialog';
import Icon from './Icon';
import { useApp } from '../context/AppContext';
import { articleImage } from '../lib/format';

export default function ArticleDialog() {
  const { articleSlug, closeArticle, content, openBooking } = useApp();
  const article = content.articles.find((item) => item.slug === articleSlug);
  const open = Boolean(articleSlug && article);

  return (
    <Dialog open={open} onClose={closeArticle} className="article-dialog" labelledBy="articleTitle">
      <div className="dialog-card">
        <button className="dialog-close" type="button" onClick={closeArticle} aria-label="Close article"><Icon name="close" /></button>
        <div className="dialog-head">
          <span className="kicker" id="articleKicker">{article?.kicker || 'Article'}</span>
          <h2 id="articleTitle">{article?.title || 'Article'}</h2>
          <p id="articleMeta">{article?.meta || '—'}</p>
        </div>
        <img className="article-cover" id="articleCover" src={articleImage(article, 1200)} alt="" width="760" height="330" />
        <div className="article-reading" id="articleBody" dangerouslySetInnerHTML={{ __html: article?.body || '' }} />
        <div className="dialog-actions">
          <button className="btn btn-ghost" type="button" onClick={closeArticle}>Close</button>
          <button className="btn btn-primary" type="button" onClick={() => { closeArticle(); openBooking(); }}>Check availability <Icon name="arrow" /></button>
        </div>
      </div>
    </Dialog>
  );
}