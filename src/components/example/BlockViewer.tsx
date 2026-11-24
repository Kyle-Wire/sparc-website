"use client";

import { useEffect, useRef, useState } from "react";
import type * as THREEtypes from "three";
import { FLOOD_YARDSTICKS, HEAT_YARDSTICKS, WIND_YARDSTICKS, type LayerId } from "@/lib/example/sample-a";
import "@/styles/example.css";

// The soft 3D map on /example: Sample A's block, locked overhead with north up,
// in the four layers of the report. A port of the 3D block viewer that ships in
// every house package (Climate Home Inspection tools/package/block3d.html, PR 63,
// D60), cut down for a web page: the drapes are painted into one 1 m texture,
// the ground is meshed at 2 m, it renders only when something changes, and
// three.js loads only when the map scrolls near. Data: public/example/sample-a/,
// written by scripts/example/build-sample-a.py.
//
// Honesty rules carried over from the package viewer: heights at 1:1, water
// under 5 cm not drawn, wind shown as a pattern relative to the open wind, no
// house marked (a sample never marks one).

type Scene = {
  nx: number; ny: number; hx: number; hy: number; zbase: number;
  dem: { lo: number; hi: number };
  streets: { name: string; x: number; y: number; ang: number }[];
  buildings: { r: [number, number][]; h: [number, number][][]; z0: number; ht: number; est?: boolean }[];
  flood: { storm: string; max_cm: number; wet_share: number }[];
  heat: { hour: string; air: number }[];
  wind: { storm: string; date: string; dir: number; gust10: number; mean10: number; dx: number; colours: string[]; arrows: [number, number, number, number][] };
  ground: { value: number; range: [number, number] };
  legends: { flood: { colours: string[] }; heat: { colours: string[] } };
  sources: Record<string, string>;
};

const DATA = "/example/sample-a";
const STORM_NAMES = ["10-year, 1 hour", "100-year, 1 hour", "500-year, 1 hour", "10-year, 24 hours", "100-year, 24 hours", "500-year, 24 hours"];
const STORM_PHRASE = ["10-year, 1-hour", "100-year, 1-hour", "500-year, 1-hour", "10-year, 24-hour", "100-year, 24-hour", "500-year, 24-hour"];
const HOUR_NAMES: Record<string, string> = { "11:00": "11 am", "15:00": "3 pm", "19:00": "7 pm" };
const SUN: Record<string, [number, number]> = { "11:00": [118, 55], "15:00": [236, 58], "19:00": [287, 13] };

const TABS: { id: LayerId; n: string; name: string; hazard: string }[] = [
  { id: "air", n: "01", name: "The air", hazard: "Wind" },
  { id: "surface", n: "02", name: "The surface", hazard: "Heat" },
  { id: "street", n: "03", name: "The street", hazard: "Flood" },
  { id: "ground", n: "04", name: "The ground", hazard: "Settling" },
];

const inch = (cm: number) => Math.round(cm / 2.54);
const fahr = (c: number) => Math.round(c * 9 / 5 + 32);

interface Api {
  paint: (layer: LayerId, k: number) => void;
  zoom: (f: number) => void;
  fit: () => void;
}

interface Readout { head: string; value: string; note: string }

async function grey(url: string, n: number): Promise<Uint8Array> {
  const blob = await (await fetch(url)).blob();
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(blob, { colorSpaceConversion: "none", premultiplyAlpha: "none" });
  } catch {
    bmp = await createImageBitmap(blob);
  }
  const c = document.createElement("canvas");
  c.width = bmp.width;
  c.height = bmp.height;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(bmp, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data;
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) out[i] = d[i * 4];
  return out;
}

async function rgba(url: string): Promise<Uint8ClampedArray> {
  const blob = await (await fetch(url)).blob();
  const bmp = await createImageBitmap(blob);
  const c = document.createElement("canvas");
  c.width = bmp.width;
  c.height = bmp.height;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(bmp, 0, 0);
  return g.getImageData(0, 0, c.width, c.height).data;
}

const hexRGB = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

