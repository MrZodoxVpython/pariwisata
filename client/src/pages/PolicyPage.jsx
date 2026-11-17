import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function PolicyPage({ type }) {
  const { content } = useApp();
  const policy = content.policies[type];

  return (
    <section className="section">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#0093DD] no-underline mb-8">
            <ArrowLeft size={16} /> Back to home
          </Link>
          <h1 className="text-3xl font-extrabold mb-8">{policy?.title || 'Policy'}</h1>
          {policy ? (
            <div className="prose" dangerouslySetInnerHTML={{ __html: policy.html }} />
          ) : (
            <p style={{ color: 'var(--muted)' }}>This policy is not available yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}