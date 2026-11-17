import { useEffect, useMemo, useRef, useState } from 'react';
import Dialog from './Dialog';
import Icon from './Icon';
import { useApp, useSite } from '../context/AppContext';
import api from '../lib/api';
import { addDays, formatMoney, localISO, tourImage } from '../lib/format';

const peopleOptions = Array.from({ length: 8 }, (_, index) => index + 1);
const MAX_PEOPLE = 8;

function depositOf(total) {
  return Math.round((total * 0.25) / 1000) * 1000;
}

function makeRef() {
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CB-${new Date().getFullYear()}-${random}`;
}

function virtualAccount(seed) {
  let digits = '';
  for (let i = 0; i < 12; i += 1) {
    digits += String((seed.charCodeAt(i % seed.length) + i * 7) % 10);
  }
  return `8808 ${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
}

function qrisSvg(seed) {
  const size = 25;
  const cell = 6;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  const inFinder = (x, y) => (x < 7 && y < 7) || (x >= size - 7 && y < 7) || (x < 7 && y >= size - 7);
  let rects = '';
  for (let x = 0; x < size; x += 1) {
    for (let y = 0; y < size; y += 1) {
      if (inFinder(x, y)) continue;
      hash = (hash * 1103515245 + 12345) % 2147483648;
      if ((hash >> 8) % 3 === 0) {
        rects += `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="#0B161E"/>`;
      }
    }
  }
  const finder = (fx, fy) => {
    const x = fx * cell;
    const y = fy * cell;
    return `<rect x="${x}" y="${y}" width="${cell * 7}" height="${cell * 7}" fill="#0B161E"/><rect x="${x + cell}" y="${y + cell}" width="${cell * 5}" height="${cell * 5}" fill="#ffffff"/><rect x="${x + cell * 2}" y="${y + cell * 2}" width="${cell * 3}" height="${cell * 3}" fill="#0B161E"/>`;
  };
  return `<svg viewBox="0 0 ${size * cell} ${size * cell}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Demo QRIS code"><rect width="100%" height="100%" fill="#ffffff"/>${rects}${finder(0, 0)}${finder(size - 7, 0)}${finder(0, size - 7)}</svg>`;
}

export default function BookingDialog() {
  const { bookingTourId, bookingPrefill, closeBooking, content, currency, notify, openPolicy } = useApp();
  const site = useSite();
  const { tours, pickups } = content;
  const open = bookingTourId !== null;

  const [step, setStep] = useState(1);
  const [tourId, setTourId] = useState('');
  const [date, setDate] = useState('');
  const [people, setPeople] = useState(2);
  const [pickupId, setPickupId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [notes, setNotes] = useState('');
  const [consent, setConsent] = useState(false);
  const [policy, setPolicy] = useState(false);
  const [payPlan, setPayPlan] = useState('deposit');
  const [payMethod, setPayMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const [submitError, setSubmitError] = useState('');
  const toastTimer = useRef(null);

  const tour = tours.find((item) => item.id === tourId) || tours[0];
  const pickup = pickups.find((item) => item.id === pickupId) || pickups[0];

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setTourId(bookingTourId || tours[0]?.id || '');
    setDate(bookingPrefill?.date || addDays(localISO(), 1));
    setPeople(Number(bookingPrefill?.people) || 2);
    setPickupId(pickups[0]?.id || '');
    setName('');
    setEmail('');
    setPhone('');
    setCountry('');
    setNotes('');
    setConsent(false);
    setPolicy(false);
    setPayPlan('deposit');
    setPayMethod('card');
    setCardNumber('');
    setCardName('');
    setCardExpiry('');
    setCardCvc('');
    setErrors({});
    setProcessing(false);
    setBookingRef('');
    setSubmitError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingTourId, open]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const totals = useMemo(() => {
    const price = Number(tour?.price) || 0;
    const subtotal = price * people;
    const pickupFee = Number(pickup?.fee) || 0;
    const total = subtotal + pickupFee;
    return { price, subtotal, pickupFee, total, deposit: depositOf(total) };
  }, [tour, people, pickup]);

  const amount = payPlan === 'deposit' ? totals.deposit : totals.total;
  const payRef = useMemo(() => makeRef(), [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const money = (value) => formatMoney(value, currency);

  const fail = (field, message) => {
    setErrors((current) => ({ ...current, [field]: message }));
    return false;
  };

  const validateStep = (target) => {
    setErrors({});
    if (target === 1) {
      if (!tour) return fail('tour', 'Choose a canyon.');
      if (!date) return fail('date', 'Choose your preferred date.');
      if (date < localISO()) return fail('date', 'Choose a date from today onwards.');
      if (!people || people > MAX_PEOPLE) return fail('people', 'Choose between 1 and 8 guests.');
      if (!pickup) return fail('pickup', 'Choose a pickup area.');
    }
    if (target === 2) {
      if (!name.trim()) return fail('name', 'Enter your full name.');
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('email', 'Enter a valid email.');
      if (phone.replace(/\D/g, '').length < 7) return fail('phone', 'Enter a valid WhatsApp number.');
      if (!consent) return fail('consent', 'Please accept the terms and privacy policy.');
    }
    if (target === 3) {
      if (payMethod === 'card') {
        if (cardNumber.replace(/\D/g, '').length < 15) return fail('cardNumber', 'Enter a demo card number.');
        if (!cardName.trim()) return fail('cardName', 'Enter the name on the card.');
        if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) return fail('cardExpiry', 'Use MM/YY.');
        if (!/^\d{3,4}$/.test(cardCvc)) return fail('cardCvc', 'Enter a valid CVV.');
      }
      if (!policy) return fail('policy', 'Please accept the cancellation policy.');
    }
    return true;
  };

  const goStep = (target) => {
    if (target > step && !validateStep(step)) return;
    setStep(target);
  };

  const handleCardNumber = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 19);
    setCardNumber(digits.replace(/(.{4})/g, '$1 ').trim());
  };

  const handleExpiry = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    setCardExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
  };

  const fillDemoCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardName('Demo Guest');
    setCardExpiry('12/30');
    setCardCvc('123');
  };

  const summaryText = () => {
    const lines = [
      `Canyoning Bali booking ${bookingRef || ''}`.trim(),
      `Canyon: ${tour?.name || '—'}`,
      `Date: ${date || '—'}`,
      `Guests: ${people}`,
      `Pickup: ${pickup?.label || '—'}`,
      `Total: ${money(totals.total)}`,
      `Paid now (${payPlan === 'deposit' ? '25% deposit' : 'full amount'}): ${money(amount)}`,
    ];
    return lines.join('\n');
  };

  const whatsappSend = `https://wa.me/${site.phoneHref}?text=${encodeURIComponent(summaryText())}`;
  const emailSend = `mailto:${site.email}?subject=${encodeURIComponent(`Booking ${bookingRef} — Canyoning Bali`)}&body=${encodeURIComponent(summaryText())}`;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateStep(3)) return;
    setProcessing(true);
    setSubmitError('');
    const reference = makeRef();
    try {
      const payload = await api.createBooking({
        tourId: tour.id,
        date,
        people,
        pickupId,
        name,
        email,
        whatsapp: phone,
        message: [
          notes,
          `Payment: ${payPlan === 'deposit' ? '25% deposit' : 'full amount'} via ${payMethod}.`,
          `Demo reference: ${reference}`,
        ].filter(Boolean).join('\n'),
      });
      setBookingRef(String(payload.booking.id).slice(0, 8).toUpperCase());
      setStep(4);
      notify('Demo payment approved. Booking request sent.');
    } catch (err) {
      const detail = err.details?.[0]?.message;
      setSubmitError(detail || err.message || 'Could not send your booking request.');
    } finally {
      setProcessing(false);
    }
  };

  const downloadCalendar = () => {
    const start = (date || localISO()).replace(/-/g, '');
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Canyoning Bali//Demo//EN',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@canyoningbali.com`,
      `DTSTART;VALUE=DATE:${start}`,
      `SUMMARY:Canyoning Bali — ${tour?.name || 'Canyon day'}`,
      `DESCRIPTION:${summaryText().replace(/\n/g, '\\n')}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `canyoning-bali-${tour?.id || 'booking'}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const fieldClass = (key) => `field${errors[key] ? ' has-error' : ''}`;
  const errorFor = (key) => (errors[key] ? <span className="error">{errors[key]}</span> : null);

  return (
    <Dialog open={open} onClose={closeBooking} className="booking-dialog" labelledBy="bookingTitle">
      <div className="dialog-card">
        <button className="dialog-close" type="button" onClick={closeBooking} aria-label="Close booking form"><Icon name="close" /></button>
        <div className="dialog-head">
          <span className="kicker">Book your adventure</span>
          <h2 id="bookingTitle">Check availability</h2>
          <p>Demo checkout: card, bank transfer or QRIS. No real charge is made.</p>
        </div>
        <ol className="stepper" aria-label="Booking steps">
          <li className={step === 1 ? 'active' : step > 1 ? 'done' : ''}><span>{step > 1 ? '✓' : '1'}</span> Trip</li>
          <li className={step === 2 ? 'active' : step > 2 ? 'done' : ''}><span>{step > 2 ? '✓' : '2'}</span> Details</li>
          <li className={step === 3 ? 'active' : step > 3 ? 'done' : ''}><span>{step > 3 ? '✓' : '3'}</span> Payment</li>
        </ol>
        <p id="bookingStepStatus" className="hint" role="status" aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          Step {Math.min(step, 3)} of 3: {step === 1 ? 'Trip details' : step === 2 ? 'Your details' : 'Review and payment'}
        </p>
        <form id="bookingForm" noValidate onSubmit={handleSubmit}>
          <section className="booking-step" data-step="1" hidden={step !== 1}>
            <h3>Tell us about your trip</h3>
            <p className="step-sub">Choose a canyon, date and group size. You can adjust everything before sending.</p>
            <div className="form-grid">
              <div className={`${fieldClass('tour')} full`}>
                <label htmlFor="bkTour">Canyon <span className="req">*</span></label>
                <select id="bkTour" name="tour" required value={tourId} onChange={(event) => setTourId(event.target.value)}>
                  {tours.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.level}</option>)}
                </select>
                {errorFor('tour')}
              </div>
              <div className={fieldClass('date')}>
                <label htmlFor="bkDate">Preferred date <span className="req">*</span></label>
                <input id="bkDate" name="date" type="date" required min={localISO()} value={date} onChange={(event) => setDate(event.target.value)} />
                {errorFor('date')}
                <span className="hint">We confirm the exact start time by WhatsApp.</span>
              </div>
              <div className={fieldClass('people')}>
                <label htmlFor="bkPeople">Guests <span className="req">*</span></label>
                <select id="bkPeople" name="people" required value={people} onChange={(event) => setPeople(Number(event.target.value))}>
                  {peopleOptions.map((count) => <option key={count} value={count}>{count} {count === 1 ? 'guest' : 'guests'}</option>)}
                </select>
                {errorFor('people')}
              </div>
              <div className={`${fieldClass('pickup')} full`}>
                <label htmlFor="bkPickup">Pickup area <span className="req">*</span></label>
                <select id="bkPickup" name="pickup" required value={pickupId} onChange={(event) => setPickupId(event.target.value)}>
                  {pickups.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
                {errorFor('pickup')}
                <span className="hint">Pickup fees are per group and confirmed in your quote.</span>
              </div>
            </div>
            <div className="price-box" id="priceBox" aria-live="polite">
              <div className="price-row"><span>{people} {people === 1 ? 'guest' : 'guests'} × {money(totals.price)}</span><span>{money(totals.subtotal)}</span></div>
              <div className="price-row"><span>Pickup · {pickup?.label || '—'}</span><span>{money(totals.pickupFee)}</span></div>
              <div className="price-row total"><span>Total</span><strong>{money(totals.total)}</strong></div>
              <p className="currency-note">25% deposit: {money(totals.deposit)} · Prices in IDR; converted amounts are approximate.</p>
            </div>
            <div className="dialog-actions">
              <button className="btn btn-primary" type="button" onClick={() => goStep(2)}>Continue <Icon name="arrow" /></button>
            </div>
          </section>

          <section className="booking-step" data-step="2" hidden={step !== 2}>
            <h3>Your details</h3>
            <p className="step-sub">We use these details only to confirm your booking and arrange pickup.</p>
            <div className="form-grid">
              <div className={fieldClass('name')}>
                <label htmlFor="bkName">Full name <span className="req">*</span></label>
                <input id="bkName" name="name" type="text" autoComplete="name" placeholder="Full name" required value={name} onChange={(event) => setName(event.target.value)} />
                {errorFor('name')}
              </div>
              <div className={fieldClass('email')}>
                <label htmlFor="bkEmail">Email <span className="req">*</span></label>
                <input id="bkEmail" name="email" type="email" autoComplete="email" placeholder="you@example.com" required value={email} onChange={(event) => setEmail(event.target.value)} />
                {errorFor('email')}
              </div>
              <div className={fieldClass('phone')}>
                <label htmlFor="bkPhone">WhatsApp number <span className="req">*</span></label>
                <input id="bkPhone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+62 813 3957 8001" required value={phone} onChange={(event) => setPhone(event.target.value)} />
                {errorFor('phone')}
              </div>
              <div className="field">
                <label htmlFor="bkCountry">Country</label>
                <input id="bkCountry" name="country" type="text" autoComplete="country-name" placeholder="Australia" value={country} onChange={(event) => setCountry(event.target.value)} />
              </div>
              <div className="field full">
                <label htmlFor="bkNotes">Anything we should know?</label>
                <textarea id="bkNotes" name="notes" placeholder="Swimming ability, experience, dietary needs, pickup address..." value={notes} onChange={(event) => setNotes(event.target.value)} />
              </div>
            </div>
            <label className="checkline">
              <input id="bkConsent" name="consent" type="checkbox" required checked={consent} onChange={(event) => setConsent(event.target.checked)} />
              <span>I agree to the <a href="#" onClick={(event) => { event.preventDefault(); openPolicy('terms'); }}>terms</a> and <a href="#" onClick={(event) => { event.preventDefault(); openPolicy('privacy'); }}>privacy policy</a>. <span className="req">*</span></span>
            </label>
            {errorFor('consent')}
            <div className="dialog-actions">
              <button className="btn btn-ghost" type="button" onClick={() => goStep(1)}>Back</button>
              <button className="btn btn-primary" type="button" onClick={() => goStep(3)}>Review booking <Icon name="arrow" /></button>
            </div>
          </section>

          <section className="booking-step" data-step="3" hidden={step !== 3}>
            <h3>Review &amp; payment</h3>
            <p className="step-sub">Check your trip, choose how much to pay, then complete the demo checkout.</p>
            <div className="summary-card" id="bookingSummary">
              <div className="summary-tour">
                <img src={tourImage(tour, 240)} alt="" />
                <div><b>{tour?.name}</b><small>{tour?.duration} · {tour?.level}</small></div>
              </div>
              <div className="summary-line"><span>Date</span><b>{date || '—'}</b></div>
              <div className="summary-line"><span>Guests</span><b>{people}</b></div>
              <div className="summary-line"><span>Pickup</span><b>{pickup?.label || '—'}</b></div>
              <div className="summary-line"><span>Total</span><b>{money(totals.total)}</b></div>
            </div>

            <div className="pay-block">
              <div className="pay-head">
                <h4>1. Payment amount</h4>
                <span className="demo-chip"><Icon name="lock" /> Demo gateway</span>
              </div>
              <div className="pay-plans" role="radiogroup" aria-label="Payment amount">
                <label className={`pay-option${payPlan === 'deposit' ? ' selected' : ''}`}>
                  <input type="radio" name="payPlan" value="deposit" checked={payPlan === 'deposit'} onChange={() => setPayPlan('deposit')} />
                  <span className="pay-radio" aria-hidden="true" />
                  <span><b>25% deposit</b><small>{money(totals.deposit)}</small></span>
                </label>
                <label className={`pay-option${payPlan === 'full' ? ' selected' : ''}`}>
                  <input type="radio" name="payPlan" value="full" checked={payPlan === 'full'} onChange={() => setPayPlan('full')} />
                  <span className="pay-radio" aria-hidden="true" />
                  <span><b>Pay in full</b><small>{money(totals.total)}</small></span>
                </label>
              </div>

              <div className="pay-head" style={{ marginTop: 14 }}>
                <h4>2. Payment method</h4>
                <span className="hint">Charged in IDR</span>
              </div>
              <div className="pay-methods" role="radiogroup" aria-label="Payment method">
                <label className={`pay-option pay-option-method${payMethod === 'card' ? ' selected' : ''}`}>
                  <input type="radio" name="payMethod" value="card" checked={payMethod === 'card'} onChange={() => setPayMethod('card')} />
                  <span className="pay-radio" aria-hidden="true" />
                  <Icon name="card" className="icon pay-icon" />
                  <b>Credit / debit card</b>
                </label>
                <label className={`pay-option pay-option-method${payMethod === 'bank' ? ' selected' : ''}`}>
                  <input type="radio" name="payMethod" value="bank" checked={payMethod === 'bank'} onChange={() => setPayMethod('bank')} />
                  <span className="pay-radio" aria-hidden="true" />
                  <Icon name="bank" className="icon pay-icon" />
                  <b>Bank Bersama</b>
                </label>
                <label className={`pay-option pay-option-method${payMethod === 'qris' ? ' selected' : ''}`}>
                  <input type="radio" name="payMethod" value="qris" checked={payMethod === 'qris'} onChange={() => setPayMethod('qris')} />
                  <span className="pay-radio" aria-hidden="true" />
                  <Icon name="qr" className="icon pay-icon" />
                  <b>QRIS</b>
                </label>
              </div>

              <div className="pay-panel" data-panel="card" hidden={payMethod !== 'card'}>
                <div className="form-grid card-fields">
                  <div className={fieldClass('cardNumber') + ' full'}>
                    <div className="card-label-row">
                      <label htmlFor="bkCardNumber">Card number <span className="req">*</span></label>
                      <button className="demo-fill" type="button" onClick={fillDemoCard}>Use demo card</button>
                    </div>
                    <input id="bkCardNumber" name="cardNumber" type="text" inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" maxLength="23" value={cardNumber} onChange={(event) => handleCardNumber(event.target.value)} />
                    <span className="hint">Demo only — never enter a real card. Try 4242 4242 4242 4242.</span>
                    {errorFor('cardNumber')}
                  </div>
                  <div className={fieldClass('cardName') + ' full'}>
                    <label htmlFor="bkCardName">Name on card <span className="req">*</span></label>
                    <input id="bkCardName" name="cardName" type="text" autoComplete="cc-name" placeholder="Demo Guest" value={cardName} onChange={(event) => setCardName(event.target.value)} />
                    {errorFor('cardName')}
                  </div>
                  <div className={fieldClass('cardExpiry')}>
                    <label htmlFor="bkCardExpiry">Expiry (MM/YY) <span className="req">*</span></label>
                    <input id="bkCardExpiry" name="cardExpiry" type="text" inputMode="numeric" autoComplete="cc-exp" placeholder="12/30" maxLength="5" value={cardExpiry} onChange={(event) => handleExpiry(event.target.value)} />
                    {errorFor('cardExpiry')}
                  </div>
                  <div className={fieldClass('cardCvc')}>
                    <label htmlFor="bkCardCvc">CVV <span className="req">*</span></label>
                    <input id="bkCardCvc" name="cardCvc" type="text" inputMode="numeric" autoComplete="cc-csc" placeholder="123" maxLength="4" value={cardCvc} onChange={(event) => setCardCvc(event.target.value.replace(/\D/g, ''))} />
                    {errorFor('cardCvc')}
                  </div>
                </div>
              </div>

              <div className="pay-panel" data-panel="bank" hidden={payMethod !== 'bank'}>
                <div className="va-box">
                  <small>Bank Bersama · Virtual account</small>
                  <div className="va-row">
                    <span className="va-number">{virtualAccount(payRef)}</span>
                    <button
                      className="copy-btn"
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(virtualAccount(payRef).replace(/\s+/g, ''));
                        notify('Virtual account number copied.');
                      }}
                    >
                      <Icon name="copy" /> Copy
                    </button>
                  </div>
                  <div className="va-rows">
                    <div><span>Account name</span><b>Canyoning Bali</b></div>
                    <div><span>Amount</span><b>{money(amount)}</b></div>
                    <div><span>Reference</span><b>{payRef}</b></div>
                  </div>
                </div>
                <p className="hint">Simulated virtual account. In production the number would be issued by the payment provider and expire after a set time.</p>
              </div>

              <div className="pay-panel" data-panel="qris" hidden={payMethod !== 'qris'}>
                <div className="qris-wrap">
                  <div className="qris-frame" dangerouslySetInnerHTML={{ __html: qrisSvg(payRef) }} />
                  <div className="qris-copy">
                    <b>Scan with any QRIS app</b>
                    <p>Open your bank or e-wallet app, scan this demo QR and confirm. Nothing is charged.</p>
                    <span className="qris-brand"><Icon name="qr" /> QRIS · Demo</span>
                  </div>
                </div>
              </div>

              <div className="pay-total">
                <div><small>Pay now</small><strong>{money(amount)}</strong></div>
                <span className="pay-secure"><Icon name="lock" /> Secure demo checkout</span>
              </div>
              <div className="pay-demo-note"><Icon name="lock" /><span>Demonstration gateway only. No real payment is processed. Card details stay in this browser and are never stored or sent.</span></div>
            </div>

            <label className="checkline">
              <input id="bkPolicy" name="policy" type="checkbox" required checked={policy} onChange={(event) => setPolicy(event.target.checked)} />
              <span>I understand the <a href="#" onClick={(event) => { event.preventDefault(); openPolicy('cancellation'); }}>cancellation and weather policy</a>. <span className="req">*</span></span>
            </label>
            {errorFor('policy')}
            {submitError && <p className="error" style={{ display: 'block', marginTop: 10 }}>{submitError}</p>}
            <div className="dialog-actions">
              <button className="btn btn-ghost" type="button" onClick={() => goStep(2)} disabled={processing}>Back</button>
              <button className={`btn btn-primary${processing ? ' processing' : ''}`} type="submit" disabled={processing}>
                {processing ? 'Processing demo payment...' : `Pay ${payPlan === 'deposit' ? 'deposit' : 'in full'} (demo)`}
              </button>
            </div>
            <p className="dialog-note">After the simulated payment you will receive a demo reference and the option to send your booking details by WhatsApp or email.</p>
          </section>

          <section className="booking-step success" data-step="4" hidden={step !== 4}>
            <div className="success-icon" aria-hidden="true">✓</div>
            <h3>Booking confirmed <span className="hint">(demo)</span></h3>
            <p>Demo payment approved. Your reference is <strong>{bookingRef || '—'}</strong>. Send your confirmation by WhatsApp or email so the team can lock in the date and pickup time.</p>
            <div className="summary-card" id="successSummary">
              <div className="summary-line"><span>Canyon</span><b>{tour?.name}</b></div>
              <div className="summary-line"><span>Date</span><b>{date}</b></div>
              <div className="summary-line"><span>Guests</span><b>{people}</b></div>
              <div className="summary-line"><span>Pickup</span><b>{pickup?.label}</b></div>
              <div className="summary-line"><span>Paid (demo)</span><b>{money(amount)}</b></div>
            </div>
            <div className="dialog-actions">
              <a className="btn btn-primary" href={whatsappSend} target="_blank" rel="noopener noreferrer">Send on WhatsApp <Icon name="wa" /></a>
              <a className="btn btn-ghost" href={emailSend}>Send by email</a>
            </div>
            <button className="btn btn-link" type="button" onClick={downloadCalendar}><Icon name="calendar" /> Add to calendar</button>
            <p className="dialog-note">This was a simulated payment — no money was charged. If WhatsApp does not open, email us at <a href={`mailto:${site.email}`} style={{ color: 'var(--brand-dark)', textDecoration: 'underline' }}>{site.email}</a>.</p>
          </section>
        </form>
      </div>
    </Dialog>
  );
}