"""Copy Climate Home Inspection's sample reports onto the website.

    python scripts/samples/import-chi-samples.py <path/to/climate-home-inspection> <tag, e.g. 2026-11-25>

Reads reports/samples/<ID>/ (report.pdf, report.html, pages/page-<n>.png), as
built by CHI's tools/report/build_sample.py, and writes:

  public/samples/sample-report-<a|b>.pdf
  public/samples/pages/<tag>/<a|b>-page-<n>.webp          full page, 1224 px wide
  public/samples/pages/<tag>/<a|b>-page-<n>-thumb.webp    408 px wide
  src/lib/copy/samples.json                   page titles, the four answers on
                                              the "How your land works" page,
                                              and the engine versions, all read
                                              from the report as printed

Nothing is typed by hand: the page reads its titles and answers from the JSON,
so a rebuilt sample needs only this script. Old page images beyond the new
page count are deleted. Samples never mark a house; this script copies the
sample build, never a --private one.
"""
import html
import json
import re
import sys
from pathlib import Path

from PIL import Image

SAMPLES = [("a", "PHL-POC-001", "Sample A"), ("b", "PHL-POC-002", "Sample B")]
# Page images go in a folder named for the build, so a changed page gets a new
# URL and no image cache (the browser's, or the host's optimiser) shows the old one.
TAG = sys.argv[2] if len(sys.argv) > 2 else "current"
chi = Path(sys.argv[1]).resolve()
site = Path(__file__).resolve().parents[2]
pub = site / "public" / "samples"
pages_dir = pub / "pages" / TAG
pages_dir.mkdir(parents=True, exist_ok=True)
text = lambda s: re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s))).strip()

out = {"source": "climate-home-inspection reports/samples (tools/report/build_sample.py)", "samples": []}
for key, pid, name in SAMPLES:
    src = chi / "reports" / "samples" / pid
    h = (src / "report.html").read_text(encoding="utf-8")
    assert "Sample report" in h, f"{pid}: not a sample build"
    pages = h.split('<section class="page')[1:]
    pngs = sorted((src / "pages").glob("page-*.png"), key=lambda p: int(p.stem.split("-")[1]))
    assert len(pngs) == len(pages), f"{pid}: {len(pngs)} pictures for {len(pages)} pages"

    titles = []
    for i, pg in enumerate(pages, 1):
        sec = re.search(r'class="kick sec">(.*?)</div>', pg, re.S)
        h2 = re.search(r"<h2[^>]*>(.*?)</h2>", pg, re.S)
        if i == 1:
            titles.append({"section": "Sample", "title": "What you get: a sample report"})
        elif 'class="answers' in pg:
            titles.append({"section": "Title page", "title": "How your land works"})
        else:
            titles.append({"section": text(sec.group(1)) if sec else "", "title": text(h2.group(1)) if h2 else text(sec.group(1)) if sec else ""})

    title_page = next(pg for pg in pages if 'class="answers' in pg)
    answers = [{"kick": text(k), "say": text(s)} for k, s in
               re.findall(r'<div class="ans"[^>]*><div class="kick">(.*?)</div><div class="say">(.*?)</div>', title_page, re.S)]

    eng = re.search(r"Engine versions behind this report.*?<tbody>(.*?)</tbody>", pages[0], re.S | re.I)
    engines = []
    for row in re.findall(r"<tr>(.*?)</tr>", eng.group(1) if eng else "", re.S):
        cells = [text(c) for c in re.findall(r"<td[^>]*>(.*?)</td>", row, re.S)]
        if len(cells) >= 3:
            engines.append({"engine": cells[0], "version": cells[1], "run": cells[2]})

    (pub / f"sample-report-{key}.pdf").write_bytes((src / "report.pdf").read_bytes())
    for old in list(pub.glob(f"{key}-page-*.webp")) + list((pub / "pages").glob(f"*/{key}-page-*.webp")):
        old.unlink()
    for i, p in enumerate(pngs, 1):
        im = Image.open(p).convert("RGB")
        im.resize((1224, round(im.height * 1224 / im.width)), Image.LANCZOS).save(pages_dir / f"{key}-page-{i}.webp", quality=82, method=6)
        im.resize((408, round(im.height * 408 / im.width)), Image.LANCZOS).save(pages_dir / f"{key}-page-{i}-thumb.webp", quality=80, method=6)
    out["samples"].append({"id": key, "property": pid, "name": name, "pages": titles, "answers": answers, "engines": engines,
                           "pdf": f"/samples/sample-report-{key}.pdf", "dir": f"/samples/pages/{TAG}"})
    print(f"{name}: {len(pngs)} pages, {len(answers)} answers, {len(engines)} engines")

(site / "src" / "lib" / "copy" / "samples.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
