"use client";

/**
 * Acorn, the home sensor, as an exploded 3D drawing (Kyle, 25 Nov 2026: "a
 * realistic 3D model of a sensor kit ... like an exploding diagram that
 * explodes to show the circuit board, the sensors and all that, and then the
 * module closes again").
 *
 * Built from simple solids in three.js (loaded only on this page). The parts
 * follow the rev A design in project files sensor-hardware/: one "SPARC Node"
 * board (ESP32-S3 module, LoRa radio, solar charger), a shielded temperature
 * and humidity probe, a barometer, a tilt sensor, a battery and a small solar
 * panel. It is a drawing of the planned product, not a photograph, and the
 * page says it is coming soon. Motion stops for prefers-reduced-motion: the
 * drawing then sits open.
 */
import * as React from "react";
import type * as THREEtypes from "three";

type Tag = { id: string; label: string; x: number; y: number; show: boolean };

const PARTS: { id: string; label: string }[] = [
  { id: "cap", label: "Solar cap" },
  { id: "shield", label: "Sun shield, air flows through" },
  { id: "probe", label: "Temperature and humidity probe" },
  { id: "board", label: "Main board: radio and brain" },
  { id: "sense", label: "Pressure and tilt sensors" },
  { id: "battery", label: "Battery, charged by the sun" },
  { id: "base", label: "Weatherproof shell and mount" },
];

