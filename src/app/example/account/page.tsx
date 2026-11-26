import type { Metadata } from "next";
import { withPage } from "@/lib/seo";
import { HouseDashboard } from "@/components/house/HouseDashboard";
import { ProgressTracker } from "@/components/house/ProgressTracker";
import { ProfileForm } from "@/components/house/ProfileForm";
import { SAMPLE_HOUSE } from "@/lib/house/sample";
import { stepsFor } from "@/lib/house/progress";
import { EMPTY_PROFILE } from "@/lib/house/profile";
import { SAMPLE_A } from "@/lib/example/sample-a";
import { DemoShell } from "./DemoShell";

export const metadata: Metadata = withPage("/example/account", {
  title: "Your account after you buy: a sample house",
  description:
    "What comes with the SPARC Labs Field Kit after you buy: your house's findings for every hazard, a what-if lab to try fixes on your own house, your plan, and Storm Ahead. Shown with Sample A.",
});

// The paid account, shown to anyone with Sample A. ?view=building shows the
// tracker a buyer sees while their report is made; ?view=profile the profile.
export default async function DemoAccount({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  if (view === "building") {
    const at = "2026-11-24T15:00:00Z";
    return (
      <DemoShell active="building">
        <ProgressTracker
          title="Jordan, your house is in the works."
          note="An example of what you see between ordering and delivery. Each step lights up as it finishes, and nothing is charged until the report is ready."
          steps={stepsFor("in_progress", { place: { state: "done", at }, flood: { state: "done", at: "2026-11-25T02:10:00Z" }, heat: { state: "running" } })}
        />
      </DemoShell>
    );
  }
  if (view === "profile") {
    return (
      <DemoShell active="profile">
        <ProfileForm
          p={{ ...EMPTY_PROFILE, display_name: "Jordan Rivera", stage: "under_contract", worries: "Water in the basement, and summer heat for my dad.", alert_preparing: "email_text", phone: "215 555 0100" }}
          email="jordan@example.com"
          saved={false}
          error={null}
          demo
        />
      </DemoShell>
    );
  }
  return (
    <DemoShell active="house">
      <HouseDashboard
        house={SAMPLE_HOUSE}
        hello="Good evening, Jordan. Here is how your house handles weather."
        kicker={`${SAMPLE_A.name} · your SPARC Labs Field Kit · report v${SAMPLE_HOUSE.report}`}
        labHref="/example/account/lab"
        downloads={[
          { label: "House report, 21 pages (PDF)", href: SAMPLE_A.pdf },
          { label: "The block in 3D, every layer", href: "/example" },
          { label: "Offline atlas and maps to print (zip)", href: null, note: "Comes with your own report, and on the drive we post you." },
        ]}
        storm={{
          title: "Quiet",
          tone: "quiet",
          text: "No official watch, outlook or river forecast reaches this block right now. When one does, your house’s own flood and wind models run and you hear from us.",
          foot: "An example · first year free with every report",
        }}
        updates={[
          "Corrections are free for as long as you have the report.",
          "New findings and new hazards are free for a year.",
          "Each update arrives by email with a plain list of what changed.",
        ]}
        planKey="sparc-plan:sample-a"
      />
    </DemoShell>
  );
}
