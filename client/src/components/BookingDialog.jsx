import { useEffect, useState } from 'react';
import { X, Calendar, Users, MapPin, ArrowRight, Check, Phone } from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../lib/api';
import { formatIDR, tourImage } from '../lib/format';

const steps = ['Choose tour', 'Date & guests', 'Pickup', 'Contact'];

export default function BookingDialog() {
  const { bookingTourId, closeBooking, content, notify } = useApp();
  const { tours, pickups } = content;
  const open = bookingTourId !== null;

  const [step, setStep] = useState(1);
  const [tourId, setTourId] = useState('');
  const [date, setDate] = useState('');
  const [people, setPeople] = useState('2');
  const [pickupId, setPickupId] = useState(pickups[0]?.id || '');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setTourId(bookingTourId || '');
    setStep(bookingTourId ? 2 : 1);
    setDate('');
    setPeople('2');
    setPickupId(pickups[0]?.id || '');
    setName('');
    setEmail('');
    setWhatsapp('');
    setMessage('');
    setError('');
    setSubmitting(false);
    // Keep this scoped to opening the dialog.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingTourId, open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeBooking();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, closeBooking]);

  if (!open) return null;

  const tour = tours.find((item) => item.id === tourId);
  const pickup = pickups.find((item) => item.id === pickupId) || pickups[0];
  const peopleNum = Math.min(8, Math.max(1, Number(people) || 1));
  const subtotal = tour ? tour.price * peopleNum : 0;
  const total = subtotal + (pickup?.fee || 0);
  const today = new Date().toISOString().slice(0, 10);
  const canContinue = step === 1 ? Boolean(tourId) : step === 2 ? Boolean(date) : true;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!tour) return;
    setSubmitting(true);
    setError('');

    try {
      const payload = await api.createBooking({
        tourId: tour.id,
        date,
        people: peopleNum,
        pickupId,
        name,
        email,
        whatsapp,
        message,
      });
      notify(`Booking request sent. Reference ${payload.booking.id.slice(0, 8)}.`);
      closeBooking();
    } catch (err) {
      const detail = err.details?.[0]?.message;
      setError(detail || err.message || 'Could not send your booking request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-title"
      onClick={(event) => event.target === event.currentTarget && closeBooking()}
    >
      <div className="dialog-card relative">
        <button type="button" onClick={closeBooking} className="dialog-close" aria-label="Close booking dialog">
          <X size={20} />
        </button>

        <div className="dialog-head">
          <div className="stepper" aria-label="Booking progress">
            {steps.map((label, index) => (
              <li key={label} className={index < step - 1 ? 'done' : index === step - 1 ? 'active' : ''}>
                <span>{index < step - 1 ? '✓' : index + 1}</span>
                <span>{label}</span>
              </li>
            ))}
          </div>
          <h2 id="booking-title">Booking request</h2>
          <p>Send a booking request. We will confirm availability and payment details via WhatsApp.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 pb-2">
            {step === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tours.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setTourId(item.id);
                      setStep(2);
                    }}
                    className={`flex flex-col items-center p-4 rounded-xl border border-solid transition-all ${tourId === item.id ? 'ring-2 ring-[#0093DD] bg-[#0093DD]/10' : 'bg-white hover:border-[#0093DD]/60'}`}
                    style={{ borderColor: 'var(--line)' }}
                  >
                    <img src={tourImage(item, 300)} alt="" className="w-20 h-20 object-cover rounded-xl mb-3" />
                    <span className="text-xs font-bold text-center leading-tight" style={{ color: 'var(--brand-dark)' }}>{item.name}</span>
                    <span className="text-[11px] font-bold text-[#0093DD] mt-1">{formatIDR(item.price)} / person</span>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl flex items-center gap-3" style={{ background: 'var(--cream)' }}>
                  <img src={tourImage(tour, 200)} alt="" className="w-14 h-14 rounded-lg object-cover" />
                  <div>
                    <div className="text-sm font-bold">{tour?.name}</div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>{tour?.duration} · {tour?.group}</div>
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="booking-date">Preferred date <span className="req">*</span></label>
                  <input id="booking-date" type="date" required value={date} min={today} onChange={(event) => setDate(event.target.value)} />
                </div>
                <div className="field">
                  <label>Number of guests <span className="req">*</span></label>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setPeople(String(Math.max(1, peopleNum - 1)))} className="w-9 h-9 rounded-lg border border-solid text-lg font-bold" style={{ borderColor: 'var(--line)', background: '#fff' }} aria-label="Remove guest">−</button>
                    <span className="text-sm font-bold w-8 text-center">{peopleNum}</span>
                    <button type="button" onClick={() => setPeople(String(Math.min(8, peopleNum + 1)))} className="w-9 h-9 rounded-lg border border-solid text-lg font-bold" style={{ borderColor: 'var(--line)', background: '#fff' }} aria-label="Add guest">+</button>
                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--muted)' }}><Users size={13} /> Max 8 guests</span>
                  </div>
                </div>
                <div className="rounded-xl p-4 border border-solid" style={{ borderColor: 'var(--line)', background: 'var(--cream)' }}>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: 'var(--muted)' }}>Subtotal ({peopleNum} × {formatIDR(tour?.price || 0)})</span>
                    <span className="font-bold">{formatIDR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span>Total</span>
                    <span>{formatIDR(total)}</span>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="field">
                  <label htmlFor="booking-pickup"><MapPin size={13} className="inline mr-1" /> Pickup / meeting point</label>
                  <select id="booking-pickup" value={pickupId} onChange={(event) => setPickupId(event.target.value)}>
                    {pickups.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label} {item.fee > 0 ? `(+${formatIDR(item.fee)})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="rounded-xl p-4 border border-solid" style={{ borderColor: 'var(--line)', background: 'var(--cream)' }}>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: 'var(--muted)' }}>Tour subtotal</span>
                    <span>{formatIDR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span style={{ color: 'var(--muted)' }}>Pickup fee</span>
                    <span>{formatIDR(pickup?.fee || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-2 border-t border-solid" style={{ borderColor: 'var(--line)' }}>
                    <span>Total</span>
                    <span>{formatIDR(total)}</span>
                  </div>
                </div>
                <p className="text-xs flex items-start gap-2" style={{ color: 'var(--muted)' }}>
                  <Check size={14} color="#0093DD" className="shrink-0 mt-0.5" />
                  Free cancellation up to 48 hours before departure.
                </p>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="field">
                  <label htmlFor="booking-name">Full name <span className="req">*</span></label>
                  <input id="booking-name" type="text" required value={name} onChange={(event) => setName(event.target.value)} placeholder="John Doe" autoComplete="name" />
                </div>
                <div className="field">
                  <label htmlFor="booking-email">Email address</label>
                  <input id="booking-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" />
                </div>
                <div className="field">
                  <label htmlFor="booking-whatsapp">WhatsApp number <span className="req">*</span></label>
                  <input id="booking-whatsapp" type="tel" required value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} placeholder="+62 812 xxx xxxx" autoComplete="tel" />
                </div>
                <div className="field">
                  <label htmlFor="booking-message">Message / notes</label>
                  <textarea id="booking-message" rows="3" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Any special requests?" />
                </div>
                <div className="rounded-xl p-3 text-xs" style={{ background: 'var(--cream)', color: 'var(--muted)' }}>
                  <Calendar size={13} className="inline mr-1" /> {date || 'No date'} · {peopleNum} guest{peopleNum > 1 ? 's' : ''} · {tour?.name}
                </div>
                {error && (
                  <p className="text-xs font-bold rounded-lg p-3" style={{ background: '#fef3f2', color: '#b42318' }} role="alert">{error}</p>
                )}
              </div>
            )}
          </div>

          <div className="dialog-actions">
            {step > 1 && (
              <button type="button" onClick={() => setStep(step - 1)} className="btn-ghost text-sm" disabled={submitting}>← Back</button>
            )}
            {step < 4 ? (
              <button
                type="button"
                onClick={() => canContinue && setStep(step + 1)}
                disabled={!canContinue}
                className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button type="submit" className="btn-primary text-sm disabled:opacity-60" disabled={submitting || !tour}>
                {submitting ? 'Sending…' : 'Send request'} <Phone size={15} />
              </button>
            )}
          </div>
        </form>

        <div className="dialog-note">
          A booking request is not a confirmed booking. We will confirm availability and send payment details via WhatsApp. Free cancellation up to 48 hours before departure.
        </div>
      </div>
    </div>
  );
}