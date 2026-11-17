import { NavLink } from 'react-router-dom';
import { Home, Mountain, Image, Phone } from 'lucide-react';

const items = [
  { to: '/', label: 'Home', Icon: Home },
  { to: '/packages', label: 'Packages', Icon: Mountain },
  { to: '/gallery', label: 'Gallery', Icon: Image },
  { to: '/contact', label: 'Contact', Icon: Phone },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      <div className="bottom-nav-inner">
        {items.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon className="bn-icon" strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}