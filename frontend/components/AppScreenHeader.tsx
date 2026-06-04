import { APP_SHORT } from "@/lib/branding";

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
  const tone =
    section === "Einzelspiel"
      ? "solo"
      : section === "Statistik"
        ? "stats"
        : section === "Einstellungen"
          ? "settings"
          : "multi";

  return (
    <header className={`app-screen-header app-screen-header--${tone} shrink-0`}>
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
          <p className="app-screen-kicker">
            {APP_SHORT} · {section}
          </p>
          <h1 className="app-screen-title">{title}</h1>
          {subtitle && (
            <p className="app-screen-subtitle">{subtitle}</p>
          )}
        </div>
      </div>
    </header>
  );
}
