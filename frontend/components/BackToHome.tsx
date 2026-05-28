import Link from "next/link";
import { APP_HOME_PATH } from "@/lib/branding";

type Props = {
  className?: string;
};

export function BackToHome({ className = "" }: Props) {
  return (
    <Link href={APP_HOME_PATH} className={`app-nav-btn ${className}`}>
      <span aria-hidden className="app-nav-btn-icon">
        ←
      </span>
      <span>Startseite</span>
    </Link>
  );
}
