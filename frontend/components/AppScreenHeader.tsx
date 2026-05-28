import Link from "next/link";
import { APP_HOME_PATH, APP_SHORT } from "@/lib/branding";

type Props = {
  section: string;
  title: string;
  subtitle?: string;
};

export function AppScreenHeader({
  section,
  title,
  subtitle,
}: Props) {
  return (
    <header className="app-screen-header shrink-0">
      <Link href={APP_HOME_PATH} className="app-nav-btn app-nav-btn--header">
        <span aria-hidden className="app-nav-btn-icon">
          ←
        </span>
        <span>Startseite</span>
      </Link>
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
