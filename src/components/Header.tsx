import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Logo } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Link, navigate, useRoute } from '../lib/router';
import { useI18n } from '../lib/i18n';

export function Header() {
  const { t } = useI18n();
  const path = useRoute();
  const [open, setOpen] = useState(false);

  const navLinks = [
    { to: '/#features', label: t('nav.features') },
    { to: '/pricing', label: t('nav.pricing') },
    { to: '/#contact', label: t('nav.contact') },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center">
            <Logo />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.to}
                href={link.to}
                onClick={(e) => {
                  if (link.to.startsWith('/#')) {
                    e.preventDefault();
                    if (path !== '/') navigate('/');
                    const id = link.to.slice(2);
                    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 50);
                  }
                }}
                className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher compact />
            <Link
              to="/login"
              className="text-sm font-medium text-slate-700 hover:text-indigo-600 px-3 py-2"
            >
              {t('nav.login')}
            </Link>
            <Link
              to="/signup"
              className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              {t('nav.signup')}
            </Link>
          </div>

          <button
            className="md:hidden p-2 text-slate-700"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {open && (
          <div className="md:hidden border-t border-slate-100 py-4 space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.to}
                href={link.to}
                onClick={(e) => {
                  e.preventDefault();
                  setOpen(false);
                  if (link.to.startsWith('/#')) {
                    if (path !== '/') navigate('/');
                    const id = link.to.slice(2);
                    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 50);
                  } else {
                    navigate(link.to);
                  }
                }}
                className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
              >
                {link.label}
              </a>
            ))}
            <div className="flex items-center justify-between px-3 pt-2">
              <LanguageSwitcher compact />
              <div className="flex gap-2">
                <Link to="/login" onClick={() => setOpen(false)} className="text-sm font-medium text-slate-700 px-3 py-2">
                  {t('nav.login')}
                </Link>
                <Link to="/signup" onClick={() => setOpen(false)} className="text-sm font-semibold text-white bg-indigo-600 px-4 py-2 rounded-lg">
                  {t('nav.signup')}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
