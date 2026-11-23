"""Build SPARC Labs street-marketing print pieces as HTML; render.mjs turns them into PDF + PNG.

python3 build.py [--campaign street] [--code fl-07]   # --code tags every QR with utm_content
Each QR points at sparclabs.co/how-it-works with utm_source=<piece>, utm_medium=print,
utm_campaign=<campaign>, and utm_content=<code> when given, so each placement can be counted.
"""
import argparse, base64, json, pathlib, segno
from iso import block, yard

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent / "build"

INK, INK2, PAPER, GREY, LINE = "#141414", "#1f1f1f", "#f5f4f0", "#6b6b6b", "#d9d7d0"
FLOOD, HEAT, GROUND, WIND = "#0b6a88", "#cc331f", "#7a4f12", "#3f6b4e"
CRIMSON = "#a3192b"

ap = argparse.ArgumentParser()
ap.add_argument("--campaign", default="street")
ap.add_argument("--code", default=None)
args = ap.parse_args()


def url(src):
    u = f"https://sparclabs.co/how-it-works?utm_source={src}&utm_medium=print&utm_campaign={args.campaign}"
    return u + (f"&utm_content={args.code}" if args.code else "")


def qr(src, dark=INK, short=False):
    u = f"https://sparclabs.co/how-it-works?utm_source={src}&utm_medium=print" if short else url(src)
    q = segno.make(u, error="l" if short else "m")
    return q.svg_inline(scale=1, border=0, dark=dark, omitsize=True).replace(
        "<svg ", '<svg style="width:100%;height:100%;display:block" shape-rendering="crispEdges" ', 1)


_MARK = (HERE / "sparc-labs-mark.svg").read_text()   # the SPARC Labs cube mark, from sparc-resilience sparc-desktop/public/logo.svg


def mark(size, theme="ink"):
    svg = _MARK if theme == "paper" else _MARK.replace("#231f20", "#f2f1ec").replace("fill: #fff;", "fill: #141414;")
    uri = "data:image/svg+xml;base64," + base64.b64encode(svg.encode()).decode()
    return f'<img src="{uri}" style="width:{size};height:{size};display:block" alt="SPARC Labs">'


def lockup(size, theme="ink", word="SPARC Labs", fs=None):
    col = "#f2f1ec" if theme == "ink" else INK
    fs = fs or f"calc({size} * .42)"
    return (f'<div style="display:flex;align-items:center;gap:calc({size} * .28)">{mark(size, theme)}'
            f'<span style="font-size:{fs};font-weight:600;letter-spacing:-.01em;color:{col}">{word}</span></div>')


def bar(w="1.6in", h="0.09in", gap="0.06in"):
    segs = "".join(f'<i style="background:{c}"></i>' for c in (FLOOD, HEAT, GROUND, WIND))
    return f'<div class="bar" style="--w:{w};--h:{h};--g:{gap}">{segs}</div>'


def lot(size="100%", ink=INK, paper="transparent", labels=True, house=INK):
    """The property line: a dashed lot, a house, four hazards reaching in from outside."""
    lab = (lambda x, y, t, c, a="middle": f'<text x="{x}" y="{y}" fill="{c}" text-anchor="{a}" '
           f'font-family="JetBrains Mono" font-size="7.5" letter-spacing="1.2">{t}</text>') if labels else (lambda *a, **k: "")
    return f'''<svg viewBox="0 0 200 200" style="width:{size};height:auto;display:block">
  <rect x="45" y="45" width="110" height="110" fill="{paper}" stroke="{ink}" stroke-width="1.4" stroke-dasharray="5 4"/>
  <path d="M78 128 V98 L100 80 L122 98 V128 Z" fill="none" stroke="{house}" stroke-width="2.2" stroke-linejoin="round"/>
  <rect x="94" y="110" width="12" height="18" fill="none" stroke="{house}" stroke-width="1.6"/>
  <!-- heat: sun rays from the top -->
  <circle cx="100" cy="14" r="6" fill="none" stroke="{HEAT}" stroke-width="2"/>
  <path d="M100 26 V40 M92 25 L86 36 M108 25 L114 36" stroke="{HEAT}" stroke-width="2" stroke-linecap="round"/>
  {lab(130, 17, "HEAT", HEAT, "start")}
  <!-- wind: streamlines from the right -->
  <path d="M196 86 C182 86 178 92 162 92 M196 100 H160 M196 114 C182 114 178 108 162 108" fill="none" stroke="{WIND}" stroke-width="2" stroke-linecap="round"/>
  <path d="M166 96 L159 100 L166 104" fill="none" stroke="{WIND}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  {lab(196, 132, "WIND", WIND, "end")}
  <!-- flood: water from the left -->
  <path d="M4 92 q6 -5 12 0 t12 0 t12 0 M4 104 q6 -5 12 0 t12 0 t12 0 M4 116 q6 -5 12 0 t12 0 t12 0" fill="none" stroke="{FLOOD}" stroke-width="2" stroke-linecap="round"/>
  {lab(4, 80, "FLOOD", FLOOD, "start")}
  <!-- ground: strata and an arrow from below -->
  <path d="M60 172 H140 M70 182 H130 M82 192 H118" stroke="{GROUND}" stroke-width="2" stroke-linecap="round"/>
  <path d="M100 166 V158 M95 162 L100 157 L105 162" fill="none" stroke="{GROUND}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  {lab(146, 184, "GROUND", GROUND, "start")}
</svg>'''


