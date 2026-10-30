import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section } from "@/components/marketing/page-shell";
import { EMAIL_PRIMARY } from "@/lib/brand";

export const metadata = { title: "Documentation" };

// Rewritten 2026-10-30. Everything on this page was broken:
//
//   1. All four links pointed at https://github.com/sparclabs/sparc, which
//      returns 404. The repository does not exist and never has. The engine
//      lives at Kyle-Wire/sparc-resilience and it is private.
//   2. Worse than dead: the GitHub organisation `sparclabs` DOES exist and is
//      NOT ours. It was created on 2026-03-04 and its public repositories are
//      `AgenticPay` and `nilgiri`. So this page sent every visitor into a
//      stranger's namespace, and if that org ever creates a repository called
//      `sparc`, these links would have delivered our readers into it.
//   3. "All technical documentation lives in the open-source repository" — the
//      code is proprietary. This is the same contradiction as the AGPL claim
//      removed from /about, /product and the Terms of Service on 29 Oct, in a
//      phrasing that sweep did not match.
//   4. "Contributing — How to submit a community template or plugin" invited
//      outside contributions to proprietary code, which would leave the
//      copyright in a contributor's hands rather than the company's. The same
//      invitation was removed from SPARC_Labs_GEV's README for that reason.
//
// Do not add a link to a documentation URL until that URL resolves, and do not
// link to the `sparclabs` org under any circumstances.

export default function DocsPage() {
  return (
    <>
      <Nav />
      <PageHero kicker="documentation" title="The manual, the methods, the pipelines." lead="Our technical documentation is not published yet. The methodology reports are the substantive write-ups and they are being prepared for release." accent="var(--purple)" />
      <Section>
        <article className="prose">
          <p>
            This page used to link to a public repository. There isn&apos;t one:
            the code is proprietary and the repositories are private, so the links
            went nowhere. Rather than leave four broken links up, here is what
            actually exists and where it stands.
          </p>

          <h2>Methodology reports</h2>
          <p>
            One per hazard program — heat, flooding, wind and ground motion. Each
            one walks through the science, states the weaknesses and the prohibited
            uses <em>before</em> the results, and gives every figure a named run and
            a file it came from. They include the results that failed.
            They are written and are being prepared for publication; they are not
            public yet.
          </p>

          <h2>User documentation</h2>
          <p>
            There is a manual, a pipeline guide and an interpretation guide inside
            the engine repository. They ship with the software rather than being
            hosted here, and since there is nothing to download yet, there is
            nothing for them to accompany.
          </p>

          <h2>Want a copy before then?</h2>
          <p>
            If you are evaluating us and need the technical detail now — a
            procurement review, a research collaboration, a peer read — email{" "}
            <a href={`mailto:${EMAIL_PRIMARY}`}>{EMAIL_PRIMARY}</a> and say which
            program you care about. That is a real offer; the documents exist.
          </p>
        </article>
      </Section>
      <Footer />
    </>
  );
}
