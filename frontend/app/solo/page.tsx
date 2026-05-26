import { AppScreenHeader } from "@/components/AppScreenHeader";
import { GameSetup } from "@/components/GameSetup";

export default function SoloSetupPage() {
  return (
    <div className="setup-host-screen pb-2">
      <AppScreenHeader
        section="Einzelspiel"
        title="Neues Spiel"
        subtitle="Spielanzahl und Modus wählen – danach startest du deinen Zettel"
      />
      <GameSetup />
    </div>
  );
}
