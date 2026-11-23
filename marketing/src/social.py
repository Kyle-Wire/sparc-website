"""Online set: LinkedIn and Instagram graphics as HTML pages sized in px; render_social.cjs makes PNGs.
Sizes vw-based so one design serves square posts, portrait posts and stories."""
import base64, json, pathlib
from iso import block, yard
HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent / "build-social"; OUT.mkdir(exist_ok=True)
INK, PAPER, GREY, LINE, CRIMSON = "#141414", "#f5f4f0", "#6b6b6b", "#d9d7d0", "#a3192b"
HZ = ("#0b6a88", "#cc331f", "#7a4f12", "#3f6b4e")
MARK = (HERE / "sparc-labs-mark.svg").read_text()


def mark(size, theme="ink"):
    svg = MARK if theme == "paper" else MARK.replace("#231f20", "#f2f1ec").replace("fill: #fff;", "fill: #141414;")
    return f'<img src="data:image/svg+xml;base64,{base64.b64encode(svg.encode()).decode()}" style="width:{size};height:{size};display:block">'


def bar(w, h):
    return f'<div style="display:flex;gap:calc({h}*.7)">' + "".join(f'<i style="display:block;width:calc(({w} - 3*{h}*.7)/4);height:{h};background:{c};border-radius:calc({h}/3)"></i>' for c in HZ) + "</div>"


def lock(theme="ink", size="6vw"):
    col = "#f2f1ec" if theme == "ink" else INK
    return f'<div style="display:flex;align-items:center;gap:1.6vw">{mark(size, theme)}<span style="font-size:calc({size}*.42);font-weight:600;color:{col}">SPARC Labs</span></div>'


def foot(theme="ink", note=""):
    c = "#cfcdc6" if theme == "ink" else "#3a3a3a"
    return f'<div style="display:flex;justify-content:space-between;align-items:center">{lock(theme)}<span class="mono" style="font-size:2.6vw;color:{c}">sparclabs.co</span></div>'


CSS = """*{box-sizing:border-box;margin:0;padding:0}body{font-family:Inter,sans-serif;-webkit-font-smoothing:antialiased}
.mono{font-family:'JetBrains Mono',monospace}.stamp{display:inline-block;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.14em;border:1px solid currentColor;padding:.4em .75em;line-height:1}
.pg{width:100vw;height:100vh;display:flex;flex-direction:column;justify-content:space-between;padding:7vw 7.5vw;overflow:hidden}
.ink{background:#141414;color:#f2f1ec}.paper{background:#f5f4f0;color:#141414}
h1{font-weight:600;letter-spacing:-.025em;line-height:1.02}"""


