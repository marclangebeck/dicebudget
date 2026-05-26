import Link from "next/link";
import { APP_SHORT } from "@/lib/branding";

type Props = {
  section: string;
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
};

export function AppScreenHeader({
  section,
  title,
  subtitle,
  backHref,
  backLabel,
}: Props) {
  return (
    <header className="app-screen-header shrink-0">
      {backHref && (
        <Link href={backHref} className="app-screen-back-link">
          {backLabel ?? "← Zurück"}
        </Link>
      )}
      <div className="app-screen-header-row">
        <img
          src="/apple-touch-icon.png"
          alt=""
          width={40}
          height={40}
          className="home-bento-brand-icon"
          decoding="async"
        />
        <div className="min-w-0">
          <p className="text-muted text-xs">
            {APP_SHORT} · {section}
          </p>
          <h1 className="text-strong text-xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-muted mt-0.5 text-xs leading-snug">{subtitle}</p>
          )}
        </div>
      </div>
    </header>
  );
}
