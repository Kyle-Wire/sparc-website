import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HouseDashboard } from "@/components/house/HouseDashboard";
import { ProgressTracker } from "@/components/house/ProgressTracker";
import { currentUser, hasFloodLab, houseBundle, ownOrder, ownProfile } from "@/lib/house/server";
import { greetingName } from "@/lib/house/profile";
import { stepsFor } from "@/lib/house/progress";
import { planKey } from "@/lib/house/plan";
import { deliveredKicker, hello, updateLines, yearAfter } from "@/lib/house/view";

export const dynamic = "force-dynamic";

// One house: while it is being built, the tracker; once delivered, the dashboard.
export default async function HousePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const own = await ownOrder(id);
  if (!own) notFound();
  const { order, userId } = own;
  const { user } = await currentUser();
  const profile = await ownProfile();
  const name = greetingName(profile, (user?.user_metadata?.full_name as string | undefined) ?? null);

  if (order.status !== "delivered") {
    const steps = stepsFor(order.status, order.progress);
    const off = ["cancelled", "cannot_model", "refunded", "abandoned", "awaiting_card"].includes(order.status);
    return (
      <div className="hx">
        <ProgressTracker
          steps={steps}
          title={off ? "This order is closed." : name ? `${name}, your house is in the works.` : "Your house is in the works."}
          note={
            off
              ? "Nothing more will run for it. Your orders page has the details."
              : "Each step lights up as it finishes. You don’t need to keep this page open: we email you when the report is ready, and nothing is charged until then."
          }
        />
        {!off && (
          <div className="hx-card">
            <div className="kicker">While you wait</div>
            <ul className="hx-list">
              <li>
                <Link href={"/account/profile" as Route}>Fill in your profile</Link>: how you want storm alerts, and what worries you about the house.
              </li>
              <li>
                <Link href={"/example/account" as Route}>See what your account will look like</Link>, shown with a sample house.
              </li>
              <li>
                <Link href={"/account/reports" as Route}>Your order</Link>: dates, the card on file and cancelling.
              </li>
            </ul>
          </div>
        )}
      </div>
    );
  }

  const [bundle, lab] = await Promise.all([houseBundle(userId, id), hasFloodLab(userId, id)]);
  const labHref = lab && bundle?.floodLab.offered !== false ? `/account/house/${id}/lab` : null;
  const downloads = [
    { label: "House report (PDF)", href: `/api/reports/${id}/download` },
    { label: "Offline atlas, maps to print and 3D block (zip)", href: `/api/reports/${id}/download?file=package`, note: "Opens from your computer with no internet." },
  ];
  const storm = {
    title: "Storm Ahead is on",
    tone: "quiet" as const,
    text: "It reads the official forecasts for your area and emails you when a storm could reach your house, with what your house’s own models say to expect.",
    foot: order.delivered_at ? `Free until ${yearAfter(order.delivered_at)}` : "Free for your first year",
  };
  if (!bundle)
    return (
      <div className="hx">
        <div className="hx-card">
          <div className="kicker">{deliveredKicker(order.delivered_at, "1.0")}</div>
          <h3>{hello(name, new Date())}</h3>
          <p>Your report is ready. The house page with each finding and the what-if lab is being added to your account; your report has everything in the meantime.</p>
          <ul className="hx-list">
            {downloads.map((d) => (
              <li key={d.label}><a href={d.href}>{d.label}</a></li>
            ))}
          </ul>
        </div>
      </div>
    );
  return (
    <HouseDashboard
      house={bundle}
      hello={hello(name, new Date())}
      kicker={deliveredKicker(order.delivered_at, bundle.report)}
      labHref={labHref}
      downloads={downloads}
      storm={storm}
      updates={updateLines(order.delivered_at)}
      planKey={planKey(id)}
    />
  );
}
