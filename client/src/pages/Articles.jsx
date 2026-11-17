import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { useApp } from '../context/AppContext';
import { articleDate, articleExcerpt, articleImage } from '../lib/format';

function metaParts(meta = '') {
  const [, read = ''] = meta.split('·').map((part) => part.trim());
  return { read };
}

export default function Articles() {
  const { content } = useApp();
  const [search, setSearch] = useState('');

  const query = search.trim().toLowerCase();
  const articles = content.articles.filter(
    (article) =>
      !query ||
      article.title.toLowerCase().includes(query) ||
      (article.kicker || '').toLowerCase().includes(query) ||
      (article.meta || '').toLowerCase().includes(query)
  );

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <div className="breadcrumb" style={{ color: 'var(--text-on-dark)' }}>
            <Link to="/" style={{ color: '#9BDCFF' }}>Home</Link><span>/</span><span>Articles</span>
          </div>
          <span className="kicker">Stories &amp; guides</span>
          <h1>Read before you descend.</h1>
          <p>Practical guides, canyon comparisons and honest advice from the people who run these routes every week.</p>
        </div>
      </section>

      <section className="page-section">
        <div className="wrap">
          <div className="section-head compact" data-reveal>
            <div>
              <span className="kicker">The journal</span>
              <h2>Every story from the canyon.</h2>
            </div>
            <div className="field" style={{ width: 'min(320px, 100%)' }}>
              <label htmlFor="article-search">Search articles</label>
              <input
                id="article-search"
                type="search"
                placeholder="Search by topic or title..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          <div className="article-grid">
            {articles.map((article) => {
              const { read } = metaParts(article.meta);
              return (
                <Link className="article-card" to={`/articles/${article.slug}`} key={article.slug}>
                  <div className="article-media">
                    <img
                      src={articleImage(article, 800)}
                      width="800"
                      height="500"
                      alt={article.title}
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="article-tag">{article.kicker}</span>
                  </div>
                  <div className="article-body">
                    <div className="article-meta">
                      <span>{articleDate(article.meta)}</span>
                      {read ? <><i></i><span>{read}</span></> : null}
                    </div>
                    <h3>{article.title}</h3>
                    <p>{articleExcerpt(article)}</p>
                    <span className="article-more">Read article <Icon name="arrow" /></span>
                  </div>
                </Link>
              );
            })}
          </div>

          {articles.length === 0 && (
            <div className="not-found" style={{ minHeight: '30vh' }}>
              <div>
                <h2 style={{ fontSize: 28 }}>No articles found</h2>
                <p className="muted" style={{ marginBottom: 18 }}>Try a different keyword, or browse every story below.</p>
                <button className="btn btn-primary" type="button" onClick={() => setSearch('')}>Clear search</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}