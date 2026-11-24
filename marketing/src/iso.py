"""Abstract isometric block: blocky rowhouses, the house outlined, and the four hazards as sharp shapes.
Flood = stepped water in the low street, heat = wedges from a square sun, wind = bars down the street,
ground = layered slab with a step. Decoration, not data."""
import math

FLOOD, HEAT, GROUND, WIND, CRIMSON = "#0b6a88", "#cc331f", "#7a4f12", "#3f6b4e", "#c42a3d"
THEMES = {
    "ink": dict(top="#2b2b2b", left="#1b1b1b", right="#222", edge="#e9e7e1", ew=0.7, house_top="#f2f1ec", house_l="#bdbab2", house_r="#d6d3cb"),
    "paper": dict(top="#ffffff", left="#d7d4cc", right="#e8e6df", edge="#141414", ew=0.7, house_top="#141414", house_l="#141414", house_r="#2a2a2a"),
}
C, S = math.cos(math.radians(30)), math.sin(math.radians(30))


def P(x, y, z, u=22, ox=0, oy=0):
    return (ox + (x - y) * C * u, oy + (x + y) * S * u - z * u)


class Iso:
    def __init__(self, theme="ink", u=22):
        self.t, self.u, self.el = THEMES[theme], u, []
        self.ox, self.oy = 9 * C * u, 3.5 * u

    def p(self, x, y, z):
        return P(x, y, z, self.u, self.ox, self.oy)

    def poly(self, pts, fill, stroke=None, sw=None, extra=""):
        d = " ".join(f"{a:.2f},{b:.2f}" for a, b in (self.p(*q) for q in pts))
        st = f' stroke="{stroke}" stroke-width="{sw or self.t["ew"]}" stroke-linejoin="miter"' if stroke else ""
        self.el.append(f'<polygon points="{d}" fill="{fill}"{st} {extra}/>')

    def box(self, x0, y0, z0, x1, y1, z1, top=None, left=None, right=None, edge=None, sw=None):
        t = self.t
        top, left, right, edge = top or t["top"], left or t["left"], right or t["right"], edge if edge is not None else t["edge"]
        self.poly([(x0, y1, z0), (x1, y1, z0), (x1, y1, z1), (x0, y1, z1)], left, edge, sw)    # face y=y1
        self.poly([(x1, y0, z0), (x1, y1, z0), (x1, y1, z1), (x1, y0, z1)], right, edge, sw)   # face x=x1
        self.poly([(x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)], top, edge, sw)

    def label(self, x, y, z, text, color, anchor="start", size=9):
        a, b = self.p(x, y, z)
        w = len(text) * (size * 0.6 + 1.2)
        lx = a - (w if anchor == "end" else w / 2 if anchor == "middle" else 0)
        self.el.append(f'<!-- {lx:.1f},{b - size:.1f} {lx + w:.1f},{b + 2:.1f} -->')
        self.el.append(f'<text x="{a:.1f}" y="{b:.1f}" fill="{color}" font-family="JetBrains Mono" font-size="{size}" letter-spacing="1.2" text-anchor="{anchor}">{text}</text>')

    def svg(self, w=None, pad=6):
        import re
        nums = [tuple(map(float, q.split(","))) for e in self.el for q in re.findall(r"(-?[\d.]+,-?[\d.]+)", e)]
        xs, ys = [a for a, b in nums], [b for a, b in nums]
        x0, y0, x1, y1 = min(xs) - pad, min(ys) - pad, max(xs) + pad, max(ys) + pad
        return (f'<svg viewBox="{x0:.1f} {y0:.1f} {x1-x0:.1f} {y1-y0:.1f}" style="width:{w or "100%"};height:auto;display:block" '
                f'xmlns="http://www.w3.org/2000/svg">' + "".join(self.el) + "</svg>")


