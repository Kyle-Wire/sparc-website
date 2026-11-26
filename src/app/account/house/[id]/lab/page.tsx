import { notFound } from "next/navigation";
import { FloodLab } from "@/components/house/FloodLab";
import { LabTabs } from "@/components/house/LabTabs";
import { hasFloodLab, ownOrder } from "@/lib/house/server";
import { planKey } from "@/lib/house/plan";
import "@/components/house/house.css";

export const dynamic = "force-dynamic";

// The flood what-if lab for a buyer's own house: their emulator and the engine
// come from their private files through /api/house/[id]/whatif/*.
export default async function LabPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const own = await ownOrder(id);
  if (!own || own.order.status !== "delivered" || !(await hasFloodLab(own.userId, id))) notFound();
  return (
    <div className="hx">
      <div>
        <div className="kicker">What-if lab · your house</div>
        <h2 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", margin: "6px 0 0" }}>What if you build it?</h2>
        <p style={{ color: "var(--ink-2)", marginTop: 8, maxWidth: "62ch" }}>
          Try a French drain and a rain garden in your back yard, in storms from an ordinary downpour to a 100-year cloudburst. The
          answers come from a flood model of your own streets and yard, trained for your house alone.
        </p>
      </div>
      <LabTabs />
      <FloodLab files={{ engine: `/api/house/${id}/whatif/engine`, model: `/api/house/${id}/whatif/model` }} planKey={planKey(id)} sample={false} />
    </div>
  );
}
