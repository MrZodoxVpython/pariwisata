import { useEffect, useState } from 'react';
import Dialog from './Dialog';
import Icon from './Icon';
import { useApp } from '../context/AppContext';
import { formatMoney, tourImage } from '../lib/format';

const FALLBACK_QUIZ = [
  {
    q: 'How much adventure do you want?',
    key: 'thrill',
    options: [
      { label: 'A gentle introduction', value: 'low', desc: 'Rappels, slides and plenty of time to enjoy the scenery.' },
      { label: 'A good challenge', value: 'mid', desc: 'Bigger drops, more action, still guided every step.' },
      { label: 'Full-on adventure', value: 'high', desc: 'Technical descents, big rappels and a full day out.' },
    ],
  },
  {
    q: 'How comfortable are you in water?',
    key: 'swim',
    options: [
      { label: 'Confident swimmer', value: 'yes', desc: 'I am happy swimming in deep water.' },
      { label: 'I can swim, but not far', value: 'maybe', desc: 'I prefer to know where the exit is.' },
      { label: 'Not confident', value: 'no', desc: 'I would rather keep swimming optional.' },
    ],
  },
  {
    q: 'Who are you coming with?',
    key: 'group',
    options: [
      { label: 'Solo or a couple', value: 'couple', desc: 'A shared adventure for two.' },
      { label: 'Family with teens', value: 'family', desc: 'Fun, but safety and comfort first.' },
      { label: 'Friends / private group', value: 'friends', desc: 'We want our own crew and a private guide.' },
    ],
  },
];

export default function QuizDialog() {
  const { quizOpen, closeQuiz, content, currency, openBooking, openTourDetail } = useApp();
  const quiz = content.quiz?.length ? content.quiz : FALLBACK_QUIZ;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    if (quizOpen) {
      setIndex(0);
      setAnswers({});
    }
  }, [quizOpen]);

  const completed = quiz.length > 0 && index >= quiz.length;
  const current = quiz[index];

  const recommend = () => {
    let id = 'egar';
    if (answers.thrill === 'high') id = answers.swim === 'yes' ? 'aling' : 'samba';
    else if (answers.thrill === 'mid') id = answers.swim === 'no' ? 'maboya' : 'samba';
    else id = answers.group === 'friends' ? 'maboya' : 'egar';
    if (answers.group === 'family' && (id === 'aling' || id === 'samba')) id = 'maboya';
    if (answers.swim === 'no' && id === 'samba') id = 'maboya';
    return content.tours.find((tour) => tour.id === id) || content.tours[0];
  };

  const tour = completed ? recommend() : null;
  const progress = quiz.length ? Math.round((index / quiz.length) * 100) : 0;

  return (
    <Dialog open={quizOpen} onClose={closeQuiz} className="quiz-dialog" labelledBy="quizTitle">
      <div className="dialog-card">
        <button className="dialog-close" type="button" onClick={closeQuiz} aria-label="Close canyon quiz"><Icon name="close" /></button>
        <span className="kicker">30-second quiz</span>
        <h2 id="quizTitle" style={{ marginTop: 6 }}>Find your canyon.</h2>
        <div className="quiz-progress" aria-hidden="true"><i style={{ width: `${completed ? 100 : progress}%` }} /></div>
        <div id="quizBody">
          {!quiz.length ? null : completed ? (
            <div className="quiz-result">
              <img src={tourImage(tour, 900)} alt={`${tour?.name} in Bali`} width="900" height="450" />
              <span className="badge lime">Your best match</span>
              <h3>{tour?.name}</h3>
              <p>{tour?.short}</p>
              <div className="price">{formatMoney(tour?.price || 0, currency)} <span className="muted" style={{ fontSize: 11, fontWeight: 600 }}>/ person</span></div>
              <button className="btn btn-primary" type="button" onClick={() => { closeQuiz(); openBooking(tour?.id); }}>Check availability <Icon name="arrow" /></button>
              <button className="btn btn-ghost" type="button" onClick={() => { closeQuiz(); openTourDetail(tour?.id); }}>See full details</button>
              <button className="btn btn-link" type="button" onClick={() => { setIndex(0); setAnswers({}); }}>Retake the quiz</button>
            </div>
          ) : (
            <>
              <p className="hint" style={{ marginBottom: 6 }}>Question {index + 1} of {quiz.length}</p>
              <h3 className="quiz-q">{current.q}</h3>
              <div className="quiz-options">
                {current.options.map((option) => (
                  <button
                    className="quiz-opt"
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setAnswers((prev) => ({ ...prev, [current.key]: option.value }));
                      setIndex((prev) => prev + 1);
                    }}
                  >
                    <b>{option.label}</b><span>{option.desc}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Dialog>
  );
}