def block(theme="ink"):
    s = Iso(theme)
    t = s.t
    STEP = -0.24          # the right half of the block sits lower: ground movement
    dz = lambda x: STEP if x >= 4.6 else 0.0
    # ground slab in strata, bottom first
    strata = ["#9a6a2a", GROUND, "#5a3b0f"]
    for (xa, xb) in ((0, 4.6), (4.6, 9.4)):
        d = dz(xa)
        zs = [-1.25 + d, -0.8 + d, -0.4 + d, 0 + d]
        for i in range(3):
            last = i == 2
            s.box(xa, 0, zs[i], xb, 9.2, zs[i + 1], top=t["top"] if last else strata[i], left=strata[2 - i], right=strata[2 - i], edge=t["edge"], sw=0.45)
    # back row: taller, the city behind
    for i, h in enumerate([2.2, 3.1, 1.8, 2.7, 3.6, 2.0, 2.9, 2.4]):
        x = 0.3 + i * 1.12
        s.box(x, 0.4, dz(x), x + 1.0, 2.9, dz(x) + h)
    # street water: stepped tiles, deepest at the low end
    for i in range(8):
        x = 0.2 + i * 1.12
        h = 0.16 + 0.05 * i
        s.box(x, 3.4, dz(x), x + 1.12, 5.0, dz(x) + h, top="#1f86a6", left=FLOOD, right="#0e5a72", edge=None)
    # wind: bars down the street with sharp heads
    for k, (y, z, x0, x1) in enumerate(((3.7, 2.9, 0.4, 6.4), (4.25, 3.6, 1.4, 7.6), (4.75, 2.4, 0.9, 6.9))):
        s.poly([(x0, y, z), (x1, y, z), (x1, y, z + 0.14), (x0, y, z + 0.14)], WIND)
        s.poly([(x1, y, z - 0.2), (x1 + 0.75, y, z + 0.07), (x1, y, z + 0.34)], WIND)
    # front row: low rowhouses, and the house on its own dashed lot
    HX = 4.6
    s.poly([(HX - 0.2, 5.3, dz(HX)), (HX + 1.4, 5.3, dz(HX)), (HX + 1.4, 9.0, dz(HX)), (HX - 0.2, 9.0, dz(HX))], "none", CRIMSON, 1.5, 'stroke-dasharray="5 3"')
    for x, h in ((0.3, 1.2), (1.42, 1.5), (2.54, 1.1), (3.66, 1.35), ("H", 0), (6.3, 0.9), (7.42, 1.3), (8.54, 1.0)):
        if x == "H":
            b = dz(HX)
            s.box(HX + 0.05, 5.4, b, HX + 0.4, 5.95, b + 0.34, top="#1f86a6", left=FLOOD, right="#0e5a72", edge=None)  # water at the walls
            s.box(HX, 6.0, b, HX + 1.2, 8.4, b + 1.0, top=t["house_top"], left=t["house_l"], right=t["house_r"], edge=CRIMSON, sw=1.3)
            s.poly([(HX + 1.2, 6.0, b + 1.0), (HX + 1.2, 8.4, b + 1.0), (HX + 0.6, 8.4, b + 1.75), (HX + 0.6, 6.0, b + 1.75)], t["house_r"], CRIMSON, 1.3)
            s.poly([(HX, 8.4, b + 1.0), (HX + 1.2, 8.4, b + 1.0), (HX + 0.6, 8.4, b + 1.75)], t["house_l"], CRIMSON, 1.3)
            continue
        if HX - 0.25 < x < HX + 1.45:
            continue
        s.box(x, 5.7, dz(x), x + 0.95 if x < 8 else x + 0.8, 8.4, dz(x) + h)
    # heat: a square sun and sharp wedges onto roofs
    sun = (8.0, -1.6, 5.6)
    q = 0.55
    s.poly([(sun[0] - q, sun[1] - q, sun[2]), (sun[0] + q, sun[1] - q, sun[2]), (sun[0] + q, sun[1] + q, sun[2]), (sun[0] - q, sun[1] + q, sun[2])], HEAT)
    for tgt in ((4.95, 1.6, 3.6), (HX + 0.9, 7.0, dz(HX) + 1.5), (7.9, 7.0, dz(7.9) + 1.3)):
        a, b2 = s.p(*sun), s.p(*tgt)
        dx, dy = b2[0] - a[0], b2[1] - a[1]
        L = math.hypot(dx, dy); nx, ny = -dy / L * 3.0, dx / L * 3.0
        s.el.append(f'<polygon points="{a[0]+nx:.1f},{a[1]+ny:.1f} {a[0]-nx:.1f},{a[1]-ny:.1f} {b2[0]:.1f},{b2[1]:.1f}" fill="{HEAT}"/>')
    return s.svg()