CSS = f"""
@font-face{{font-family:I;src:local('Inter')}}
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{background:#fff}}
body{{font-family:Inter,sans-serif;color:{INK};-webkit-font-smoothing:antialiased;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
.page{{position:relative;overflow:hidden}}
.mono{{font-family:'JetBrains Mono',monospace}}
.bar{{display:flex;gap:var(--g)}} .bar i{{display:block;width:calc((var(--w) - 3*var(--g))/4);height:var(--h);border-radius:calc(var(--h)/3)}}
.stamp{{display:inline-block;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.14em;border:1px solid currentColor;padding:.35em .7em;line-height:1}}
.ink{{background:{INK};color:#f2f1ec}}
.paper{{background:{PAPER}}}
.muted{{color:{GREY}}}
"""


def doc(name, w, h, body, extra_css="", bleed=0.0):
    W, H = w + 2 * bleed, h + 2 * bleed
    html = f"""<!doctype html><html><head><meta charset="utf-8"><title>{name}</title><style>
@page{{size:{W}in {H}in;margin:0}}{CSS}
.page{{width:{W}in;height:{H}in}}
{extra_css}</style></head><body>{body}</body></html>"""
    (OUT / f"{name}.html").write_text(html)
    return {"name": name, "w": W, "h": H, "trim": [w, h], "bleed": bleed}


OUT.mkdir(exist_ok=True)
pieces = []

