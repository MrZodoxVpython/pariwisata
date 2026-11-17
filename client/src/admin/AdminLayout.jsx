import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import adminApi, { setToken } from './api';
import Modal from './components/Modal';
import Field from './components/Field';

const SECTIONS = [
  {
    title: 'Overview',
    items: [{ to: '/admin', label: 'Dashboard', end: true }],
  },
  {
    title: 'Operations',
    items: [
      { to: '/admin/bookings', label: 'Bookings' },
      { to: '/admin/availability', label: 'Availability', roles: ['owner', 'manager'] },
      { to: '/admin/messages', label: 'Messages' },
    ],
  },
  {
    title: 'Content',
    roles: ['owner', 'manager'],
    items: [
      { to: '/admin/tours', label: 'Tours' },
      { to: '/admin/pickups', label: 'Pickup points' },
      { to: '/admin/reviews', label: 'Reviews' },
      { to: '/admin/guides', label: 'Guides' },
      { to: '/admin/gallery', label: 'Gallery' },
      { to: '/admin/articles', label: 'Articles' },
      { to: '/admin/faqs', label: 'FAQs' },
      { to: '/admin/policies', label: 'Policies' },
      { to: '/admin/quiz', label: 'Canyon matcher' },
    ],
  },
  {
    title: 'System',
    items: [
      { to: '/admin/reports', label: 'Reports', roles: ['owner', 'manager'] },
      { to: '/admin/notifications', label: 'Notifications', roles: ['owner', 'manager'] },
      { to: '/admin/settings', label: 'Site settings', roles: ['owner', 'manager'] },
      { to: '/admin/users', label: 'Admin users', roles: ['owner'] },
      { to: '/admin/audit', label: 'Audit log', roles: ['owner'] },
    ],
  },
];

export default function AdminLayout() {
  const { user, logout, hasRole, setUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordDone, setPasswordDone] = useState(false);

  const submitPassword = async (event) => {
    event.preventDefault();
    setPasswordBusy(true);
    setPasswordError('');
    setPasswordDone(false);
    try {
      const payload = await adminApi.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      setToken(payload.token);
      setUser(payload.user);
      setPasswordDone(true);
      setPasswordForm({ currentPassword: '', newPassword: '' });
    } catch (error) {
      setPasswordError(error.message);
    } finally {
      setPasswordBusy(false);
    }
  };

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="admin-brand">
          <span className="admin-brand-mark">CB</span>
          <div>
            <strong>Canyon Admin</strong>
            <small>Canyoning Bali</small>
          </div>
        </div>
        <nav>
          {SECTIONS.map((section) => {
            if (section.roles && !hasRole(...section.roles)) return null;
            const items = section.items.filter((item) => !item.roles || hasRole(...item.roles));
            if (!items.length) return null;
            return (
              <div className="admin-nav-group" key={section.title}>
                <span>{section.title}</span>
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) => (isActive ? 'active' : undefined)}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
      </aside>

      {menuOpen ? <button type="button" className="admin-scrim" onClick={() => setMenuOpen(false)} aria-label="Close menu" /> : null}

      <div className="admin-main">
        <header className="admin-topbar">
          <button type="button" className="admin-menu-btn" onClick={() => setMenuOpen(true)}>
            ☰
          </button>
          <div className="admin-topbar-spacer" />
          <Link className="admin-topbar-link" to="/" target="_blank" rel="noreferrer">
            View site ↗
          </Link>
          <button type="button" className="admin-topbar-link" onClick={() => setPasswordOpen(true)}>
            {user?.name || user?.email}
            <span className="admin-role">{user?.role}</span>
          </button>
          <button type="button" className="admin-btn ghost sm" onClick={logout}>
            Sign out
          </button>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>

      <Modal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        title="Change password"
        footer={
          <>
            <button type="button" className="admin-btn ghost" onClick={() => setPasswordOpen(false)}>
              Close
            </button>
            <button type="submit" form="admin-password-form" className="admin-btn primary" disabled={passwordBusy}>
              {passwordBusy ? 'Saving…' : 'Update password'}
            </button>
          </>
        }
      >
        <form id="admin-password-form" className="admin-form" onSubmit={submitPassword}>
          {passwordError ? <p className="admin-error">{passwordError}</p> : null}
          {passwordDone ? <p className="admin-success">Password updated. Other sessions were signed out.</p> : null}
          <Field label="Current password">
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
              required
            />
          </Field>
          <Field label="New password" hint="At least 8 characters.">
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
              required
              minLength={8}
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}