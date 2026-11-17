export default function Icon({ name, className = 'icon', ...rest }) {
  return (
    <svg className={className} aria-hidden="true" {...rest}>
      <use href={`#i-${name}`} />
    </svg>
  );
}

export function IconSprite() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute', overflow: 'hidden' }} aria-hidden="true" focusable="false">
      <defs>
        <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M7 17 17 7M9 7h8v8" /></symbol>
        <symbol id="i-check" viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></symbol>
        <symbol id="i-star" viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="m12 2.5 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.1l6.2-.9L12 2.5Z" /></symbol>
        <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></symbol>
        <symbol id="i-users" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17" cy="8" r="2.5" /><path d="M17 14c2.8 0 5 2.2 5 5" /></symbol>
        <symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" /><path d="m9 12 2 2 4-4" /></symbol>
        <symbol id="i-camera" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="14" rx="3" /><circle cx="12" cy="13" r="4" /><path d="M8 6l1.5-2h5L16 6" /></symbol>
        <symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></symbol>
        <symbol id="i-phone" viewBox="0 0 24 24"><path d="M6 3h4l2 5-2.5 1.5a15 15 0 0 0 5 5L16 12l5 2v4c0 1.1-.9 2-2 2C10.3 20 4 13.7 4 5c0-1.1.9-2 2-2Z" /></symbol>
        <symbol id="i-mail" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></symbol>
        <symbol id="i-wa" viewBox="0 0 24 24"><path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.6-4A8 8 0 1 1 20 11.5Z" /><path d="M9 8.5c.5 2.5 2 4 4.5 4.5l1-1.5 2 1c-.5 1.5-1.5 2-3 1.5-2.5-.8-4.7-3-5.5-5.5-.5-1.5 0-2.5 1.5-3l1 2-1.5 1Z" /></symbol>
        <symbol id="i-instagram" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" /></symbol>
        <symbol id="i-close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" /></symbol>
        <symbol id="i-chevron" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></symbol>
        <symbol id="i-leaf" viewBox="0 0 24 24"><path d="M5 19c8 0 14-5 14-13-8 0-14 5-14 13Z" /><path d="M5 19c3-4 6-6 10-8" /></symbol>
        <symbol id="i-water" viewBox="0 0 24 24"><path d="M3 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 13c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0" /></symbol>
        <symbol id="i-mountain" viewBox="0 0 24 24"><path d="M3 20 10 6l4 8 2-4 5 10H3Z" /></symbol>
        <symbol id="i-home" viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v10h13V10" /><path d="M10 20v-5h4v5" /></symbol>
        <symbol id="i-help" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-.9.6-1.5 1.2-1.5 2.3" /><circle cx="12" cy="17" r=".9" fill="currentColor" stroke="none" /></symbol>
        <symbol id="i-article" viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></symbol>
        <symbol id="i-calendar" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></symbol>
        <symbol id="i-left" viewBox="0 0 24 24"><path d="M19 12H5M11 18l-6-6 6-6" /></symbol>
        <symbol id="i-right" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></symbol>
        <symbol id="i-download" viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></symbol>
        <symbol id="i-card" viewBox="0 0 24 24"><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 9.5h19M6 15h4" /></symbol>
        <symbol id="i-bank" viewBox="0 0 24 24"><path d="M3 9 12 4l9 5M5 9v9M9.5 9v9M14.5 9v9M19 9v9M3 20h18" /></symbol>
        <symbol id="i-qr" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM19 14h2M14 19h3M19 19h2v2" /></symbol>
        <symbol id="i-copy" viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" /></symbol>
        <symbol id="i-lock" viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></symbol>
        <symbol id="i-moon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" /></symbol>
        <symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></symbol>
      </defs>
    </svg>
  );
}