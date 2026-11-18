import type { Metadata } from "next";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero } from "@/components/marketing/page-shell";
import { Journey } from "@/components/journey/Journey";
import { parsePlaceSlug, placeSlug } from "@/lib/place/coords";
import { ENGINES, type EngineId } from "@/lib/engines";

export const metadata: Metadata = {
  title: "Get a report or run it yourself",
  // Same as place pages: a page that carries a block in its address is not for search engines.
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ place?: string; hazard?: string | string[] }> };

export default async function StartPage({ searchParams }: Props) {
  const sp = await searchParams;
  const p = sp.place ? parsePlaceSlug(sp.place) : null;
  const slug = p ? placeSlug(p) : null;
  const wanted = ([] as string[]).concat(sp.hazard ?? []);
  const hazards = ENGINES.map((e) => e.id).filter((id): id is EngineId => wanted.includes(id));

  return (
    <>
      <Nav active="models" />
      <PageHero
        kicker="the models · paid · not on sale yet"
        title="Get a report, or run the models yourself."
        lead="Flood, heat, ground movement and wind, for the neighbourhood around one home. Pick what you want and we will tell you what can be done at your place. Nothing is charged on this page."
        accent="var(--flood)"
      />
      <div className="wrap-narrow" style={{ padding: "40px var(--wrap-pad) 72px" }}>
        <Journey slug={slug} initialHazards={hazards} />
      </div>
      <Footer />
    </>
  );
}
