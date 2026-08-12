"use client";

import { AppScreenHeader } from "@/components/AppScreenHeader";
import { RivalManagePanel } from "@/components/RivalManagePanel";

export default function RivalsSettingsPage() {
  return (
    <div className="settings-screen">
      <AppScreenHeader
        section="Rivalen"
        title="Rivalen verwalten"
        subtitle="Anlegen, Bilder, umbenennen, zusammenführen oder löschen — nur auf diesem Gerät."
        backHref="/stats"
        backLabel="Zurück zur Statistik"
      />
      <RivalManagePanel />
    </div>
  );
}