# ---------------------------------------------------------------- 1. FLYER (letter, home-printable)
QS = [
    ("Is it in a FEMA flood zone?", "FEMA · National Flood Hazard Layer", FLOOD),
    ("Have people nearby made flood insurance claims?", "FEMA · OpenFEMA claims by tract", FLOOD),
    ("Is the ground higher or lower than the streets around it?", "USGS · 3D Elevation Program", FLOOD),
    ("How much of the block is trees, and how much is pavement?", "NLCD 2021 land cover", HEAT),
    ("Which hurricanes and tropical storms passed close?", "NOAA · HURDAT2 storm tracks", WIND),
]
qlist = "".join(f'<li><i style="background:{c}"></i><div><b>{q}</b><span class="mono">{s}</span></div></li>' for q, s, c in QS)
tabs = "".join(f'<div class="tab"><div class="tq">{qr("tab", short=True)}</div><div class="mono tt">sparclabs.co</div><div class="ts">who checks<br>the block?</div></div>' for _ in range(8))
pieces.append(doc("01-flyer-letter", 8.5, 11, f"""
<div class="page" style="background:#fff;padding:.35in .35in 0">
  <div class="ink hero">
    <div style="display:flex;justify-content:space-between;align-items:center">{lockup(".62in")}<span class="stamp" style="font-size:8pt;color:#cfcdc6">free · any US address · no account</span></div>
    <h1>Your flood zone is one letter.</h1>
    <h2>Your street has a whole story.</h2>
    <div style="margin-top:.2in">{bar("1.5in",".085in")}</div>
  </div>
  <div class="mid">
    <div><div class="kick mono">what does your block remember?</div><ul class="ql">{qlist}</ul></div>
    <div class="art">{block("paper")}</div>
  </div>
  <div class="qrrow">
    <div class="bigqr">{qr("flyer")}</div>
    <div>
      <div class="scan">Scan it. Type any address.<br>Read the record.</div>
      <p>Flood, heat, ground and wind, as public agencies publish them, on one page, with the source on every line. We read the whole block, not just your house, and we never sell your address.</p>
      <div class="mono url">sparclabs.co</div>
    </div>
  </div>
  <div class="nots mono"><span>not insurance</span><span>not a score</span><span>the source on every line</span></div>
  <div class="foot"><span>Your inspector checks the house. <b>Who checks the block?</b></span><span class="mono">SPARC LABS · PHILADELPHIA</span></div>
  <div class="tabs">{tabs}</div>
</div>""", f"""
.hero{{border-radius:.12in;padding:.32in .42in .36in}}
.hero h1{{font-size:37pt;line-height:1.02;letter-spacing:-.02em;font-weight:600;margin-top:.3in}}
.hero h2{{font-size:37pt;line-height:1.02;letter-spacing:-.02em;font-weight:400;color:#9c9a93;margin-top:.04in}}
.mid{{display:grid;grid-template-columns:1fr 2.75in;gap:.3in;padding:.2in .1in .12in;align-items:center}}
.kick{{font-size:8.5pt;letter-spacing:.14em;text-transform:uppercase;color:{GREY};margin-bottom:.12in}}
.ql{{list-style:none}} .ql li{{display:flex;gap:.12in;padding:.065in 0;border-top:1px solid {LINE}}}
.ql li i{{flex:0 0 .07in;height:.07in;border-radius:2px;margin-top:.07in}}
.ql b{{display:block;font-size:11pt;font-weight:600;line-height:1.25}} .ql span{{display:block;font-size:7pt;color:{GREY};margin-top:2px;letter-spacing:.04em}}
.qrrow{{display:grid;grid-template-columns:1.9in 1fr;gap:.32in;align-items:center;padding:.16in .1in .14in;border-top:2px solid {INK}}}
.bigqr{{width:1.9in;height:1.9in}}
.scan{{font-size:20pt;font-weight:600;line-height:1.1;letter-spacing:-.01em}}
.qrrow p{{font-size:10pt;line-height:1.4;color:#3a3a3a;margin:.08in 0 .06in;max-width:4.4in}}
.url{{font-size:13pt;font-weight:600;color:{CRIMSON}}}
.nots{{display:flex;gap:.14in;padding:.02in .1in .1in;font-size:7.5pt;letter-spacing:.14em;text-transform:uppercase}} .nots span{{border:1px solid {INK};padding:.05in .1in}}
.foot{{display:flex;justify-content:space-between;font-size:9.5pt;padding:.08in .1in;color:#3a3a3a}} .foot .mono{{font-size:7.5pt;letter-spacing:.14em;color:{GREY}}}
.tabs{{position:absolute;left:.35in;right:.35in;bottom:0;height:1.42in;display:grid;grid-template-columns:repeat(8,1fr);border-top:1.2px dashed {GREY}}}
.tab{{border-left:1.2px dashed {GREY};display:flex;flex-direction:column;align-items:center;padding-top:.12in}} .tab:first-child{{border-left:0}}
.tq{{width:.74in;height:.74in}} .tt{{font-size:7pt;font-weight:600;margin-top:.07in}} .ts{{font-size:6.5pt;color:{GREY};text-align:center;line-height:1.2;margin-top:.03in}}
"""))

