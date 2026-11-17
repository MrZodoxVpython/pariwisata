import { Link, useParams } from 'react-router-dom';
import Icon from '../components/Icon';
import { useApp } from '../context/AppContext';
import { articleImage } from '../lib/format';

function metaParts(meta = '') {
  const [date = '', read = '', author = ''] = meta.split('·').map((part) => part.trim());
  return { date, read, author };
}

export default function ArticleDetail() {
  const { slug } = useParams();
  const { content } = useApp();
  const article = content.articles.find((item) => item.slug === slug);

  if (!article) {
    return (
      <section className="page-section">
        <div className="wrap not-found">
          <div>
            <h1 style={{ fontSize: 48 }}>Article not found</h1>
            <p className="muted" style={{ marginBottom: 20 }}>The story you are looking for does not exist or has moved.</p>
            <Link className="btn btn-primary" to="/articles">Back to articles</Link>
          </div>
        </div>
      </section>
    );
  }

  const { date, read, author } = metaParts(article.meta);
  const more = content.articles.filter((item) => item.slug !== slug).slice(0, 3);
  const intro = (article.body || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140);

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <div className="breadcrumb" style={{ color: 'var(--text-on-dark)' }}>
            <Link to="/" style={{ color: '#9BDCFF' }}>Home</Link><span>/</span>
            <Link to="/articles" style={{ color: '#9BDCFF' }}>Articles</Link><span>/</span>
            <span>{article.kicker}</span>
          </div>
          <span className="kicker">{article.kicker}</span>
          <h1 style={{ maxWidth: 900 }}>{article.title}</h1>
          <p>{intro}…</p>
          <div className="article-meta" style={{ color: 'rgba(255,255,255,.78)', marginTop: 18 }}>
            <span>{date}</span>
            {read ? <><i style={{ background: 'rgba(255,255,255,.6)' }}></i><span>{read}</span></> : null}
            {author ? <><i style={{ background: 'rgba(255,255,255,.6)' }}></i><span>{author}</span></> : null}
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="wrap" style={{ maxWidth: 880 }}>
          <img
            className="article-cover"
            src={articleImage(article, 1400)}
            width="1400"
            height="700"
            alt={article.title}
            style={{ width: '100%', objectFit: 'cover', aspectRatio: '16/8', borderRadius: 22, marginBottom: 28 }}
          />
          <div className="article-reading" dangerouslySetInnerHTML={{ __html: article.body }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 32 }}>
            <Link className="btn btn-primary" to="/packages">Explore the canyons <Icon name="arrow" /></Link>
            <Link className="btn btn-ghost" to="/articles">All articles</Link>
          </div>
        </div>
      </section>

      {more.length > 0 && (
        <section className="page-section alt">
          <div className="wrap">
            <div className="section-head compact">
              <div><span className="kicker">Keep reading</span><h2>More from the journal.</h2></div>
              <Link className="btn btn-ghost" to="/articles">View all <Icon name="arrow" /></Link>
            </div>
            <div className="article-grid">
              {more.map((item) => {
                const parts = metaParts(item.meta);
                return (
                  <Link className="article-card" to={`/articles/${item.slug}`} key={item.slug}>
                    <div className="article-media">
                      <img src={articleImage(item, 800)} width="800" height="500" alt={item.title} loading="lazy" decoding="async" />
                      <span className="article-tag">{item.kicker}</span>
                    </div>
                    <div className="article-body">
                      <div className="article-meta">
                        <span>{parts.date}</span>
                        {parts.read ? <><i></i><span>{parts.read}</span></> : null}
                      </div>
                      <h3>{item.title}</h3>
                      <span className="article-more">Read article <Icon name="arrow" /></span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}