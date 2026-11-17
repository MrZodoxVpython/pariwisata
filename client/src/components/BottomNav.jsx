import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon';

const items = [
  { section: 'top', label: 'Home', icon: 'home' },
  { section: 'adventures', label: 'Tours', icon: 'mountain' },
  { section: 'about', label: 'About', icon: 'users' },
  { section: 'faq', label: 'FAQ', icon: 'help' },
  { section: 'contact', label: 'Contact', icon: 'phone' },
  { section: 'articles', label: 'Articles', icon: 'article' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [active, setActive] = useState('top');

  useEffect(() => {
    if (location.pathname !== '/') {
      setActive('');
      return undefined;
    }
    const setActiveSection = () => {
      const marker = window.scrollY + Math.min(window.innerHeight * 0.35, 220);
      let current = 'top';
      items.forEach((item) => {
        const section = document.getElementById(item.section);
        if (section && section.offsetTop <= marker) current = item.section;
      });
      setActive(current);
    };
    window.addEventListener('scroll', setActiveSection, { passive: true });
    window.addEventListener('resize', setActiveSection, { passive: true });
    setActiveSection();
    return () => {
      window.removeEventListener('scroll', setActiveSection);
      window.removeEventListener('resize', setActiveSection);
    };
  }, [location.pathname]);

  const goTo = (section) => (event) => {
    if (location.pathname !== '/') {
      event.preventDefault();
      navigate(`/#${section}`);
    }
  };

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      <div className="bottom-nav-inner">
        {items.map((item) => (
          <a
            key={item.section}
            className={`bottom-nav-item${active === item.section ? ' active' : ''}`}
            href={`#${item.section}`}
            onClick={goTo(item.section)}
            aria-current={active === item.section ? 'page' : undefined}
          >
            <span className="bn-icon"><Icon name={item.icon} /></span>
            <span>{item.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}