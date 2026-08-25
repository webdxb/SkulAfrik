interface LogoProps { height?: number; variant?: 'auto' | 'dark'; className?: string; iconOnly?: boolean; }

const PURPLE = '#6D28D9';

export function Logo({ height = 44, variant = 'auto', className = '', iconOnly = false }: LogoProps) {
  const textColor = variant === 'dark' ? '#ffffff' : '#1e293b';
  return (
    <span className={`inline-flex items-center gap-2 select-none ${className}`}>
      <img src="/icon.png" alt="Klasoo" style={{ height, width: height }} className="flex-shrink-0" />
      {!iconOnly && (
        <span className="inline-flex items-center font-heading font-bold tracking-tight" style={{ fontSize: height * 0.62, lineHeight: 1 }}>
          <span style={{ color: textColor }}>Klas</span>
          <span style={{ color: PURPLE }}>oo</span>
        </span>
      )}
    </span>
  );
}
