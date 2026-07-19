import { useI18n, Locale } from '../lib/i18n';

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useI18n();
  const langs: Locale[] = ['fr', 'en'];
  return (
    <div className={`inline-flex items-center rounded-full border border-slate-200 bg-white p-0.5 ${compact ? 'text-xs' : 'text-sm'}`}>
      {langs.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`px-3 py-1 rounded-full font-medium transition-colors ${
            locale === l ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {l === 'fr' ? 'FR' : 'EN'}
        </button>
      ))}
    </div>
  );
}
