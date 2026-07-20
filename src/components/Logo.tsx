interface LogoProps {
  height?: number;
  variant?: 'auto' | 'dark'; // 'dark' = on dark BG (uses mix-blend or CSS wordmark)
  className?: string;
}

/**
 * Official Skul Afrik logo.
 * variant='auto'  → use the JPG image with mix-blend-multiply (works on white/light BGs)
 * variant='dark'  → CSS wordmark for dark backgrounds (sidebar, login page, etc.)
 */
export function Logo({ height = 36, variant = 'auto', className = '' }: LogoProps) {
  if (variant === 'dark') {
    return (
      <span className={`inline-flex items-center font-heading font-bold select-none ${className}`}
            style={{ fontSize: height * 0.6, lineHeight: 1 }}>
        <span style={{ color: '#ffffff' }}>Skul</span>
        <span style={{ color: '#4ade80' }}>&nbsp;Afrik</span>
      </span>
    );
  }

  return (
    <img
      src="/logo.jpg"
      alt="Skul Afrik"
      height={height}
      className={`block object-contain mix-blend-multiply ${className}`}
      style={{ height, width: 'auto', maxWidth: height * 3.5 }}
    />
  );
}
