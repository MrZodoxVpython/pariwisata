import { query } from './db.js';

export async function queueNotification({ channel, recipient, template, payload = {} }) {
  if (!recipient) return null;
  try {
    const { rows } = await query(
      `insert into public.notifications (channel, recipient, template, payload)
       values ($1, $2, $3, $4) returning *`,
      [channel, recipient, template, JSON.stringify(payload)]
    );
    return rows[0];
  } catch (error) {
    console.error('Could not queue notification:', error.message);
    return null;
  }
}

function money(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(value || 0)
  );
}

function render(template, payload = {}) {
  const booking = payload.booking || {};
  const contact = payload.contact || {};

  switch (template) {
    case 'booking_created':
      return {
        subject: `New booking request — ${booking.tourName || 'tour'} on ${booking.date || ''}`,
        text: [
          `New booking request from the website.`,
          ``,
          `Tour: ${booking.tourName || '-'}`,
          `Date: ${booking.date || '-'}`,
          `Guests: ${booking.people || '-'}`,
          `Total: ${money(booking.total)}`,
          `Name: ${booking.name || '-'}`,
          `WhatsApp: ${booking.whatsapp || '-'}`,
          `Email: ${booking.email || '-'}`,
          `Pickup: ${booking.pickupName || 'not selected'}`,
          `Message: ${booking.message || '-'}`,
          ``,
          `Open the admin panel to confirm this booking.`,
        ].join('\n'),
      };
    case 'booking_confirmed':
      return {
        subject: `Your ${booking.tourName || 'canyoning'} trip is confirmed`,
        text: [
          `Hi ${booking.name || 'there'},`,
          ``,
          `Your booking is confirmed.`,
          `Tour: ${booking.tourName || '-'}`,
          `Date: ${booking.date || '-'}`,
          `Guests: ${booking.people || '-'}`,
          `Total: ${money(booking.total)}`,
          ``,
          `We will contact you on WhatsApp with pickup details.`,
        ].join('\n'),
      };
    case 'contact_message':
      return {
        subject: `New contact message from ${contact.name || 'website visitor'}`,
        text: [
          `New contact message.`,
          ``,
          `Name: ${contact.name || '-'}`,
          `WhatsApp: ${contact.whatsapp || '-'}`,
          `Email: ${contact.email || '-'}`,
          `Preferred date: ${contact.preferredDate || '-'}`,
          `Guests: ${contact.people || '-'}`,
          `Message: ${contact.message || '-'}`,
        ].join('\n'),
      };
    case 'reminder_h1':
      return {
        subject: `Your trip is tomorrow — ${booking.tourName || ''}`,
        text: [
          `Hi ${booking.name || 'there'},`,
          ``,
          `A quick reminder that your ${booking.tourName || 'canyoning'} trip is tomorrow, ${booking.date || ''}.`,
          `Pickup: ${booking.pickupName || 'we will confirm on WhatsApp'}`,
          ``,
          `Bring a swimsuit, towel and dry clothes. See you soon!`,
        ].join('\n'),
      };
    default:
      return {
        subject: payload.subject || 'Canyoning Bali notification',
        text: payload.text || JSON.stringify(payload),
      };
  }
}

function toHtml(text) {
  return `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#1f2933">${text
    .split('\n')
    .map((line) => (line ? `<p style="margin:0 0 8px">${escapeHtml(line)}</p>` : ''))
    .join('')}</div>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function sendEmail(to, subject, text) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not configured.');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || 'Canyoning Bali <onboarding@resend.dev>',
      to: [to],
      subject,
      text,
      html: toHtml(text),
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Email provider error (${response.status}): ${body.slice(0, 200)}`);
  }
}

async function sendWhatsApp(to, text) {
  const token = process.env.FONNTE_TOKEN;
  if (!token) throw new Error('FONNTE_TOKEN is not configured.');
  const response = await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ target: to, message: text, countryCode: '62' }).toString(),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`WhatsApp provider error (${response.status}): ${body.slice(0, 200)}`);
  }
}

/**
 * Queues H-1 reminders for confirmed bookings happening tomorrow that do not
 * already have a reminder queued or sent. Idempotent: safe to run repeatedly,
 * e.g. from a cron job every few hours.
 */
export async function queueReminders() {
  try {
    const { rows } = await query(
      `insert into public.notifications (channel, recipient, template, payload)
       select 'email', b.email, 'reminder_h1',
              jsonb_build_object('booking', jsonb_build_object(
                'id', b.id,
                'name', b.name,
                'date', b.date::text,
                'tourName', b.tour_name,
                'people', b.people,
                'pickupName', b.pickup_name,
                'total', b.total
              ))
       from public.booking_requests b
       where b.status = 'confirmed'
         and b.date = current_date + 1
         and coalesce(b.email, '') <> ''
         and not exists (
           select 1 from public.notifications n
           where n.template = 'reminder_h1'
             and n.recipient = b.email
             and n.payload -> 'booking' ->> 'id' = b.id::text
         )
       returning id`
    );
    return rows.length;
  } catch (error) {
    console.error('Could not queue reminders:', error.message);
    return 0;
  }
}

/**
 * Sends queued notifications. Safe to call from a cron job: each row is
 * marked sent/failed independently so one bad recipient cannot block others.
 */
export async function dispatchQueued(limit = 20) {
  const { rows } = await query(
    `select * from public.notifications
     where status = 'queued' and attempts < 3
     order by created_at
     limit $1`,
    [limit]
  );

  let sent = 0;
  let failed = 0;

  for (const item of rows) {
    const { subject, text } = render(item.template, item.payload);
    try {
      if (item.channel === 'email') {
        await sendEmail(item.recipient, subject, text);
      } else if (item.channel === 'whatsapp') {
        await sendWhatsApp(item.recipient, text);
      } else {
        throw new Error(`Unsupported channel: ${item.channel}`);
      }
      await query(
        `update public.notifications
         set status = 'sent', sent_at = now(), attempts = attempts + 1, error = null
         where id = $1`,
        [item.id]
      );
      sent += 1;
    } catch (error) {
      await query(
        `update public.notifications
         set status = case when attempts + 1 >= 3 then 'failed' else 'queued' end,
             attempts = attempts + 1,
             error = $2
         where id = $1`,
        [item.id, error.message]
      );
      failed += 1;
    }
  }

  return { processed: rows.length, sent, failed };
}