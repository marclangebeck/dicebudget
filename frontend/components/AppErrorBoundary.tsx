"use client";

import Link from "next/link";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { APP_HOME_PATH } from "@/lib/branding";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[AppErrorBoundary]", error.message, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-error-boundary flex min-h-[40vh] flex-col items-center justify-center gap-4 px-6 py-12 text-center">
          <h1 className="text-strong text-xl font-semibold">Etwas ist schiefgelaufen</h1>
          <p className="text-secondary max-w-sm text-sm">
            Die Seite konnte nicht geladen werden. Bitte zur Startseite zurückkehren und es
            erneut versuchen.
          </p>
          <Link href={APP_HOME_PATH} className="btn-sky min-h-11 px-6 py-2.5 text-sm">
            Zur Startseite
          </Link>
        </div>
      );
    }

    return this.props.children;
  }
}
