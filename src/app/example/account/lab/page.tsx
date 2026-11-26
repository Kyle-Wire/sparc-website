import type { Metadata } from "next";
import { withPage } from "@/lib/seo";
import { FloodLab } from "@/components/house/FloodLab";
import { LabTabs } from "@/components/house/LabTabs";
import type { Lattice } from "@/lib/house/flood-lab";
import lattice from "@/lib/house/sample-flood-lattice.json";
import { DemoShell } from "../DemoShell";

export const metadata: Metadata = withPage("/example/account/lab", {
  title: "What-if lab: try a French drain on a sample house",
  description:
    "Move the sliders and see what a French drain and a rain garden change at a real Philadelphia row house, from a flood model trained for that house alone.",
});

export default function DemoLab() {
  return (
    <DemoShell active="lab">
      <div className="hx">
        <div>
          <h2 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>What if you build it?</h2>
          <p style={{ color: "var(--ink-2)", marginTop: 8, maxWidth: "66ch" }}>
            Sample A has a small paved yard behind the house. Try a French drain along the back wall and a rain garden in the rest
            of the yard, in storms from an ordinary downpour to a 100-year cloudburst. On your own house the sliders are smooth and
            the map shows your lot; here they move in steps.
          </p>
        </div>
        <LabTabs />
        <FloodLab lattice={lattice as unknown as Lattice} planKey="sparc-plan:sample-a" sample />
      </div>
    </DemoShell>
  );
}
