import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { articleImage } from '../lib/format';

export default function Articles() {
  const { content } = useApp();
  const [search, setSearch] = useState('');

  const query = search.trim().toLowerCase();
  const articles = content.articles.filter(
    (article) =>
      !query ||
      article.title.toLowerCase().includes(query) ||
      (article.kicker || '').toLowerCase().includes(query)
  );

  return (
    <section className="section" aria-labelledby="articles-h2">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 data-reveal">
          <div className="kicker"><span className="icon">📝</span>Journal</div>
          <h2 id="articles-h2">Articles &amp; guides</h2>
          <p className="lead mx-auto">Tips, comparisons and preparation guides for your first canyoning day in Bali.</p>
        </div>

        <div className="max-w-md mx-auto mb-10 data-reveal">
          <label htmlFor="article-search" className="sr-only">Search articles</label>
          <div className="relative">
            <input
              id="article-search"
              type="search"
              placeholder="Search articles…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-solid bg-white focus:outline-none focus:border-[#0093DD] transition-colors text-sm"
              style={{ borderColor: 'var(--line)', color: 'var(--brand-ink)' }}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true">🔍</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <article key={article.slug} className="bg-white rounded-2xl border border-solid overflow-hidden shadow-sm flex flex-col" style={{ borderColor: 'var(--line)' }}>
              <Link to={`/articles/${article.slug}`} className="relative h-48 overflow-hidden block no-underline">
                <img src={articleImage(article, 800)} alt={article.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
                <span className="absolute top-3 left-3 badge light">{article.kicker}</span>
              </Link>
              <div className="p-5 flex flex-col flex-1">
                <span className="text-xs mb-2" style={{ color: 'var(--muted)' }}>{article.meta}</span>
                <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--brand-dark)' }}>{article.title}</h3>
                <Link to={`/articles/${article.slug}`} className="mt-auto btn-link text-sm no-underline">Read article →</Link>
              </div>
            </article>
          ))}
          {articles.length === 0 && (
            <div className="col-span-full text-center py-20">
              <p style={{ color: 'var(--muted)' }}>No articles found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}