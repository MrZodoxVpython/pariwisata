import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { articleImage } from '../lib/format';

export default function ArticleDetail() {
  const { slug } = useParams();
  const { content } = useApp();
  const article = content.articles.find((item) => item.slug === slug);

  if (!article) {
    return (
      <section className="section">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-3">Article not found</h1>
          <p className="mb-6" style={{ color: 'var(--muted)' }}>The article you are looking for does not exist.</p>
          <Link to="/articles" className="btn-primary no-underline">Back to articles</Link>
        </div>
      </section>
    );
  }

  const more = content.articles.filter((item) => item.slug !== slug).slice(0, 3);

  return (
    <section className="section">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <Link to="/articles" className="inline-flex items-center gap-2 text-sm font-bold text-[#0093DD] no-underline mb-6">
            <ArrowLeft size={16} /> Back to articles
          </Link>

          <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-6 shadow">
            <img src={articleImage(article, 1200)} alt={article.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,.72), transparent)' }} />
            <div className="absolute bottom-0 left-0 p-6">
              <span className="inline-block px-3 py-1 bg-white/15 backdrop-blur border border-white/25 rounded-full text-xs font-bold text-white mb-2">{article.kicker}</span>
              <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight m-0">{article.title}</h1>
            </div>
          </div>

          <div className="text-xs mb-8" style={{ color: 'var(--muted)' }}>{article.meta}</div>
          <div className="prose" dangerouslySetInnerHTML={{ __html: article.body }} />

          {more.length > 0 && (
            <div className="mt-14 border-t border-solid pt-10" style={{ borderColor: 'var(--line)' }}>
              <h2 className="text-xl font-bold mb-5">More articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {more.map((item) => (
                  <Link
                    key={item.slug}
                    to={`/articles/${item.slug}`}
                    className="block p-4 rounded-xl border border-solid hover:border-[#0093DD] transition-colors no-underline"
                    style={{ borderColor: 'var(--line)', background: '#fff' }}
                  >
                    <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--brand-dark)' }}>{item.title}</h3>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>{item.kicker}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}