# ---------------------------------------------------------------- 2. BUSINESS CARD (3.5x2, 0.125 bleed)
B = 0.125
pieces.append(doc("02-card-front", 3.5, 2, f"""
<div class="page ink" style="padding:{B+0.2}in {B+0.22}in">
  <div style="display:flex;align-items:center;gap:.12in">{mark(".55in")}<div><div style="font-size:15pt;font-weight:600;letter-spacing:-.01em">SPARC Labs</div>
  <div style="font-size:9pt;color:#b9b7b0;margin-top:.01in">Who checks the block?</div></div></div>
  <div style="margin-top:.12in">{bar("0.9in",".05in",".035in")}</div>
  <div style="position:absolute;left:{B+0.22}in;bottom:{B+0.2}in">
    <div style="font-size:10pt;font-weight:600">Kyle Wire</div>
    <div class="mono" style="font-size:6pt;letter-spacing:.12em;color:#b9b7b0;margin-top:.03in">FOUNDER · FLOOD, HEAT AND GROUND MODELS</div>
  </div>
  <div class="mono" style="position:absolute;right:{B+0.22}in;bottom:{B+0.42}in;font-size:8pt;color:#f2f1ec">sparclabs.co</div>
</div>""", bleed=B))
pieces.append(doc("02-card-back", 3.5, 2, f"""
<div class="page paper" style="padding:{B+0.2}in {B+0.22}in;display:grid;grid-template-columns:1fr .95in;gap:.18in;align-items:center">
  <div>
    <div style="display:flex;align-items:center;gap:.08in">{mark(".26in","paper")}<span class="stamp" style="font-size:5.5pt">free · any US address</span></div>
    <div style="font-size:10.5pt;font-weight:600;line-height:1.2;margin-top:.1in">Your flood zone is one letter. Your street has a whole story.</div>
    <div style="font-size:7pt;line-height:1.35;color:#444;margin-top:.07in">Read the public record for any block, free. Or have our models read one house.</div>
  </div>
  <div style="width:.95in;height:.95in">{qr("card")}</div>
</div>""", bleed=B))

# ---------------------------------------------------------------- 3. STICKERS
pieces.append(doc("03-sticker-circle-3in", 3, 3, f"""
<div class="page" style="background:#fff"><div class="ink" style="position:absolute;inset:0;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">
  {mark(".85in")}
  <div style="font-size:21pt;font-weight:600;line-height:1.0;letter-spacing:-.02em;margin-top:.12in">Who checks<br>the block?</div>
  <div style="margin-top:.13in">{bar(".9in",".06in",".04in")}</div>
  <div class="mono" style="font-size:7.5pt;margin-top:.09in;color:#cfcdc6;letter-spacing:.06em">sparclabs.co</div>
</div></div>""", bleed=B))
pieces.append(doc("03-sticker-qr-3in", 3, 3, f"""
<div class="page paper" style="padding:{B+0.2}in;display:flex;flex-direction:column;align-items:center;border-radius:0">
  <div style="font-size:13pt;font-weight:600;letter-spacing:-.01em">This block has a story.</div>
  <div style="width:1.6in;height:1.6in;margin:.12in 0 .1in">{qr("sticker-qr")}</div>
  <div style="display:flex;align-items:center;gap:.09in">{mark(".3in","paper")}<span class="mono" style="font-size:7.5pt">scan · read it free</span></div>
</div>""", bleed=B))
pieces.append(doc("03-sticker-bumper-6x2", 6, 2, f"""
<div class="page ink" style="padding:{B+0.26}in {B+0.34}in;display:flex;align-items:center;gap:.3in">
  {mark("1.1in")}
  <div>
    <div style="font-size:28pt;font-weight:600;letter-spacing:-.025em;line-height:1">Who checks the block?</div>
    <div style="display:flex;align-items:center;gap:.16in;margin-top:.16in">{bar("1.1in",".065in",".045in")}<span style="font-size:11pt;font-weight:600;color:#cfcdc6">SPARC Labs</span></div>
  </div>
</div>""", bleed=B))

