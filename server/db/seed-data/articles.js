export const QUIZ = [
  {
    q: 'How much adventure do you want?',
    key: 'thrill',
    options: [
      { label: 'A gentle introduction', value: 'low', desc: 'Rappels, slides and plenty of time to enjoy the scenery.' },
      { label: 'A good challenge', value: 'mid', desc: 'Bigger drops, more action, still guided every step.' },
      { label: 'Full-on adventure', value: 'high', desc: 'Technical descents, big rappels and a full day out.' }
    ]
  },
  {
    q: 'How comfortable are you in water?',
    key: 'swim',
    options: [
      { label: 'Confident swimmer', value: 'yes', desc: 'I am happy swimming in deep water.' },
      { label: 'I can swim, but not far', value: 'maybe', desc: 'I prefer to know where the exit is.' },
      { label: 'Not confident', value: 'no', desc: 'I would rather keep swimming optional.' }
    ]
  },
  {
    q: 'Who are you coming with?',
    key: 'group',
    options: [
      { label: 'Solo or a couple', value: 'couple', desc: 'A shared adventure for two.' },
      { label: 'Family with teens', value: 'family', desc: 'Fun, but safety and comfort first.' },
      { label: 'Friends / private group', value: 'friends', desc: 'We want our own crew and a private guide.' }
    ]
  }
];

export const POLICIES = {
  cancellation: {
    title: 'Cancellation & weather policy',
    html: `
      <h3>Free cancellation</h3>
      <p>Cancel free of charge up to 48 hours before your scheduled departure. We will refund any deposit paid or help you move your date.</p>
      <h3>Within 48 hours</h3>
      <p>Cancellations made 24–48 hours before departure may incur a 50% charge to cover guide and transport costs. Cancellations within 24 hours and no-shows are charged in full.</p>
      <h3>Weather & water levels</h3>
      <p>Canyoning depends on safe water levels. If we decide that conditions are unsafe, you can reschedule to another date or receive a full refund. Light rain does not automatically cancel a trip; your guide makes the final decision.</p>
      <h3>Changes</h3>
      <p>Date changes are subject to availability and should be requested as early as possible. If you are unwell, contact us before the trip and we will do our best to find a fair solution.</p>
      <h3>Contact</h3>
      <p>For cancellations or changes, WhatsApp <strong>+62 812-3456-7890</strong> or email <strong>hello@canyoningbali.com</strong> with your booking reference.</p>`
  },
  privacy: {
    title: 'Privacy policy',
    html: `
      <h3>What we collect</h3>
      <p>When you send a booking request, we collect your name, email address, WhatsApp number, country, preferred date, group size, pickup area and any notes you choose to share.</p>
      <h3>Why we collect it</h3>
      <p>We use your details to respond to your enquiry, confirm availability, arrange pickup, prepare safety information and manage your booking. We do not sell your personal data.</p>
      <h3>How we store it</h3>
      <p>Your booking request is sent through WhatsApp or email. We keep the information only as long as needed for your trip, safety records and legal obligations.</p>
      <h3>Analytics</h3>
      <p>If analytics is enabled, we use privacy-friendly measurement to understand how visitors use the site. You can accept or decline analytics in the cookie banner. Essential site functionality does not require analytics cookies.</p>
      <h3>Your rights</h3>
      <p>You can ask us to access, correct or delete your personal data by emailing <strong>hello@canyoningbali.com</strong>. We will respond within a reasonable timeframe.</p>`
  },
  terms: {
    title: 'Terms & conditions',
    html: `
      <h3>Booking requests</h3>
      <p>A booking request is not a confirmed booking. We confirm availability by WhatsApp or email, then send payment and pickup details. Prices are in Indonesian rupiah (IDR); converted amounts on this website are approximate.</p>
      <h3>Payment</h3>
      <p>A 25% deposit secures your date, or you can pay the full amount. This demo site offers card, Bank Bersama transfer and QRIS in a simulated checkout; no real payment is processed. In production, the balance would be payable before departure or on the day, as agreed in your confirmation.</p>
      <h3>Safety & suitability</h3>
      <p>Canyoning is an outdoor adventure activity with inherent risks. You must follow your guide's instructions, disclose relevant medical conditions and meet the age, fitness, swimming and weight requirements for your chosen canyon.</p>
      <h3>Insurance</h3>
      <p>Travel insurance is strongly recommended. It is your responsibility to ensure you are covered for adventure activities.</p>`
  }
};

