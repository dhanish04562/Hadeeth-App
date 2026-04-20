import nuurMark from "@/assets/nuur-mark.svg";
import nuurWordmark from "@/assets/nuur-wordmark.svg";

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
        src={nuurMark}
        alt="Nuur logo"
        className={`h-9 w-9 rounded-lg ${className}`.trim()}
      />
    );
  }

  if (wordmark) {
    return (
      <img
        src={nuurWordmark}
        alt="Nuur wordmark"
        className={`h-10 w-auto ${className}`.trim()}
      />
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <img src={nuurMark} alt="Nuur logo" className="h-10 w-10 rounded-lg shadow-gold" />
      <div className="leading-tight">
        <p className="font-serif text-lg">Nuur</p>
        {subtitle ? (
          <p className="text-[10px] uppercase tracking-[0.2em] text-current/60">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
