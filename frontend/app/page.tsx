import { MarketingLanding } from "@/components/MarketingLanding";
import { NativeAppEntry } from "@/components/NativeAppEntry";

export default function LandingPage() {
  return (
    <NativeAppEntry>
      <main className="landing-shell pt-safe pb-safe">
        <MarketingLanding />
      </main>
    </NativeAppEntry>
  );
}
