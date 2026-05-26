import { HomeBentoGrid } from "@/components/HomeBentoGrid";
import { ResumeActiveGame } from "@/components/ResumeActiveGame";

export default function AppHomePage() {
  return (
    <main className="home-screen-main pt-safe pb-safe mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col gap-3 overflow-hidden px-4 py-4">
      <ResumeActiveGame variant="bento" />
      <HomeBentoGrid />
    </main>
  );
}
