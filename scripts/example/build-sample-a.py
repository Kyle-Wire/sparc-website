"""Build the example project's block data (public/example/sample-a/) from the
3D block viewer's scene file.

Input: scene.js written by Climate Home Inspection's tools/package/block3d.py
(CHI PR 63, D60) for Sample A (PHL-POC-001, South Street; no house marked).
The copy used on 24 Nov 2026 is in the project files at
block-3d/viewer/scene.js. Run:

    python scripts/example/build-sample-a.py <path/to/scene.js>

Output, all 600 x 524 cells, 1 px = 1 m, north up:
  dem.png          ground height, 8-bit, metres = lo + v * (hi - lo) / 255
  flood-<k>.png    peak water depth in cm (0-254, 255 = over 2.54 m), six storms
  pet-<k>.png      feels-like temperature (PET) in deg C, 255 = under a roof
  wind.png         wind at 2 m as a colour drape (the engine's own colours)
  base-light.png   ground relief and tree canopy
  scene.json       buildings, streets, legends, wind arrows, sources

PNG is lossless whatever the server does with compression; the browser reads
the grey values back with createImageBitmap(..., {colorSpaceConversion: "none"}).
"""
import base64, io, json, sys
from pathlib import Path

import numpy as np
from PIL import Image

src = Path(sys.argv[1])
out = Path(__file__).resolve().parents[2] / "public" / "example" / "sample-a"
out.mkdir(parents=True, exist_ok=True)

s = src.read_text()
S = json.loads(s[s.index("{"): s.rstrip().rstrip(";").rindex("}") + 1])
NX, NY = S["nx"], S["ny"]
dec = lambda b: base64.b64decode(b)


def grey(name, arr):
    Image.fromarray(arr.reshape(NY, NX).astype(np.uint8), "L").save(out / name, optimize=True)


dem = np.frombuffer(dec(S["dem"]), dtype=np.float32)
lo, hi = float(dem.min()), float(dem.max())
grey("dem.png", np.round((dem - lo) / (hi - lo) * 255))
for k, f in enumerate(S["flood"]):
    grey(f"flood-{k}.png", np.frombuffer(dec(f["depth_cm"]), dtype=np.uint8))
for k, h in enumerate(S["heat"]):
    grey(f"pet-{k}.png", np.frombuffer(dec(h["pet"]), dtype=np.uint8))
for name, b in (("wind.png", S["wind"]["img"]), ("base-light.png", S["base"]["light"])):
    Image.open(io.BytesIO(dec(b))).save(out / name, optimize=True)

r1 = lambda v: round(v, 1)
scene = {
    "nx": NX, "ny": NY, "hx": S["hx"], "hy": S["hy"], "zbase": S["zbase"],
    "dem": {"lo": round(lo, 3), "hi": round(hi, 3)},
    "streets": [{**t, "x": r1(t["x"]), "y": r1(t["y"]), "ang": r1(t["ang"])} for t in S["streets"]],
    "buildings": [
        {"r": [[r1(e), r1(n)] for e, n in b["r"]], "h": [[[r1(e), r1(n)] for e, n in hole] for hole in b["h"]],
         "z0": r1(b["z0"]), "ht": r1(b["ht"]), **({"est": True} if b.get("est") else {})}
        for b in S["buildings"]
    ],
    "flood": [{"storm": f["storm"], "max_cm": f["max_cm"], "wet_share": round(f["wet_share"], 4)} for f in S["flood"]],
    "heat": [{"hour": h["hour"], "air": h["air"]} for h in S["heat"]],
    "wind": {k: S["wind"][k] for k in ("storm", "date", "dir", "gust10", "mean10", "dx", "edges", "colours")}
            | {"arrows": [[r1(a), r1(b), round(c, 3), round(d, 3)] for a, b, c, d in S["wind"]["arrows"]]},
    "ground": {"value": S["ground"]["value"], "range": S["ground"]["range"]},
    "legends": S["legends"],
    "sources": S["sources"],
}
(out / "scene.json").write_text(json.dumps(scene, separators=(",", ":")))
for p in sorted(out.iterdir()):
    print(f"{p.name:18s} {p.stat().st_size / 1024:8.1f} KB")