# ---------------------------------------------------------------- 4. QR HANDOUT CARD 4x6 (what-if teaser)
drain = f'''<svg viewBox="0 0 300 195" style="width:100%;display:block">
  <rect x="8" y="10" width="120" height="170" fill="#262626" stroke="#555" stroke-dasharray="4 3"/>
  <text x="68" y="30" fill="#9c9a93" font-family="JetBrains Mono" font-size="10" text-anchor="middle" letter-spacing="1">NEIGHBOR'S YARD</text>
  <text x="68" y="42" fill="#9c9a93" font-family="JetBrains Mono" font-size="10" text-anchor="middle" letter-spacing="1">(RAISED)</text>
  <rect x="140" y="10" width="152" height="170" fill="none" stroke="#f2f1ec" stroke-width="1.3" stroke-dasharray="5 4"/>
  <path d="M215 150 V122 L235 106 L255 122 V150 Z" fill="none" stroke="#f2f1ec" stroke-width="2" stroke-linejoin="round"/>
  <g stroke="{FLOOD}" stroke-width="2.2" fill="none" stroke-linecap="round">
    <path d="M40 70 C80 75 110 90 150 100"/><path d="M40 105 C80 104 110 103 150 104"/><path d="M40 140 C80 133 110 118 150 108"/>
    <path d="M143 96 L152 101 L145 109"/>
  </g>
  <circle cx="160" cy="104" r="9" fill="{FLOOD}" opacity=".45"/>
  <path d="M168 104 C190 104 192 60 230 50 L282 40" fill="none" stroke="{CRIMSON}" stroke-width="2.6" stroke-dasharray="7 4" stroke-linecap="round"/>
  <text x="180" y="32" fill="#f2f1ec" font-family="JetBrains Mono" font-size="11" letter-spacing="1">FRENCH DRAIN?</text>
  <circle cx="176" cy="148" r="12" fill="none" stroke="{WIND}" stroke-width="2"/><text x="160" y="172" text-anchor="start" fill="#cfcdc6" font-family="JetBrains Mono" font-size="10" letter-spacing="1">RAIN GARDEN?</text>
  <rect x="266" y="128" width="12" height="18" rx="2" fill="none" stroke="{GROUND}" stroke-width="2"/><text x="284" y="162" fill="#cfcdc6" font-family="JetBrains Mono" font-size="10" text-anchor="end" letter-spacing="1">BARREL?</text>
</svg>'''
pieces.append(doc("04-qr-card-front", 6, 4, f"""
<div class="page ink" style="padding:{B+0.3}in {B+0.32}in;display:grid;grid-template-columns:2.35in 1fr;gap:.25in;align-items:center">
  <div>
    <div style="display:flex;align-items:center;gap:.1in">{mark(".36in")}<span class="stamp" style="font-size:6.5pt;color:#e6b3ba;border-color:#e6b3ba">in the house report</span></div>
    <div style="font-size:25pt;font-weight:600;line-height:1.04;letter-spacing:-.02em;margin-top:.2in">Try a French drain before you dig one.</div>
    <div style="font-size:9.5pt;line-height:1.45;color:#cfcdc6;margin-top:.16in">Add a rain garden, a rain barrel or a French drain, and see how water moves around the house in our flood model.</div>
  </div>
  <div>{yard("ink", labels=False)}<div class="mono" style="display:flex;flex-wrap:wrap;gap:.06in .16in;font-size:6.3pt;letter-spacing:.1em;color:#cfcdc6;margin-top:.12in;text-transform:uppercase"><span style="display:flex;align-items:center;gap:.05in"><i style="display:block;width:.09in;height:.09in;background:#3a3a3a"></i>neighbor's raised yard</span><span style="display:flex;align-items:center;gap:.05in"><i style="display:block;width:.09in;height:.09in;background:#1f86a6"></i>water</span><span style="display:flex;align-items:center;gap:.05in"><i style="display:block;width:.09in;height:.09in;background:#c42a3d"></i>French drain</span><span style="display:flex;align-items:center;gap:.05in"><i style="display:block;width:.09in;height:.09in;background:#4f8a63"></i>rain garden</span><span style="display:flex;align-items:center;gap:.05in"><i style="display:block;width:.09in;height:.09in;background:#9a6a2a"></i>barrel</span></div></div>
</div>""", bleed=B))
pieces.append(doc("04-qr-card-back", 6, 4, f"""
<div class="page paper" style="padding:{B+0.3}in {B+0.32}in;display:grid;grid-template-columns:2.25in 1fr;gap:.34in">
  <div style="display:flex;flex-direction:column;justify-content:space-between">
    <div style="background:#fff;border:1px solid {LINE};padding:.13in"><div style="width:1.97in;height:1.97in">{qr("qr-card")}</div></div>
    <div class="mono" style="font-size:7pt;letter-spacing:.12em;text-transform:uppercase;color:{GREY};text-align:center">scan · any US address</div>
    {bar("2.25in",".07in",".05in")}
  </div>
  <div style="display:flex;flex-direction:column;justify-content:space-between">
    <div style="display:flex;align-items:center;gap:.1in">{mark(".36in","paper")}<span class="stamp" style="font-size:6.5pt">free · no account</span></div>
    <div style="font-size:22pt;font-weight:600;line-height:1.05;letter-spacing:-.015em">Read what your block remembers.</div>
    <div style="font-size:9.5pt;line-height:1.45;color:#3a3a3a">FEMA flood zone, nearby flood claims, elevation, trees and pavement, storm tracks. Every line names its source.</div>
    <div style="font-size:7.5pt;line-height:1.4;color:{GREY};border-top:1px solid {LINE};padding-top:.08in">Screening, not engineering. Every model result says how much evidence stands behind it.</div>
    <div class="mono" style="font-size:12pt;font-weight:600;color:{CRIMSON}">sparclabs.co</div>
  </div>
</div>""", bleed=B))

