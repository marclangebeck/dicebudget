import Link from "next/link";
import { APP_HOME_PATH } from "@/lib/branding";

type Props = {
  className?: string;
};

export function BackToHome({ className = "" }: Props) {
  return (
    <Link href={APP_HOME_PATH} className={`btn-secondary text-link inline-flex min-h-9 items-center px-3 py-1.5 text-sm font-medium ${className}`}>
      ← Startseite
    </Link>
  );
}
