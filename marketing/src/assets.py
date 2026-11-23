"""Write each brand element as its own file: logo (dark/light), hazard bar, block and yard art. PNGs come from render_assets.cjs."""
import pathlib, json
from iso import block, yard
HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent / "assets" / "brand"; OUT.mkdir(parents=True, exist_ok=True)
MARK = (HERE / "sparc-labs-mark.svg").read_text()
inv = MARK.replace("#231f20", "#f2f1ec").replace("fill: #fff;", "fill: #141414;")
files = {
    "logo-mark-black.svg": MARK,
    "logo-mark-white.svg": inv.replace("fill: #141414;", "fill: none;"),
    "art-block-ink.svg": block("ink"), "art-block-paper.svg": block("paper"),
    "art-yard-ink.svg": yard("ink", labels=False), "art-yard-paper.svg": yard("paper", labels=False),
}
bar = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 24">' + "".join(
    f'<rect x="{i*103}" y="0" width="91" height="24" rx="7" fill="{c}"/>' for i, c in enumerate(("#0b6a88", "#cc331f", "#7a4f12", "#3f6b4e"))) + "</svg>"
files["hazard-bar.svg"] = bar
for n, t in files.items():
    t = t.replace('style="width:100%;height:auto;display:block" ', "")
    (OUT / n).write_text(t)
print("\n".join(files))