# ---------------------------------------------------------------- 5. BOOTH SIGN 18x24 (the sign talks first)
pieces.append(doc("05-booth-sign-18x24", 18, 24, f"""
<div class="page ink" style="padding:{B+1.2}in {B+1.3}in">
  <div style="display:flex;justify-content:space-between;align-items:center">{lockup("1.7in", fs="54pt")}{bar("4in",".26in",".16in")}</div>
  <div style="font-size:112pt;font-weight:600;line-height:.98;letter-spacing:-.03em;margin-top:1in">Ask me what your block remembers.</div>
  <div style="font-size:38pt;line-height:1.25;color:#b9b7b0;margin-top:.6in;max-width:14in">Free lookup. Any US address. Two minutes. Flood, heat, ground and wind, from the public record, with the source on every line.</div>
  <div style="width:10in;margin:.3in 0 0 auto">{block("ink")}</div>
  <div style="position:absolute;left:{B+1.3}in;right:{B+1.3}in;bottom:{B+1.2}in;display:grid;grid-template-columns:4.6in 1fr;gap:.8in;align-items:end">
    <div style="background:{PAPER};padding:.3in;border-radius:.15in"><div style="width:4in;height:4in">{qr("booth")}</div></div>
    <div>
      <div style="font-size:44pt;font-weight:600">Rather not chat? Scan it.</div>
      <div style="font-size:28pt;color:#9c9a93;margin-top:.25in;line-height:1.35">Not insurance. Not a score. Just the record, and how much evidence stands behind each line.</div>
      <div class="mono" style="font-size:40pt;color:#f2f1ec;margin-top:.45in">sparclabs.co</div>
    </div>
  </div>
</div>""", bleed=B))

# ---------------------------------------------------------------- 6. BUS SHELTER 47.25x68.25 (aspirational)
SB = 0.5
pieces.append(doc("06-bus-shelter-47x68", 47.25, 68.25, f"""
<div class="page ink" style="padding:{SB+4}in {SB+4}in">
  <div style="display:flex;justify-content:space-between;align-items:center">{lockup("4.6in", fs="150pt")}{bar("11in",".7in",".45in")}</div>
  <div style="font-size:280pt;font-weight:600;line-height:.95;letter-spacing:-.035em;margin-top:3in">Your flood zone is one letter.</div>
  <div style="font-size:280pt;font-weight:400;line-height:.95;letter-spacing:-.035em;color:#8f8d86;margin-top:.6in">Your street has a whole story.</div>
  <div style="width:30in;margin:1in 0 0 auto">{block("ink")}</div>
  <div style="position:absolute;left:{SB+4}in;right:{SB+4}in;bottom:{SB+4}in;display:grid;grid-template-columns:12in 1fr;gap:3in;align-items:end">
    <div style="background:{PAPER};padding:1in;border-radius:.4in"><div style="width:10in;height:10in">{qr("shelter")}</div></div>
    <div>
      <div style="font-size:130pt;font-weight:600;line-height:1.1">Read it free.</div>
      <div style="font-size:76pt;color:#b9b7b0;line-height:1.3;margin-top:.6in">Any US address. No account. The source on every line.</div>
      <div class="mono" style="font-size:120pt;margin-top:1.4in;color:#f2f1ec">sparclabs.co</div>
    </div>
  </div>
</div>""", bleed=SB))

(OUT / "manifest.json").write_text(json.dumps({"campaign": args.campaign, "code": args.code, "pieces": pieces,
                                               "urls": {p: url(p) for p in ["flyer", "flyer-tab", "card", "sticker-qr", "qr-card", "booth", "shelter"]}}, indent=1))
print("built", len(pieces), "pieces into", OUT)
