import { useEffect, useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatIDR } from '../lib/format';

export default function QuizDialog() {
  const { quizOpen, closeQuiz, content, openBooking } = useApp();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const quiz = content.quiz;

  useEffect(() => {
    if (quizOpen) {
      setStep(0);
      setAnswers({});
    }
  }, [quizOpen]);

  useEffect(() => {
    if (!quizOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeQuiz();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [quizOpen, closeQuiz]);

  if (!quizOpen || !quiz.length) return null;

  const current = quiz[step];
  const completed = step >= quiz.length;

  let recommendation = null;
  if (completed) {
    const { thrill, swim } = answers;
    if (thrill === 'low' || swim === 'no') recommendation = content.tours.find((tour) => tour.id === 'egar');
    else if (thrill === 'high' && swim === 'yes') recommendation = content.tours.find((tour) => tour.id === 'samba');
    else if (thrill === 'mid') recommendation = content.tours.find((tour) => tour.id === 'maboya');
    recommendation = recommendation || content.tours[0];
  }

  return (
    <div
      className="dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-title"
      onClick={(event) => event.target === event.currentTarget && closeQuiz()}
    >
      <div className="dialog-card relative">
        <button type="button" onClick={closeQuiz} className="dialog-close" aria-label="Close quiz">
          <X size={20} />
        </button>
        <div className="dialog-head">
          {completed ? (
            <>
              <div className="kicker">Your recommendation</div>
              <h2 id="quiz-title">{recommendation?.name || 'Egar Canyon'}</h2>
              <p>{recommendation?.short || 'Start with our beginner-friendly Egar Canyon.'}</p>
            </>
          ) : (
            <>
              <div className="kicker">Canyon matcher · {step + 1}/{quiz.length}</div>
              <h2 id="quiz-title">{current.q}</h2>
            </>
          )}
        </div>

        {completed ? (
          <div className="p-4 space-y-4">
            <div className="rounded-xl p-4 border border-solid" style={{ borderColor: 'var(--line)', background: 'var(--cream)' }}>
              <h3 className="font-bold text-lg mb-1">{recommendation?.name}</h3>
              <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>{recommendation?.short}</p>
              <div className="flex justify-between text-sm font-bold">
                <span>Price per person</span>
                <span>{formatIDR(recommendation?.price || 0)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                closeQuiz();
                openBooking(recommendation?.id || '');
              }}
              className="w-full btn-primary"
            >
              Book this canyon <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <>
            <div className="stepper px-6">
              {quiz.map((question, index) => (
                <li key={question.key} className={index < step ? 'done' : index === step ? 'active' : ''}>
                  <span>{index < step ? '✓' : index + 1}</span>
                  <span>{question.key}</span>
                </li>
              ))}
            </div>
            <div className="space-y-3 p-4">
              {current.options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setAnswers({ ...answers, [current.key]: option.value });
                    setStep(step + 1);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-solid text-left transition-colors hover:bg-[#0093DD]/5 hover:border-[#0093DD]"
                  style={{ borderColor: 'var(--line)', background: '#fff' }}
                >
                  <div className="flex-1">
                    <div className="font-bold text-sm" style={{ color: 'var(--brand-dark)' }}>{option.label}</div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>{option.desc}</div>
                  </div>
                  <span className="text-sm font-bold text-[#0093DD]" aria-hidden="true">
                    {option.value === 'high' || option.value === 'yes' ? '★★★' : option.value === 'mid' || option.value === 'maybe' ? '★★☆' : '★☆☆'}
                  </span>
                </button>
              ))}
            </div>
            <div className="dialog-actions">
              <button type="button" onClick={() => setStep(step - 1)} disabled={step === 0} className="btn-ghost text-sm disabled:opacity-50">← Back</button>
              <button type="button" onClick={closeQuiz} className="btn-ghost text-sm">Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}