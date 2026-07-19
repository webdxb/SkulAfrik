interface LogoProps {
  size?: number;
  withText?: boolean;
  className?: string;
}

// Transparent-background SVG logo matching the brand: "Skul" in navy + "Afrik" in green.
export function Logo({ size = 32, withText = true, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Graduation cap mark */}
        <path d="M24 6L4 16L24 26L44 16L24 6Z" fill="#1e293b" />
        <path d="M14 20V28C14 28 18 32 24 32C30 32 34 28 34 28V20" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <circle cx="40" cy="16" r="2.5" fill="#16a34a" />
        <path d="M40 18.5V24" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {withText && (
        <span className="font-heading font-bold text-lg leading-none">
          <span className="text-slate-900">Skul</span><span className="text-emerald-600">Afrik</span>
        </span>
      )}
    </div>
  );
}
