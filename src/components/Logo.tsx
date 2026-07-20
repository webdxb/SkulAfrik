interface LogoProps { height?: number; variant?: 'auto' | 'dark'; className?: string; }

export function Logo({ height = 44, variant = 'auto', className = '' }: LogoProps) {
  if (variant === 'dark') {
    return (
      <span className={`inline-flex items-center font-heading font-bold select-none tracking-tight ${className}`} style={{ fontSize: height * 0.62, lineHeight: 1 }}>
        <span style={{ color: '#ffffff' }}>Skul</span>
        <span style={{ color: '#4ade80' }}>&nbsp;Afrik</span>
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center font-heading font-bold select-none tracking-tight ${className}`} style={{ fontSize: height * 0.62, lineHeight: 1 }}>
      <span style={{ color: '#1e293b' }}>Skul</span>
      <span style={{ color: '#4ade80' }}>&nbsp;Afrik</span>
    </span>
  );
}
