import nuurLogo from "/favicon.png";

type NuurLogoProps = {
  compact?: boolean;
  wordmark?: boolean;
  subtitle?: string;
  className?: string;
};

export function NuurLogo({
  compact = false,
  wordmark = false,
  subtitle,
  className = "",
}: NuurLogoProps) {
  if (compact) {
    return (
      <img
        src={nuurLogo}
        alt="Nuur logo"
        className={`h-9 w-9 rounded-lg ${className}`.trim()}
      />
    );
  }

  if (wordmark) {
    return (
      <div className={`flex items-center gap-3 ${className}`.trim()}>
        <img src={nuurLogo} alt="Nuur logo" className="h-10 w-10 rounded-xl" />
        <p className="font-serif text-3xl text-foreground">Nuur</p>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <img src={nuurLogo} alt="Nuur logo" className="h-10 w-10 rounded-xl shadow-soft" />
      <div className="leading-tight">
        <p className="font-serif text-lg">Nuur</p>
        {subtitle ? (
          <p className="text-[10px] uppercase tracking-[0.2em] text-current/60">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