def page(name, w, h, theme, body):
    (OUT / f"{name}.html").write_text(f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body><div class="pg {theme}">{body}</div></body></html>')
    return {"name": name, "w": w, "h": h}


QS = [("Is it in a FEMA flood zone?", "FEMA · National Flood Hazard Layer", HZ[0]),
      ("Have people nearby made flood insurance claims?", "FEMA · OpenFEMA claims", HZ[0]),
      ("Is the ground higher or lower than the streets around it?", "USGS · 3D Elevation Program", HZ[0]),
      ("How much of the block is trees, and how much is pavement?", "NLCD 2021 land cover", HZ[1]),
      ("Which hurricanes passed close?", "NOAA · HURDAT2", HZ[3])]


def qlist(theme, fs="3.5vw"):
    c = "#9c9a93" if theme == "ink" else GREY
    ln = "#333" if theme == "ink" else LINE
    return "".join(f'<div style="display:flex;gap:2.2vw;padding:{"1.7vw" if fs > "3.0vw" else "1.15vw"} 0;border-top:1px solid {ln}"><i style="flex:0 0 1.5vw;height:1.5vw;background:{col};margin-top:1.1vw"></i>'
                   f'<div><div style="font-size:{fs};font-weight:600;line-height:1.2">{q}</div><div class="mono" style="font-size:2vw;color:{c};margin-top:.6vw">{s}</div></div></div>' for q, s, col in QS)


def designs(kind):
    """kind: 'square' | 'portrait' | 'story'"""
    tall = kind != "square"
    art_w = {"square": "60vw", "portrait": "78vw", "story": "92vw"}[kind]
    hs = {"square": "7.2vw", "portrait": "8.6vw", "story": "10vw"}[kind]
    d = {}
    d["one-letter"] = ("ink", f'''<div style="display:flex;justify-content:space-between;align-items:center">{bar("22vw","1.3vw")}<span class="stamp" style="font-size:2vw;color:#cfcdc6">free · any US address</span></div>
<div><h1 style="font-size:{hs}">Your flood zone is one letter.</h1><h1 style="font-size:{hs};font-weight:400;color:#8f8d86">Your street has a whole story.</h1></div>
<div style="width:{art_w};align-self:flex-end;margin:-2vw -2vw 0 0">{block("ink")}</div>{foot()}''')
    d["who-checks"] = ("ink", f'''{bar("22vw","1.3vw")}
<div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:{'7vw' if tall else '4.5vw'}">
<div style="font-size:3.6vw;color:#9c9a93">Your inspector checks the house.</div>{mark("30vw" if tall else "24vw")}<h1 style="font-size:{'11vw' if tall else '9vw'}">Who checks<br>the block?</h1></div>
{foot()}''')
    d["physics"] = ("paper", f'''<span class="stamp" style="font-size:2vw;align-self:flex-start">how a flood model works</span>
<div><h1 style="font-size:{hs}">It's physics, not a crystal ball.</h1>
<div style="margin-top:{'6vw' if tall else '3.5vw'}">''' + "".join(
        f'<div style="display:flex;gap:2.4vw;align-items:baseline;padding:{"2.3vw" if tall else "1.5vw"} 0;border-top:1px solid {LINE}"><span class="mono" style="font-size:2.4vw;color:{c}">0{i+1}</span><span style="font-size:{"4vw" if tall else "3.4vw"};font-weight:600">{t}</span></div>'
        for i, (t, c) in enumerate([("The shape of the ground, to about a meter", HZ[0]), ("How rough the streets and yards are", HZ[3]), ("What's paved, what's soil, how fast it drains", HZ[2]), ("A storm. Gravity does the rest.", HZ[1])])) +
        f'''</div><div style="font-size:{"3.3vw" if tall else "2.8vw"};line-height:1.4;color:#3a3a3a;margin-top:3vw">It shows what happened in the storms we ran, and every result says how much evidence stands behind it.</div></div>
{foot("paper")}''')
    d["never"] = ("ink", f'''<span class="stamp" style="font-size:2vw;align-self:flex-start;color:#e6b3ba">the fine print, in big print</span>
<div><h1 style="font-size:{hs}">Things we will never tell you.</h1><div style="margin-top:{'6vw' if tall else '3.5vw'}">''' + "".join(
        f'<div style="display:flex;gap:2.6vw;align-items:baseline;padding:{"2.4vw" if tall else "1.6vw"} 0;border-top:1px solid #333"><span style="font-size:{"4.4vw" if tall else "3.6vw"};color:#c42a3d;font-weight:600">×</span><span style="font-size:{"4.4vw" if tall else "3.6vw"};font-weight:600">{t}</span></div>'
        for t in ("That a house is safe.", "A dollar figure for a disaster.", "A risk score we made up.", "That a result is proven before it's measured.")) +
        f'</div></div>{foot()}')
    legend = '<div class="mono" style="display:flex;flex-wrap:wrap;gap:1.4vw 3vw;font-size:2vw;letter-spacing:.1em;color:#cfcdc6;text-transform:uppercase">' + "".join(
        f'<span style="display:flex;align-items:center;gap:1vw"><i style="display:block;width:1.8vw;height:1.8vw;background:{c}"></i>{t}</span>'
        for c, t in [("#3a3a3a", "neighbor's raised yard"), ("#1f86a6", "water"), ("#c42a3d", "French drain"), ("#4f8a63", "rain garden"), ("#9a6a2a", "barrel")]) + "</div>"
    d["french-drain"] = ("ink", f'''<span class="stamp" style="font-size:2vw;align-self:flex-start;color:#e6b3ba">in the house report</span>
<h1 style="font-size:{hs}">Try a French drain before you dig one.</h1>
<div style="width:{art_w};align-self:center">{yard("ink", labels=False)}<div style="margin-top:2.5vw">{legend}</div></div>{foot()}''')
    d["remember"] = ("paper", f'''<span class="stamp" style="font-size:2vw;align-self:flex-start">free · no account</span>
<div><h1 style="font-size:{hs}">What does your block remember?</h1><div style="margin-top:{'5vw' if tall else '2.5vw'}">{qlist("paper", "3.9vw" if tall else "2.9vw")}</div></div>
{foot("paper")}''')
    if kind == "story":   # stories get a call to action where the link sticker goes
        for k, (t, body) in d.items():
            cta = f'<div style="text-align:center;font-size:3.6vw;font-weight:600;padding:3vw;border:2px dashed {"#555" if t == "ink" else "#bbb"};color:{"#cfcdc6" if t == "ink" else "#3a3a3a"}">Look up any address · link here</div>'
            d[k] = (t, body.replace(foot(t), cta + foot(t)))
    return d


pages = []
for kind, (w, h), keys, prefix in (
        ("square", (1200, 1200), ["one-letter", "who-checks", "physics", "never", "french-drain", "remember"], "linkedin/post"),
        ("portrait", (1080, 1350), ["one-letter", "who-checks", "physics", "never", "french-drain", "remember"], "instagram/post"),
        ("story", (1080, 1920), ["who-checks", "remember", "french-drain"], "instagram/story")):
    ds = designs(kind)
    for i, k in enumerate(keys, 1):
        th, body = ds[k]
        pages.append(page(f"{prefix.replace('/', '__')}-{i:02d}-{k}", w, h, th, body))

# profile images: the mark alone, centered, both themes
for name, w, th in (("linkedin__profile-logo", 400, "ink"), ("instagram__profile-logo", 1080, "ink"), ("linkedin__profile-logo-light", 400, "paper")):
    pages.append(page(name, w, w, th, f'<div style="margin:auto">{mark("64vw", th)}</div>').__class__ and {"name": name, "w": w, "h": w})
    (OUT / f"{name}.html").write_text(f'<!doctype html><html><head><style>{CSS}</style></head><body><div class="pg {th}" style="padding:0;align-items:center;justify-content:center">{mark("64vw", th)}</div></body></html>')

# banners
def banner(name, w, h, big):
    body = (f'<div style="display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:3vw;height:100%">'
            f'<div style="display:flex;flex-direction:column;gap:1.6vh"><h1 style="font-size:{big}">Who checks the block?</h1>'
            f'<div style="font-size:calc({big}*.4);color:#9c9a93">Flood, heat, ground and wind for any US block. The source on every line.</div>'
            f'<div style="margin-top:1vh">{bar("calc(" + big + "*4)", "calc(" + big + "*.13)")}</div></div><div></div>'
            f'<div style="height:100%;display:flex;align-items:flex-end">{block("ink").replace("width:100%", "width:" + str(round(h * 1.45)) + "px")}</div></div>')
    (OUT / f"{name}.html").write_text(f'<!doctype html><html><head><style>{CSS}</style></head><body><div class="pg ink" style="padding:0 3vw 0 {("23vw" if "company" in name else "21vw")};justify-content:center">{body}</div></body></html>')
    return {"name": name, "w": w, "h": h}

pages.append(banner("linkedin__company-banner", 1128, 191, "4vw"))
pages.append(banner("linkedin__personal-banner", 1584, 396, "3.1vw"))
(OUT / "manifest.json").write_text(json.dumps(pages, indent=1))
print(len(pages), "pages")