export function BlockViewer() {
  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);
  const api = useRef<Api | null>(null);
  const [layer, setLayer] = useState<LayerId>("street");
  const [k, setK] = useState(4);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [read, setRead] = useState<Readout | null>(null);
  const [scene, setScene] = useState<Scene | null>(null);
  const layerRef = useRef({ layer, k });

  // load when the map comes near the screen
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          io.disconnect();
          setState("loading");
        }
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(host);
    return () => io.disconnect();
  }, []);

  const go = state !== "idle";
  useEffect(() => {
    if (!go) return;
    let disposed = false;
    let cleanup: (() => void) | null = null;
    (async () => {
      const THREE: typeof THREEtypes = await import("three");
      const S: Scene = await (await fetch(`${DATA}/scene.json`)).json();
      const NX = S.nx, NY = S.ny, HX = S.hx, HY = S.hy, Z0 = S.zbase, NN = NX * NY;
      const [demG, base, wind, ...rest] = await Promise.all([
        grey(`${DATA}/dem.png`, NN),
        rgba(`${DATA}/base-light.png`),
        rgba(`${DATA}/wind.png`),
        ...S.flood.map((_, q) => grey(`${DATA}/flood-${q}.png`, NN)),
        ...S.heat.map((_, q) => grey(`${DATA}/pet-${q}.png`, NN)),
      ]);
      if (disposed) return;
      const flood = rest.slice(0, S.flood.length) as Uint8Array[];
      const pet = rest.slice(S.flood.length) as Uint8Array[];
      const dem = new Float32Array(NN);
      for (let q = 0; q < NN; q++) dem[q] = S.dem.lo + (demG[q] / 255) * (S.dem.hi - S.dem.lo);
      const H = (i: number, j: number) => dem[Math.min(Math.max(i, 0), NY - 1) * NX + Math.min(Math.max(j, 0), NX - 1)] - Z0;

      const stage = stageRef.current!;
      const W = () => stage.clientWidth, Hh = () => stage.clientHeight;
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(W(), Hh());
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.domElement.className = "bv-gl";
      stage.prepend(renderer.domElement);
      const scene3 = new THREE.Scene();
      scene3.background = new THREE.Color("#ebebea");
      const camera = new THREE.PerspectiveCamera(24, W() / Hh(), 1, 8000);
      camera.up.set(0, 0, -1); // north up
      scene3.add(new THREE.HemisphereLight(0xffffff, 0xa8a296, 1.45));
      const sun = new THREE.DirectionalLight(0xfff6e8, 2.4);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      Object.assign(sun.shadow.camera, { left: -HX * 1.2, right: HX * 1.2, top: HY * 1.2, bottom: -HY * 1.2, near: 10, far: 2400 });
      sun.shadow.bias = -0.0004;
      sun.shadow.normalBias = 0.4;
      scene3.add(sun, sun.target);
      const setSun = (az: number, el: number) => {
        const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180, r = 1000;
        sun.position.set(Math.sin(a) * Math.cos(e) * r, Math.sin(e) * r, -Math.cos(a) * Math.cos(e) * r);
      };

      // ground: 2 m mesh, 1 m texture
      const step = 2, gx = Math.floor((NX - 1) / step) + 1, gy = Math.floor((NY - 1) / step) + 1;
      const tg = new THREE.PlaneGeometry(2 * HX, 2 * HY, gx - 1, gy - 1);
      tg.rotateX(-Math.PI / 2);
      const tp = tg.attributes.position;
      for (let i = 0; i < gy; i++) for (let j = 0; j < gx; j++) tp.setY(i * gx + j, H(i * step, j * step));
      tg.computeVertexNormals();
      const cv = document.createElement("canvas");
      cv.width = NX;
      cv.height = NY;
      const cx = cv.getContext("2d")!;
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      const terrain = new THREE.Mesh(tg, new THREE.MeshLambertMaterial({ map: tex }));
      terrain.receiveShadow = true;
      scene3.add(terrain);

      // buildings at their recorded heights, one merged mesh
      const parts: Float32Array[] = [], tri: number[] = [];
      for (const b of S.buildings) {
        const sh = new THREE.Shape(b.r.map(([e, n]) => new THREE.Vector2(e, n)));
        for (const h of b.h) sh.holes.push(new THREE.Path(h.map(([e, n]) => new THREE.Vector2(e, n))));
        const g = new THREE.ExtrudeGeometry(sh, { depth: b.ht + 0.4, bevelEnabled: false }).toNonIndexed();
        g.rotateX(-Math.PI / 2);
        g.translate(0, b.z0 - Z0 - 0.4, 0);
        parts.push(g.attributes.position.array as Float32Array);
        tri.push(g.attributes.position.count / 3);
        g.dispose();
      }
      let total = 0;
      for (const p of parts) total += p.length;
      const pos = new Float32Array(total);
      let o = 0;
      for (const p of parts) {
        pos.set(p, o);
        o += p.length;
      }
      const bg = new THREE.BufferGeometry();
      bg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      bg.computeVertexNormals();
      const bmesh = new THREE.Mesh(bg, new THREE.MeshLambertMaterial({ color: 0xffffff }));
      bmesh.castShadow = true;
      bmesh.receiveShadow = true;
      scene3.add(bmesh);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(bg, 30), new THREE.LineBasicMaterial({ color: 0x8a8076, transparent: true, opacity: 0.45 }));
      scene3.add(edges);

      // wind arrows
      const ag = new THREE.ConeGeometry(0.9, 4.2, 3);
      ag.rotateX(Math.PI / 2);
      const arrows = new THREE.InstancedMesh(ag, new THREE.MeshBasicMaterial({ color: 0x1a1416 }), S.wind.arrows.length);
      {
        const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
        S.wind.arrows.forEach(([e, n, de, dn], i) => {
          q.setFromAxisAngle(up, Math.atan2(de, -dn));
          const s = 0.6 + 1.1 * Math.min(Math.hypot(de, dn), 1);
          m.compose(new THREE.Vector3(e, H(Math.round(HY - n), Math.round(e + HX)) + 2, -n), q, sc.set(s, s, s));
          arrows.setMatrixAt(i, m);
        });
      }
      arrows.visible = false;
      scene3.add(arrows);

      // the drapes, painted per pixel over the relief
      const img = cx.createImageData(NX, NY);
      const fc = S.legends.flood.colours.map(hexRGB), hc = S.legends.heat.colours.map(hexRGB);
      const floodCls = (d: number) => (d >= 50 ? 4 : d >= 30 ? 3 : d >= 15 ? 2 : d >= 10 ? 1 : 0);
      const petCls = (p: number) => (p >= 53 ? 4 : p >= 47 ? 3 : p >= 41 ? 2 : p >= 35 ? 1 : 0);
      const windCols = S.wind.colours.map(hexRGB);
      const windCls = (q: number) => {
        if (wind[q * 4 + 3] < 40) return -1;
        let best = 0, bd = 1e9;
        windCols.forEach(([r, g, b], c) => {
          const dd = (wind[q * 4] - r) ** 2 + (wind[q * 4 + 1] - g) ** 2 + (wind[q * 4 + 2] - b) ** 2;
          if (dd < bd) {
            bd = dd;
            best = c;
          }
        });
        return best;
      };
      const paintTex = (ly: LayerId, kk: number) => {
        const d = img.data;
        for (let q = 0; q < NN; q++) {
          let r = base[q * 4], g = base[q * 4 + 1], b = base[q * 4 + 2], a = 0;
          let c: number[] | null = null;
          if (ly === "street") {
            const dep = flood[kk][q];
            if (dep >= 5) {
              c = fc[floodCls(dep)];
              a = 0.92;
            }
          } else if (ly === "surface") {
            const p = pet[kk][q];
            if (p !== 255) {
              c = hc[petCls(p)];
              a = 0.85;
            }
          } else if (ly === "air") {
            const wa = wind[q * 4 + 3] / 255;
            if (wa > 0) {
              c = [wind[q * 4], wind[q * 4 + 1], wind[q * 4 + 2]];
              a = 0.85 * wa;
            }
          }
          if (c) {
            r = r * (1 - a) + c[0] * a;
            g = g * (1 - a) + c[1] * a;
            b = b * (1 - a) + c[2] * a;
          }
          d[q * 4] = r;
          d[q * 4 + 1] = g;
          d[q * 4 + 2] = b;
          d[q * 4 + 3] = 255;
        }
        cx.putImageData(img, 0, 0);
        tex.needsUpdate = true;
      };

      // camera: locked overhead, north up; soft zoom, drag to move once zoomed
      const fovT = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const fitDist = () => Math.max(HY / fovT, HX / (fovT * (W() / Hh()))) * 1.06;
      const view = { x: 0, z: 0, d: 0 }, goal = { x: 0, z: 0, d: 0 };
      const clampGoal = () => {
        const dmax = fitDist(), dmin = 70;
        goal.d = Math.min(dmax, Math.max(dmin, goal.d));
        const t = (dmax - goal.d) / (dmax - dmin);
        goal.x = Math.min(HX * t, Math.max(-HX * t, goal.x));
        goal.z = Math.min(HY * t, Math.max(-HY * t, goal.z));
      };
      const worldAt = (px: number, py: number, v: typeof view) => {
        const a = W() / Hh(), kk = v.d * fovT;
        return { x: v.x + ((px / W()) * 2 - 1) * kk * a, z: v.z + ((py / Hh()) * 2 - 1) * kk };
      };
      let needs = true;
      const kick = () => {
        needs = true;
      };
      const zoomAt = (px: number, py: number, f: number) => {
        const before = worldAt(px, py, goal);
        goal.d *= f;
        clampGoal();
        const after = worldAt(px, py, goal);
        goal.x += before.x - after.x;
        goal.z += before.z - after.z;
        clampGoal();
        kick();
      };
      const fit = () => {
        Object.assign(goal, { x: 0, z: 0, d: fitDist() });
        kick();
      };
      // settle in from a little higher, once
      Object.assign(view, { x: 0, z: 0, d: fitDist() * 1.25 });
      fit();

      const el = renderer.domElement;
      const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
      const readout = (px: number, py: number) => {
        mouse.set((px / W()) * 2 - 1, -(py / Hh()) * 2 + 1);
        ray.setFromCamera(mouse, camera);
        const hit = ray.intersectObjects([terrain, bmesh])[0];
        if (!hit) return;
        if (hit.object === bmesh) {
          let f = hit.faceIndex ?? 0, bi = 0;
          while (bi < tri.length - 1 && f >= tri[bi]) f -= tri[bi++];
          const b = S.buildings[bi];
          setRead({ head: "A building", value: `About ${Math.round(b.ht * 3.281)} ft tall`, note: b.est ? "No height on record; drawn at 6 m." : `${Math.round(b.ht)} m, from OpenStreetMap.` });
          return;
        }
        const j = Math.round(hit.point.x + HX), i = Math.round(hit.point.z + HY);
        if (i < 0 || j < 0 || i >= NY || j >= NX) return;
        const q = i * NX + j, { layer: ly, k: kk } = layerRef.current;
        if (ly === "street") {
          const dd = flood[kk][q];
          if (dd < 5) setRead({ head: `Peak water · ${STORM_NAMES[kk]}`, value: "Dry, or under 2 in", note: `Ground ${Math.round(dem[q] * 3.281)} ft above sea level.` });
          else {
            const y = FLOOD_YARDSTICKS[floodCls(dd)];
            setRead({ head: `Peak water · ${STORM_NAMES[kk]}`, value: `About ${inch(dd)} in (${dd} cm)`, note: y.what[0].toUpperCase() + y.what.slice(1) + "." });
          }
        } else if (ly === "surface") {
          const p = pet[kk][q];
          if (p === 255) setRead({ head: "Feels like", value: "Under a roof", note: "Feels-like is drawn for the ground outdoors." });
          else {
            const y = HEAT_YARDSTICKS[petCls(p)];
            setRead({ head: `Feels like · ${HOUR_NAMES[S.heat[kk].hour]}`, value: `${fahr(p)} °F (${p} °C)`, note: y.what[0].toUpperCase() + y.what.slice(1) + "." });
          }
        } else if (ly === "air") {
          const c = windCls(q);
          setRead(c < 0
            ? { head: "Wind at head height", value: "Outside the wind run", note: "" }
            : { head: "Wind at head height · Sandy", value: `${WIND_YARDSTICKS[c].cls} of the open wind`, note: WIND_YARDSTICKS[c].what[0].toUpperCase() + WIND_YARDSTICKS[c].what.slice(1) + "." });
        } else {
          setRead({ head: "Ground", value: `${Math.round(dem[q] * 3.281)} ft above sea level`, note: "From the USGS 1 m bare-earth map. The radar reading is one number for the whole block." });
        }
      };

      const pts = new Map<number, { x: number; y: number }>();
      let pinch: { dist: number; d: number } | null = null;
      const zoomed = () => goal.d < fitDist() * 0.97;
      const setTouch = () => {
        el.style.touchAction = zoomed() ? "none" : "pan-y";
      };
      setTouch();
      const local = (e: PointerEvent | WheelEvent | MouseEvent) => {
        const r = el.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
      };
      const onWheel = (e: WheelEvent) => {
        // the page scrolls as usual; zoom with Ctrl or Cmd held, or the buttons
        if (!(e.ctrlKey || e.metaKey)) return;
        e.preventDefault();
        const p = local(e);
        zoomAt(p.x, p.y, Math.exp(e.deltaY * 0.004));
        setTouch();
      };
      const onDown = (e: PointerEvent) => {
        const p = local(e);
        pts.set(e.pointerId, p);
        readout(p.x, p.y);
        if (e.pointerType === "mouse" || zoomed() || pts.size === 2) el.setPointerCapture(e.pointerId);
        if (pts.size === 2) {
          const [a, b] = [...pts.values()];
          pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y), d: goal.d };
        }
      };
      const onMove = (e: PointerEvent) => {
        const p = local(e);
        if (!pts.has(e.pointerId)) {
          if (e.pointerType === "mouse") readout(p.x, p.y);
          return;
        }
        const prev = pts.get(e.pointerId)!;
        pts.set(e.pointerId, p);
        if (pts.size === 2 && pinch) {
          const [a, b] = [...pts.values()];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, (pinch.d * pinch.dist) / dist / goal.d);
          setTouch();
          return;
        }
        if (!zoomed()) return;
        const kk = (goal.d * fovT * 2) / Hh();
        goal.x -= (p.x - prev.x) * kk;
        goal.z -= (p.y - prev.y) * kk;
        clampGoal();
        Object.assign(view, { x: goal.x, z: goal.z });
        kick();
      };
      const onUp = (e: PointerEvent) => {
        pts.delete(e.pointerId);
        if (pts.size < 2) pinch = null;
        setTouch();
      };
      const onDbl = (e: MouseEvent) => {
        const p = local(e);
        zoomAt(p.x, p.y, 0.5);
        setTouch();
      };
      el.addEventListener("wheel", onWheel, { passive: false });
      el.addEventListener("pointerdown", onDown);
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerup", onUp);
      el.addEventListener("pointercancel", onUp);
      el.addEventListener("dblclick", onDbl);

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const tags = tagsRef.current!;
      tags.innerHTML = "";
      const tagEls = S.streets.map((s) => {
        const d = document.createElement("div");
        d.className = "bv-tag";
        d.textContent = s.name;
        tags.appendChild(d);
        return { d, v: new THREE.Vector3(s.x, H(Math.round(HY - s.y), Math.round(s.x + HX)) + 2, -s.y), ang: s.ang };
      });
      let raf = 0;
      const frame = () => {
        const e = reduce ? 1 : 0.16;
        const dx = goal.x - view.x, dz = goal.z - view.z, dd = goal.d - view.d;
        if (needs || Math.abs(dx) + Math.abs(dz) + Math.abs(dd) > 0.05) {
          view.x += dx * e;
          view.z += dz * e;
          view.d += dd * e;
          camera.position.set(view.x, view.d, view.z);
          camera.lookAt(view.x, 0, view.z);
          renderer.render(scene3, camera);
          const show = Hh() / (2 * view.d * fovT) > 1.1;
          for (const t of tagEls) {
            const p = t.v.clone().project(camera);
            t.d.style.left = ((p.x + 1) / 2) * W() + "px";
            t.d.style.top = ((1 - p.y) / 2) * Hh() + "px";
            t.d.style.transform = `translate(-50%,-50%) rotate(${t.ang}deg)`;
            t.d.style.display = show && Math.abs(p.x) < 0.95 && Math.abs(p.y) < 0.95 ? "" : "none";
          }
          needs = false;
        }
        raf = requestAnimationFrame(frame);
      };
      const ro = new ResizeObserver(() => {
        camera.aspect = W() / Hh();
        camera.updateProjectionMatrix();
        renderer.setSize(W(), Hh());
        clampGoal();
        if (!zoomed()) fit();
        kick();
      });
      ro.observe(stage);

      api.current = {
        paint: (ly, kk) => {
          paintTex(ly, kk);
          arrows.visible = ly === "air";
          const [az, el2] = ly === "surface" ? SUN[S.heat[kk].hour] : [210, 48];
          setSun(az, el2);
          setRead(null);
          kick();
        },
        zoom: (f) => {
          zoomAt(W() / 2, Hh() / 2, f);
          setTouch();
        },
        fit: () => {
          fit();
          setTouch();
        },
      };
      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        el.removeEventListener("wheel", onWheel);
        renderer.dispose();
        tg.dispose();
        bg.dispose();
        tex.dispose();
        el.remove();
      };
      api.current.paint(layerRef.current.layer, layerRef.current.k);
      frame();
      setScene(S);
      setState("ready");
    })().catch(() => {
      if (!disposed) setState("error");
    });
    return () => {
      disposed = true;
      cleanup?.();
      api.current = null;
    };
  }, [go]);

  useEffect(() => {
    layerRef.current = { layer, k };
    api.current?.paint(layer, k);
  }, [layer, k]);

  const pick = (id: LayerId) => {
    setLayer(id);
    setK(id === "street" ? 4 : id === "surface" ? 1 : 0);
  };

  const legend =
    layer === "street" ? { title: "How deep, at human scale", rows: FLOOD_YARDSTICKS, colours: scene?.legends.flood.colours, note: "Under 2 in is not drawn. White: buildings, at their height." }
    : layer === "surface" ? { title: "How hot it feels outdoors (PET)", rows: HEAT_YARDSTICKS, colours: scene?.legends.heat.colours, note: "Not the air temperature. Shadows are drawn for that hour." }
    : layer === "air" ? { title: "Wind at head height, share of the open wind", rows: WIND_YARDSTICKS, colours: scene?.wind.colours, note: "Arrows show which way the air moves. Read the colours as a pattern." }
    : null;

  const what =
    layer === "street"
      ? `Where water collects in a ${STORM_PHRASE[k]} rainstorm, at its deepest moment.`
      : layer === "surface"
        ? `How hot it feels outdoors at ${HOUR_NAMES[scene?.heat[k]?.hour ?? "15:00"] ?? "3 pm"} on the hottest day of July 2025: sun, shade, wind and humidity together.`
        : layer === "air"
          ? "Wind at head height in the storm of 30 October 2012 (Sandy), blowing from the north-north-east. Open wind above the city: 36 mph average, gusts to 67 mph."
          : "The radar reads the whole block as one number: no movement beyond the ±0.3 mm a year it can detect. With no pattern to paint, the map shows the ground's shape: 1 m relief and the tree canopy.";

  return (
    <div className="bv" ref={hostRef}>
      <div className="bv-tabs" role="tablist" aria-label="Layer">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={layer === t.id} className="bv-tab" data-layer={t.id} onClick={() => pick(t.id)}>
            <span className="bv-n">{t.n}</span> {t.name} <span className="bv-h">· {t.hazard}</span>
          </button>
        ))}
      </div>
      <div className="bv-grid">
        <div className="bv-stage" ref={stageRef}>
          <div className="bv-tags" ref={tagsRef} aria-hidden="true" />
          {state !== "ready" && (
            <div className="bv-wait">{state === "error" ? "The 3D block could not load here. The report below has every finding." : "Loading the block…"}</div>
          )}
          <div className="bv-zoom">
            <button type="button" aria-label="Zoom in" onClick={() => api.current?.zoom(0.6)}>+</button>
            <button type="button" aria-label="Zoom out" onClick={() => api.current?.zoom(1 / 0.6)}>−</button>
            <button type="button" aria-label="Show the whole block" onClick={() => api.current?.fit()}>⤢</button>
          </div>
          <div className="bv-hint" aria-hidden="true">Tap or hover to read a spot · Ctrl + scroll or + to zoom</div>
        </div>
        <aside className="bv-side" aria-live="polite">
          {layer === "street" && (
            <div className="bv-chips" role="group" aria-label="Storm">
              {STORM_NAMES.map((s, i) => (
                <button key={s} type="button" aria-pressed={k === i} onClick={() => setK(i)}>{s}</button>
              ))}
            </div>
          )}
          {layer === "surface" && (
            <div className="bv-chips" role="group" aria-label="Hour">
              {["11:00", "15:00", "19:00"].map((h, i) => (
                <button key={h} type="button" aria-pressed={k === i} onClick={() => setK(i)}>{HOUR_NAMES[h]}</button>
              ))}
            </div>
          )}
          <p className="bv-what">{what}</p>
          {legend && (
            <div className="bv-legend">
              <div className="bv-lt">{legend.title}</div>
              {legend.rows.map((r, i) => (
                <div key={r.cls} className="bv-row">
                  <i style={{ background: legend.colours?.[i] ?? "transparent" }} />
                  <b>{r.cls}</b>
                  <span>{r.what}</span>
                </div>
              ))}
              <div className="bv-note">{legend.note}</div>
            </div>
          )}
          <div className="bv-read" data-empty={!read}>
            {read ? (
              <>
                <div className="bv-rh">{read.head}</div>
                <div className="bv-rv">{read.value}</div>
                {read.note && <div className="bv-rn">{read.note}</div>}
              </>
            ) : (
              <div className="bv-rn">Point at the map to read a spot.</div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