export function AcornViewer() {
  const box = React.useRef<HTMLDivElement | null>(null);
  const [tags, setTags] = React.useState<Tag[]>([]);
  const [failed, setFailed] = React.useState(false);
  const [playing, setPlaying] = React.useState(true);
  const playRef = React.useRef(true);
  React.useEffect(() => {
    playRef.current = playing;
  }, [playing]);

  React.useEffect(() => {
    let stop = false;
    let cleanup = () => {};
    (async () => {
      const el = box.current;
      if (!el) return;
      let THREE: typeof THREEtypes;
      let RoomEnvironment: typeof import("three/examples/jsm/environments/RoomEnvironment.js").RoomEnvironment;
      try {
        THREE = await import("three");
        ({ RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js"));
      } catch {
        setFailed(true);
        return;
      }
      if (stop) return;
      let renderer: THREEtypes.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch {
        setFailed(true);
        return;
      }
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.shadowMap.enabled = true;
      el.prepend(renderer.domElement);

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
      camera.position.set(0, 2.0, 10.5);
      camera.lookAt(0, 0.1, 0);

      const key = new THREE.DirectionalLight(0xffffff, 1.6);
      key.position.set(4, 6, 5);
      key.castShadow = true;
      scene.add(key);
      scene.add(new THREE.HemisphereLight(0xdde6ff, 0x2a2420, 0.5));

      const M = {
        shell: new THREE.MeshPhysicalMaterial({ color: 0x8a5a2b, roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.3 }),
        shellDark: new THREE.MeshStandardMaterial({ color: 0x5e3b1c, roughness: 0.7 }),
        white: new THREE.MeshPhysicalMaterial({ color: 0xf2f0ea, roughness: 0.35, clearcoat: 0.4 }),
        pcb: new THREE.MeshStandardMaterial({ color: 0x1f6b3a, roughness: 0.55 }),
        pcbBlue: new THREE.MeshStandardMaterial({ color: 0x1d3f7a, roughness: 0.5 }),
        metal: new THREE.MeshStandardMaterial({ color: 0xc9ccd1, metalness: 1, roughness: 0.25 }),
        chip: new THREE.MeshStandardMaterial({ color: 0x18191b, roughness: 0.4 }),
        gold: new THREE.MeshStandardMaterial({ color: 0xd4a937, metalness: 1, roughness: 0.3 }),
        solar: new THREE.MeshPhysicalMaterial({ color: 0x14244a, metalness: 0.3, roughness: 0.15, clearcoat: 1 }),
        cell: new THREE.MeshStandardMaterial({ color: 0x3a4f86, metalness: 0.5, roughness: 0.3 }),
        battery: new THREE.MeshStandardMaterial({ color: 0x2f7fd0, roughness: 0.35, metalness: 0.2 }),
        rubber: new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 }),
      };

      const root = new THREE.Group();
      scene.add(root);
      const parts: Record<string, { g: THREEtypes.Group; closed: number; open: number; anchor: THREEtypes.Vector3 }> = {};
      const add = (id: string, closed: number, open: number, anchor: [number, number, number]) => {
        const g = new THREE.Group();
        g.position.y = closed;
        root.add(g);
        parts[id] = { g, closed, open, anchor: new THREE.Vector3(...anchor) };
        return g;
      };
      const mesh = (geo: THREEtypes.BufferGeometry, mat: THREEtypes.Material, parent: THREEtypes.Object3D, pos: [number, number, number] = [0, 0, 0]) => {
        const m = new THREE.Mesh(geo, mat);
        m.position.set(...pos);
        m.castShadow = true;
        m.receiveShadow = true;
        parent.add(m);
        return m;
      };

      // cap: a domed acorn cap with a solar panel on top
      const cap = add("cap", 1.15, 2.45, [1.9, 0.1, 0]);
      const capProfile = [];
      for (let i = 0; i <= 16; i++) {
        const t = i / 16;
        capProfile.push(new THREE.Vector2(1.12 * Math.cos((t * Math.PI) / 2.2) + 0.02, 0.5 * Math.sin((t * Math.PI) / 2.2)));
      }
      mesh(new THREE.LatheGeometry(capProfile, 64), M.shellDark, cap);
      mesh(new THREE.CylinderGeometry(1.16, 1.16, 0.08, 64), M.shellDark, cap, [0, 0, 0]);
      const panel = mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.04, 6), M.solar, cap, [0, 0.47, 0]);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        const c = mesh(new THREE.BoxGeometry(0.34, 0.012, 0.22), M.cell, panel, [Math.cos(a) * 0.4, 0.03, Math.sin(a) * 0.4]);
        c.rotation.y = -a;
      }
      mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 16), M.shellDark, cap, [0, 0.6, 0]);

      // radiation shield: stacked white louvres
      const shield = add("shield", 0.75, 1.7, [-1.9, 0.0, 0]);
      for (let i = 0; i < 5; i++) {
        mesh(new THREE.CylinderGeometry(0.95 - i * 0.015, 1.05 - i * 0.015, 0.09, 64, 1, true), M.white, shield, [0, 0.3 - i * 0.16, 0]);
        mesh(new THREE.TorusGeometry(0.98, 0.02, 8, 64), M.white, shield, [0, 0.35 - i * 0.16, 0]).rotation.x = Math.PI / 2;
      }
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8), M.white, shield, [Math.cos(a) * 0.86, 0, Math.sin(a) * 0.86]);
      }

      // probe inside the shield
      const probe = add("probe", 0.75, 1.12, [1.9, 0, 0]);
      mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.42, 24), M.metal, probe);
      mesh(new THREE.BoxGeometry(0.3, 0.04, 0.2), M.pcbBlue, probe, [0, -0.25, 0]);
      mesh(new THREE.BoxGeometry(0.07, 0.03, 0.07), M.chip, probe, [0, -0.22, 0]);

      // main board
      const board = add("board", 0.25, 0.45, [-1.9, 0, 0]);
      mesh(new THREE.BoxGeometry(1.5, 0.05, 1.2), M.pcb, board);
      mesh(new THREE.BoxGeometry(0.5, 0.06, 0.62), M.metal, board, [-0.35, 0.06, -0.12]); // ESP32 module can
      mesh(new THREE.BoxGeometry(0.5, 0.012, 0.16), M.chip, board, [-0.35, 0.035, 0.3]); // its antenna strip
      mesh(new THREE.BoxGeometry(0.4, 0.07, 0.4), M.metal, board, [0.42, 0.06, -0.25]); // LoRa radio can
      mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.9, 8), M.gold, board, [0.62, 0.48, -0.25]); // antenna
      mesh(new THREE.BoxGeometry(0.22, 0.04, 0.22), M.chip, board, [0.35, 0.045, 0.28]); // charger
      mesh(new THREE.BoxGeometry(0.16, 0.04, 0.16), M.chip, board, [0.05, 0.045, 0.32]);
      for (let i = 0; i < 10; i++) mesh(new THREE.BoxGeometry(0.05, 0.03, 0.025), M.chip, board, [-0.65 + i * 0.07, 0.04, 0.5]);
      for (let i = 0; i < 4; i++) mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.07, 12), M.gold, board, [i < 2 ? -0.7 : 0.7, 0.03, i % 2 ? -0.55 : 0.55]);

      // sensor board: barometer and tilt sensor
      const sense = add("sense", -0.1, -0.18, [1.9, 0, 0]);
      mesh(new THREE.BoxGeometry(1.1, 0.04, 0.8), M.pcbBlue, sense);
      mesh(new THREE.BoxGeometry(0.16, 0.06, 0.16), M.metal, sense, [-0.25, 0.05, 0]);
      mesh(new THREE.BoxGeometry(0.2, 0.05, 0.2), M.chip, sense, [0.22, 0.045, 0.05]);
      mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 16), M.gold, sense, [0.22, 0.085, 0.05]);

      // battery: two cells in a holder
      const battery = add("battery", -0.45, -0.75, [-1.9, 0, 0]);
      mesh(new THREE.BoxGeometry(1.0, 0.08, 0.58), M.rubber, battery, [0, -0.17, 0]);
      for (const z of [-0.14, 0.14]) {
        const c = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.86, 32), M.battery, battery, [0, 0, z]);
        c.rotation.z = Math.PI / 2;
        const t = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 16), M.metal, battery, [0.45, 0, z]);
        t.rotation.z = Math.PI / 2;
      }

      // base shell: the acorn's body, with a mounting stem
      const base = add("base", -0.1, -1.45, [1.9, -0.2, 0]);
      const body = [];
      for (let i = 0; i <= 24; i++) {
        const t = i / 24;
        const y = -1.3 * t;
        const r = 1.08 * Math.sqrt(Math.max(0, 1 - Math.pow(t, 2.2))) * (1 - 0.15 * t) + 0.02;
        body.push(new THREE.Vector2(r, y));
      }
      body.reverse();
      mesh(new THREE.LatheGeometry(body, 64, 0, Math.PI * 1.5), M.shell, base, [0, 0.5, 0]).rotation.y = Math.PI * 0.25;
      mesh(new THREE.LatheGeometry(body.map((v) => new THREE.Vector2(v.x * 0.96, v.y)), 64, 0, Math.PI * 1.5), M.shellDark, base, [0, 0.5, 0]).rotation.y = Math.PI * 0.25;
      mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.6, 16), M.metal, base, [0, -1.05, 0]);

      let w = 0;
      let h = 0;
      const resize = () => {
        w = el.clientWidth;
        h = el.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.fov = w / h < 1.2 ? 46 : 33;
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(el);

      // explode: closed 2 s, opening 2.5 s, open 4 s, closing 2.5 s
      const CYCLE = 11;
      const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
      const explodeAt = (t: number) => {
        if (reduced) return 1;
        const p = t % CYCLE;
        if (p < 2) return 0;
        if (p < 4.5) return ease((p - 2) / 2.5);
        if (p < 8.5) return 1;
        return 1 - ease((p - 8.5) / 2.5);
      };

      let t = 0;
      let last = performance.now();
      let raf = 0;
      const v = new THREE.Vector3();
      let lastTags = 0;
      const frame = (now: number) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (playRef.current) t += dt;
        const e = explodeAt(t);
        for (const p of Object.values(parts)) p.g.position.y = p.closed + (p.open - p.closed) * e;
        root.rotation.y = reduced ? -0.5 : -0.5 + Math.sin(t * 0.25) * 0.6;
        camera.position.set(0, 1.6 + 0.4 * e, 6.6 + 3.0 * e);
        camera.lookAt(0, 0.15, 0);
        renderer.render(scene, camera);
        if (now - lastTags > 60) {
          lastTags = now;
          const next: Tag[] = PARTS.map((pt) => {
            const p = parts[pt.id];
            v.copy(p.anchor);
            p.g.localToWorld(v);
            v.project(camera);
            return { id: pt.id, label: pt.label, x: ((v.x + 1) / 2) * 100, y: ((1 - v.y) / 2) * 100, show: e > 0.85 };
          });
          setTags(next);
        }
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        renderer.dispose();
        pmrem.dispose();
        renderer.domElement.remove();
      };
    })();
    return () => {
      stop = true;
      cleanup();
    };
  }, []);

  return (
    <div className="acorn-stage" ref={box} role="img" aria-label="A 3D drawing of the Acorn sensor that opens up to show its solar cap, sun shield, temperature probe, main board, sensors, battery and shell, then closes again.">
      {failed && <div className="acorn-fallback">The 3D drawing needs a browser with WebGL.</div>}
      <div className="acorn-tags" aria-hidden>
        {tags.map((t) => (
          <span key={t.id} className="acorn-tag" style={{ left: `${t.x}%`, top: `${t.y}%`, opacity: t.show ? 1 : 0 }}>
            {t.label}
          </span>
        ))}
      </div>
      <div className="acorn-ctl">
        <button type="button" onClick={() => setPlaying(!playing)}>
          {playing ? "Pause" : "Play"}
        </button>
      </div>
    </div>
  );
}