def yard(theme="ink", labels=True):
    """The backyard story: a raised neighbor's yard pours into ours; a French drain, a rain garden, a barrel."""
    s = Iso(theme)
    t = s.t
    lab = "#cfcdc6" if theme == "ink" else "#3a3a3a"
    strata = ["#9a6a2a", GROUND, "#5a3b0f"]
    for i, (z0, z1) in enumerate(((-1.0, -0.6), (-0.6, -0.3), (-0.3, 0.0))):
        s.box(0, 0, z0, 9.5, 6.4, z1, top=t["top"] if i == 2 else strata[i], left=strata[2 - i], right=strata[2 - i], edge=t["edge"], sw=0.45)
    s.box(0, 0, 0, 3.0, 6.4, 0.75, top="#3a3a3a" if theme == "ink" else "#cfccc3", left=t["left"], right=t["right"], edge=t["edge"], sw=0.6)
    s.poly([(3.0, 0, 0), (9.5, 0, 0), (9.5, 6.4, 0), (3.0, 6.4, 0)], "none", t["edge"], 1.0, 'stroke-dasharray="5 3"')
    # the house at the back of the lot, a barrel at its corner
    s.box(6.4, 0.4, 0, 9.0, 2.6, 1.5, top=t["house_top"], left=t["house_l"], right=t["house_r"], edge=t["edge"], sw=1.0)
    s.poly([(9.0, 0.4, 1.5), (9.0, 2.6, 1.5), (7.7, 2.6, 2.3), (7.7, 0.4, 2.3)], t["house_r"], t["edge"], 1.0)
    s.poly([(6.4, 2.6, 1.5), (9.0, 2.6, 1.5), (7.7, 2.6, 2.3)], t["house_l"], t["edge"], 1.0)
    s.box(9.05, 2.7, 0, 9.45, 3.1, 0.75, top="#9a6a2a", left="#5a3b0f", right=GROUND, edge=None)
    # water stepping off the raised yard and gathering at one spot
    for k, (x0, z) in enumerate(((1.5, 0.82), (2.2, 0.82), (3.0, 0.42), (3.6, 0.2))):
        s.box(x0, 3.0 - k * 0.05, z - 0.08, x0 + 0.7, 4.0 + k * 0.05, z, top="#1f86a6", left=FLOOD, right="#0e5a72", edge=None)
    s.box(4.3, 2.9, 0, 5.8, 4.3, 0.14, top="#1f86a6", left=FLOOD, right="#0e5a72", edge=None)
    # French drain: a sharp crimson trench carrying it out to the street side
    s.box(5.8, 3.45, 0, 9.5, 3.75, 0.06, top=CRIMSON, left="#7d1a27", right="#9a2030", edge=None)
    # rain garden: a sunken green square
    s.box(6.6, 4.6, -0.12, 8.4, 6.0, 0.0, top="#4f8a63", left=WIND, right="#335a40", edge=None)
    if not labels:
        return s.svg()
    s.label(1.5, 0.0, 1.7, "NEIGHBOR'S RAISED YARD", lab, "middle")
    s.label(9.9, 3.8, -0.6, "FRENCH DRAIN", "#e6b3ba")
    s.label(7.5, 6.6, -1.9, "RAIN GARDEN", lab, "middle")
    s.label(9.9, 2.4, 0.3, "BARREL", lab)
    return s.svg()


if __name__ == "__main__":
    import sys
    open(sys.argv[1], "w").write(f'<body style="margin:0;display:flex;gap:20px;background:#888"><div style="background:#141414;width:600px;padding:20px">{block("ink")}</div><div style="background:#f5f4f0;width:600px;padding:20px">{block("paper")}</div><div style="background:#141414;width:600px;padding:20px">{yard("ink")}</div></body>')