export const ARTICLES = {
  'first-canyon': {
    kicker: 'Beginner guide',
    title: 'Your first canyoning day in Bali: what actually happens',
    meta: '12 November 2026 · 6 min read · By the Canyoning Bali team',
    imageId: '7163522',
    body: `
      <p>Canyoning is one of those activities that looks effortless in photos and feels very different when you are standing at the top of your first rappel. That is normal. The good news is that a beginner canyon day is built around small, manageable steps — not one giant leap into the unknown.</p>
      <h3>Before you leave the basecamp</h3>
      <p>Your morning starts with a gear check and a safety briefing. Your guide will fit your harness and helmet, explain the hand signals and show you how the rope system works. Tell them about any injury, medication or fear of heights.</p>
      <h3>Practice before the real thing</h3>
      <p>Most beginner routes include a short practice rappel on a low wall. You learn how to sit into the harness, control your speed and keep your feet planted.</p>
      <h3>Your first waterfall rappel</h3>
      <p>Your guide sets the rope, checks your setup and stays close. You step back over the edge, keep your weight in the harness and walk down the rock as the water passes beside you.</p>
      <h3>The rest of the day</h3>
      <p>Beginner canyons mix rappels with natural slides, short swims and walking through the jungle. Optional jumps usually have a bypass.</p>
      <h3>How fit do you need to be?</h3>
      <p>You should be comfortable walking on uneven ground and happy in water. You do not need upper-body strength or previous climbing experience.</p>
      <p>The best preparation is mental: expect to feel nervous at the first edge, trust the guide, and give yourself a few minutes to settle in. Almost everyone does.</p>`
  },
  'choose-canyon': {
    kicker: 'Canyon comparison',
    title: 'Egar, Maboya or Samba: how to choose your canyon',
    meta: '4 November 2026 · 8 min read · By the Canyoning Bali team',
    imageId: '5741502',
    body: `
      <p>All three canyons are in North Bali and all three are guided by local teams. The difference is not just difficulty — it is the shape of the day, the water, the height of the rappels and how much adventure you want to feel.</p>
      <h3>Egar Canyon — the welcoming introduction</h3>
      <p>Egar is the easiest entry point. Expect shorter rappels, fun natural slides and plenty of time to enjoy the scenery.</p>
      <h3>Maboya Canyon — the balanced adventure</h3>
      <p>Maboya adds bigger rappels and a more remote atmosphere without demanding technical experience.</p>
      <h3>Samba Canyon — the step up</h3>
      <p>Samba is longer, deeper and more demanding. The rappels are bigger, the swims are more active and the canyon feels more remote.</p>
      <h3>A simple rule of thumb</h3>
      <p>If it is your first time, choose Egar. If you want a bigger day and you are comfortable in water, look at Maboya. If you already know you love this kind of adventure, Samba is waiting.</p>`
  },
  'packing-list': {
    kicker: 'Gear & prep',
    title: 'What to pack for canyoning (and what to leave behind)',
    meta: '28 October 2026 · 5 min read · By the Canyoning Bali team',
    imageId: '931007',
    body: `
      <p>You do not need much for a canyoning day, and most technical gear is provided. The goal is to arrive with a small bag of things that dry quickly and leave the rest at your hotel.</p>
      <h3>Bring these</h3>
      <ul>
        <li><strong>Swimwear</strong> — worn underneath your clothes before you arrive.</li>
        <li><strong>Quick-dry shorts and top</strong> — avoid cotton, which stays heavy and cold.</li>
        <li><strong>Water shoes or old trainers</strong> — something with grip that can get wet.</li>
        <li><strong>Towel and a full change of clothes</strong> — for after the canyon.</li>
        <li><strong>Reef-safe sunscreen</strong> — apply before and after, not right before a rappel.</li>
      </ul>
      <h3>Leave these behind</h3>
      <ul>
        <li>Jewellery, rings and loose accessories.</li>
        <li>Expensive cameras or phones without waterproof protection.</li>
        <li>Cotton jeans, heavy hoodies and flip-flops.</li>
      </ul>
      <h3>What we provide</h3>
      <p>Your booking includes the canyoning harness, helmet, wetsuit and rope equipment, plus a guide, safety briefing, lunch and drinking water.</p>
      <p>Pack light, arrive early and keep your bag organised. The canyon does the rest.</p>`
  }
};

export const FAQ = [
  {
    q: 'Do I need canyoning experience?',
    a: 'No. Beginner routes like Egar and Maboya are designed for first-timers. Your guide will teach you everything before you enter the water.'
  },
  {
    q: 'What is the minimum age?',
    a: 'Egar and Maboya accept ages 8+, Samba accepts ages 10+, and Aling accepts ages 12+.'
  },
  {
    q: 'Is swimming required?',
    a: 'Swimming is optional on Egar and Maboya, but required on Samba and Aling. You should always be comfortable in water.'
  },
  {
    q: 'What is included in the price?',
    a: 'Local guide, harness, helmet, wetsuit, safety briefing, lunch, drinking water, edited photos and pickup from Ubud.'
  },
  {
    q: 'What is the cancellation policy?',
    a: 'Free cancellation up to 48 hours before departure. Weather-related cancellations can be rescheduled or refunded in full.'
  },
  {
    q: 'How do I pay?',
    a: 'A 25% deposit secures your date. Payment methods are confirmed via WhatsApp or email after availability is checked.'
  }
];