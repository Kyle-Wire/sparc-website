import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero } from "@/components/marketing/page-shell";
import { PlacesList } from "@/components/place/PlacesList";

export const metadata = {
  title: "Your places",
  robots: { index: false, follow: false },
};

// Saved and recently viewed places. Everything listed here is read from the
// visitor's own browser (src/components/place/saved-places.ts); the server
// renders the frame and knows nothing about what is in it. An account that
// carries this across devices is in docs/design/roadmap.md, not built.

export default function PlacesPage() {
  return (
    <>
      <Nav active="places" />
      <main id="main">
      <PageHero
        kicker="your places · kept in this browser"
        title="The places you are weighing up."
        lead="Save a place to keep your note and a snapshot of what the record said that day. Tick a few to see them side by side. No account, and nothing here is sent to us."
        accent="var(--flood)"
      />
      <section className="compact">
        <div className="wrap">
          <PlacesList />
          <p className="record-aside" style={{ marginTop: 28, maxWidth: 760 }}>
            Because this list lives in your browser, it will not follow you to another device and it goes if
            you clear your browsing data. An account that carries it with you is planned.
          </p>
        </div>
      </section>
      </main>
      <Footer />
    </>
  );
}
