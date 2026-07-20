import { Logo } from './Logo';
import { Link, navigate } from '../lib/router';
import { useI18n } from '../lib/i18n';
import { useState } from 'react';

export function Footer({ onManageCookies }: { onManageCookies: () => void }) {
  const { t } = useI18n();

  return (
    <footer className="bg-slate-900 text-slate-300" id="contact">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg p-3 inline-block">
              <Logo height={36} />
            </div>
            <p className="mt-4 text-sm text-slate-400 max-w-xs">
              The pan-African school management platform. Built for Africa, ready for the world.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/#features" onClick={(e) => { e.preventDefault(); navigate('/#features'); }} className="hover:text-white">{t('nav.features')}</a></li>
              <li><Link to="/pricing" className="hover:text-white">{t('nav.pricing')}</Link></li>
              <li><Link to="/signup" className="hover:text-white">{t('nav.signup')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy" className="hover:text-white">{t('footer.privacy')}</Link></li>
              <li><Link to="/terms" className="hover:text-white">{t('footer.terms')}</Link></li>
              <li><button onClick={onManageCookies} className="hover:text-white text-left">{t('footer.cookies')}</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>hello@skulafrik.com</li>
              <li>Douala · Lagos · Nairobi · Dubai</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row justify-between gap-3">
          <span>© {new Date().getFullYear()} SKUL AFRIK. {t('footer.rights')}</span>
          <span>Built for Africa, ready for the world.</span>
        </div>
      </div>
    </footer>
  );
}

export function CookieBanner({ onManageCookies }: { onManageCookies: () => void }) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(() => !localStorage.getItem('skul_cookie_choice'));
  const [customizing, setCustomizing] = useState(false);
  const [prefs, setPrefs] = useState({ necessary: true, analytics: false, marketing: false });

  if (!visible) return null;

  const save = (choice: 'all' | 'none' | 'custom') => {
    const stored = choice === 'all'
      ? { necessary: true, analytics: true, marketing: true }
      : choice === 'none'
        ? { necessary: true, analytics: false, marketing: false }
        : prefs;
    localStorage.setItem('skul_cookie_choice', JSON.stringify(stored));
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
        {!customizing ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-sm text-slate-600 flex-1">{t('cookies.text')}</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setCustomizing(true)} className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg border border-slate-200">
                {t('cookies.customize')}
              </button>
              <button onClick={() => save('none')} className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg border border-slate-200">
                {t('cookies.reject')}
              </button>
              <button onClick={() => save('all')} className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg">
                {t('cookies.accept')}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">{t('cookies.customize')}</p>
              <button onClick={onManageCookies} className="text-xs text-slate-500 underline">{t('footer.privacy')}</button>
            </div>
            {(['necessary', 'analytics', 'marketing'] as const).map((k) => (
              <label key={k} className="flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={prefs[k]}
                  disabled={k === 'necessary'}
                  onChange={(e) => setPrefs({ ...prefs, [k]: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium">{t(`cookies.${k}`)}</span>
              </label>
            ))}
            <button onClick={() => save('custom')} className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg">
              {t('common.save')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
