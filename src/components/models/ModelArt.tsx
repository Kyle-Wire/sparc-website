/**
 * The overview graphic on each model page (Kyle, 25 Nov 2026: "some cool
 * graphics for each model that are kind of just like an overview of each
 * model, but in a fun way").
 *
 * Each one is an illustration, not a result: no numbers, no map of a real
 * place, and a caption under it says so. Every label is in words, so the
 * picture reads with no background (Kyle, 23 Nov 2026: charts readable by
 * anyone). Motion is CSS only and stops for prefers-reduced-motion
 * (src/styles/models.css). No circular map crops anywhere (Kyle, 23 Nov 2026).
 */
import * as React from "react";
import type { ModelSlug } from "@/lib/model-pages";

const W = 640;
const H = 360;

function Label({ x, y, children, anchor = "start", tone = "ink" }: { x: number; y: number; children: React.ReactNode; anchor?: "start" | "middle" | "end"; tone?: "ink" | "paper" }) {
  return (
    <text x={x} y={y} textAnchor={anchor} className={`ma-label ma-label-${tone}`}>
      {children}
    </text>
  );
}

function Leader({ d }: { d: string }) {
  return <path d={d} className="ma-leader" />;
}

function Frame({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} className={`model-art ${className ?? ""}`}>
      <title>{title}</title>
      {children}
    </svg>
  );
}

function House({ x, y, s = 1, fill = "#f3efe6", roof = "#3b3b3a" }: { x: number; y: number; s?: number; fill?: string; roof?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-18} y={-26} width={36} height={26} fill={fill} stroke="#2a2a2a" strokeWidth={1.5} />
      <path d="M-22 -26 L0 -44 L22 -26 Z" fill={roof} />
      <rect x={-5} y={-14} width={10} height={14} fill="#6b5a44" />
      <rect x={8} y={-21} width={7} height={7} fill="#cfe3ea" stroke="#2a2a2a" strokeWidth={1} />
    </g>
  );
}

function Tree({ x, y, s = 1, color = "#3f6b4e" }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-2.5} y={-14} width={5} height={14} fill="#6b4a2a" />
      <path d="M0 -50 L16 -14 L-16 -14 Z" fill={color} />
      <path d="M0 -62 L12 -32 L-12 -32 Z" fill={color} opacity={0.9} />
    </g>
  );
}

/* ---------------- flood: a cross-section of a street in a storm ---------------- */
function FloodArt() {
  const ground = "M0 150 C 120 160 200 210 300 250 L 420 262 L 470 262 C 520 258 580 240 640 236 L640 360 L0 360 Z";
  return (
    <Frame title="Illustration: rain falls on a sloping block, runs down the street and pools in the low spot beside a house, while some drains away in a pipe." className="ma-flood">
      <rect width={W} height={H} fill="#e8f1f4" />
      <g className="ma-cloud">
        <ellipse cx={150} cy={40} rx={70} ry={22} fill="#9fb3bb" />
        <ellipse cx={210} cy={34} rx={56} ry={20} fill="#8ea4ad" />
        <ellipse cx={420} cy={44} rx={80} ry={22} fill="#9fb3bb" />
      </g>
      <g className="ma-rain">
        {Array.from({ length: 26 }, (_, i) => (
          <line key={i} x1={70 + i * 20} y1={70 + (i % 3) * 10} x2={64 + i * 20} y2={88 + (i % 3) * 10} stroke="#0b6a88" strokeWidth={2} strokeLinecap="round" />
        ))}
      </g>
      <path d={ground} fill="#b9a98a" />
      <path d="M0 150 C 120 160 200 210 300 250 L 420 262 L 470 262 C 520 258 580 240 640 236" fill="none" stroke="#6f6248" strokeWidth={3} />
      {/* houses on the slope and one in the low spot */}
      <House x={90} y={156} />
      <House x={200} y={196} />
      <House x={540} y={250} />
      {/* water pooled in the low spot */}
      <path className="ma-pool" d="M330 254 L 420 262 L 470 262 C 500 260 520 257 560 252 L 560 252 C 500 240 400 238 330 254 Z" fill="#0b6a88" opacity={0.75} />
      {/* flow arrows down the slope */}
      <g className="ma-flow" stroke="#0b6a88" strokeWidth={3} fill="none" strokeLinecap="round">
        <path d="M40 150 C 100 156 150 172 190 190" />
        <path d="M220 210 C 250 225 280 238 320 250" />
      </g>
      {/* the pipe under the street */}
      <rect x={300} y={300} width={300} height={16} rx={8} fill="#d7dfe2" stroke="#3b3b3a" strokeWidth={1.5} />
      <line className="ma-pipe" x1={308} y1={308} x2={592} y2={308} stroke="#0b6a88" strokeWidth={4} strokeDasharray="10 12" />
      <line x1={440} y1={262} x2={440} y2={300} stroke="#3b3b3a" strokeWidth={2} />
      <Label x={300} y={128}>Storm rain, hour by hour</Label>
      <Leader d="M130 168 L110 210" />
      <Label x={20} y={228}>Ground height, every metre</Label>
      <Leader d="M262 230 L240 280" />
      <Label x={150} y={298}>Water runs downhill</Label>
      <Leader d="M500 252 L520 200" />
      <Label x={470} y={190}>Depth at the wall</Label>
      <Label x={452} y={340} anchor="middle">Drains and pipes carry some away</Label>
    </Frame>
  );
}

/* ---------------- heat: a street through a hot day ---------------- */
function HeatArt() {
  return (
    <Frame title="Illustration: the sun crosses a street lined with buildings and a tree; the paved street glows hot, the shade under the tree stays cooler." className="ma-heat">
      <rect width={W} height={H} fill="#fbefe6" />
      <path d="M60 230 A 260 200 0 0 1 580 230" fill="none" stroke="#e0b08a" strokeWidth={2} strokeDasharray="4 8" />
      <g className="ma-sun-orbit">
        <circle cx={320} cy={50} r={26} fill="#f2a516" />
        <g stroke="#f2a516" strokeWidth={3} strokeLinecap="round">
          <line x1={320} y1={12} x2={320} y2={2} />
          <line x1={358} y1={50} x2={368} y2={50} />
          <line x1={282} y1={50} x2={272} y2={50} />
          <line x1={347} y1={23} x2={354} y2={16} />
          <line x1={293} y1={23} x2={286} y2={16} />
        </g>
      </g>
      {/* buildings */}
      <rect x={40} y={120} width={110} height={170} fill="#cfc6bb" stroke="#2a2a2a" strokeWidth={1.5} />
      <rect x={470} y={90} width={130} height={200} fill="#d9d0c4" stroke="#2a2a2a" strokeWidth={1.5} />
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x={58 + (i % 3) * 30} y={140 + Math.floor(i / 3) * 40} width={16} height={22} fill="#a9c0c8" />
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={`b${i}`} x={490 + (i % 3) * 36} y={110 + Math.floor(i / 3) * 44} width={18} height={24} fill="#a9c0c8" />
      ))}
      {/* the street glowing */}
      <rect x={150} y={270} width={320} height={20} className="ma-glow" fill="#b3122e" opacity={0.55} />
      <rect x={0} y={290} width={W} height={70} fill="#4a4a48" />
      {/* building shadow */}
      <path className="ma-shadow" d="M470 290 L 400 290 L 400 270 L 470 270 Z" fill="#2a2a2a" opacity={0.25} />
      <Tree x={250} y={290} s={1.5} />
      <ellipse cx={250} cy={286} rx={42} ry={6} fill="#2a2a2a" opacity={0.25} />
      <Leader d="M320 86 L320 110" />
      <Label x={320} y={128} anchor="middle">The sun&apos;s path, hour by hour</Label>
      <Leader d="M360 266 L380 220" />
      <Label x={330} y={212}>Paving soaks up heat</Label>
      <Leader d="M250 216 L 210 180" />
      <Label x={120} y={172}>Tree shade</Label>
      <Leader d="M535 90 L 560 64" />
      <Label x={630} y={56} anchor="end">Walls store heat for the night</Label>
      <Label x={320} y={334} anchor="middle" tone="paper">Air temperature, and how hot it feels in sun and shade</Label>
    </Frame>
  );
}

/* ---------------- ground: radar from orbit ---------------- */
function GroundArt() {
  return (
    <Frame title="Illustration: a radar satellite passes overhead and measures the distance to the ground under a house again and again, comparing it with the ground around it." className="ma-ground">
      <rect width={W} height={H} fill="#eef0f5" />
      {/* satellite */}
      <g className="ma-sat">
        <rect x={-22} y={-10} width={44} height={20} rx={3} fill="#5c5c5b" />
        <rect x={-78} y={-6} width={50} height={12} fill="#3b5a8c" />
        <rect x={28} y={-6} width={50} height={12} fill="#3b5a8c" />
        <path d="M0 10 L0 22" stroke="#5c5c5b" strokeWidth={3} />
      </g>
      {/* radar beams */}
      <g className="ma-beam" stroke="#7a4f12" strokeWidth={2} strokeDasharray="6 8" fill="none">
        <path d="M300 70 L 330 210" />
        <path d="M300 70 L 210 214" />
        <path d="M300 70 L 450 214" />
      </g>
      {/* ground layers */}
      <path d="M0 220 L640 220 L640 360 L0 360 Z" fill="#c9b48e" />
      <path d="M0 262 C 160 252 320 272 640 258 L640 360 L0 360 Z" fill="#b39a6c" />
      <path d="M0 308 C 200 300 420 318 640 304 L640 360 L0 360 Z" fill="#8f7a52" />
      {/* the patch under the house sinks a little */}
      <g className="ma-sink">
        <rect x={290} y={220} width={80} height={8} fill="#a8875a" />
        <House x={330} y={222} s={1.1} />
      </g>
      <ellipse cx={330} cy={222} rx={90} ry={16} fill="none" stroke="#7a4f12" strokeWidth={2} strokeDasharray="4 5" />
      <ellipse cx={330} cy={222} rx={250} ry={30} fill="none" stroke="#7a4f12" strokeWidth={1.5} strokeDasharray="2 6" />
      <House x={120} y={220} s={0.8} />
      <House x={540} y={220} s={0.8} />
      {/* GPS station */}
      <g transform="translate(590 220)">
        <path d="M0 0 L0 -40" stroke="#2a2a2a" strokeWidth={3} />
        <path d="M-12 -40 L12 -40 L0 -54 Z" fill="#2a2a2a" />
      </g>
      <Label x={360} y={40}>Radar satellite, every few days</Label>
      <Leader d="M420 238 L 470 290" />
      <Label x={430} y={306}>Near ring and wide ring</Label>
      <Leader d="M330 236 L 300 280" />
      <Label x={170} y={296}>Millimetres up or down</Label>
      <Leader d="M590 166 L 590 140" />
      <Label x={630} y={132} anchor="end">GPS station ties it down</Label>
    </Frame>
  );
}

/* ---------------- wind: streamlines between buildings, seen from above ---------------- */
function WindArt() {
  const lines = [60, 92, 124, 156, 188, 220, 252, 284, 316];
  return (
    <Frame title="Illustration seen from above: wind lines flow between building blocks, crowding together and speeding up in the gaps and spreading out in a sheltered yard." className="ma-wind">
      <rect width={W} height={H} fill="#eef3ef" />
      <g className="ma-stream" fill="none" stroke="#3f6b4e" strokeWidth={2.5} strokeLinecap="round">
        {lines.map((y, i) => {
          const squeeze = y < 180 ? 18 : -18;
          return <path key={y} d={`M-10 ${y} C 160 ${y} 230 ${180 + (y - 180) * 0.45 + squeeze * 0.2} 320 ${180 + (y - 180) * 0.45} S 470 ${y} 650 ${y}`} style={{ animationDelay: `${-i * 0.3}s` }} />;
        })}
      </g>
      <rect x={240} y={40} width={150} height={100} fill="#d9d0c4" stroke="#2a2a2a" strokeWidth={1.5} />
      <rect x={240} y={220} width={150} height={100} fill="#d9d0c4" stroke="#2a2a2a" strokeWidth={1.5} />
      <rect x={470} y={150} width={60} height={60} fill="#e6dfd5" stroke="#2a2a2a" strokeWidth={1.5} />
      <g fill="#f3efe6" stroke="#2a2a2a" strokeWidth={1.5}>
        <rect x={430} y={250} width={34} height={34} />
      </g>
      {/* compass of sixteen directions */}
      <g transform="translate(70 290)">
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i * Math.PI) / 8;
          const r = i % 4 === 0 ? 34 : i % 2 === 0 ? 26 : 20;
          return <line key={i} x1={0} y1={0} x2={Math.sin(a) * r} y2={-Math.cos(a) * r} stroke="#3f6b4e" strokeWidth={i % 4 === 0 ? 3 : 1.5} />;
        })}
        <circle r={4} fill="#3f6b4e" />
      </g>
      <Leader d="M330 180 L 330 200" />
      <Label x={330} y={214} anchor="middle">Squeezed into the gap: faster</Label>
      <Leader d="M500 150 L 540 110" />
      <Label x={630} y={100} anchor="end">Corners speed it up</Label>
      <Leader d="M447 284 L 470 320" />
      <Label x={430} y={340}>A sheltered yard</Label>
      <Label x={120} y={344}>Every direction, run on its own</Label>
      <Label x={20} y={30}>Gusts from airport records</Label>
    </Frame>
  );
}

/* ---------------- wildfire: front, embers, house ---------------- */
function FireArt() {
  return (
    <Frame title="Illustration: a fire front climbs a wooded hill toward a house, pushed by the wind, while embers fly ahead of it and land near the house." className="ma-fire">
      <rect width={W} height={H} fill="#f6ece3" />
      <path d="M0 300 C 160 290 260 220 380 200 C 460 188 540 196 640 200 L640 360 L0 360 Z" fill="#c8b48a" />
      {Array.from({ length: 12 }, (_, i) => {
        const x = 30 + i * 30;
        const y = 300 - (i > 4 ? (i - 4) * 12 : 0) - 6;
        return <Tree key={i} x={x} y={y} s={0.9} color={i < 5 ? "#5c4a3a" : "#4f7a4e"} />;
      })}
      <g className="ma-front">
        {Array.from({ length: 5 }, (_, i) => (
          <path key={i} className="ma-flame" style={{ animationDelay: `${i * 0.15}s` }} d={`M${150 + i * 14} ${292 - i * 5} q 8 -30 0 -46 q 18 22 10 46 Z`} fill={i % 2 ? "#f2a516" : "#d2501c"} />
        ))}
      </g>
      <path d="M0 300 C 80 296 120 290 160 286" stroke="#2a2a2a" strokeWidth={6} opacity={0.35} fill="none" />
      <House x={520} y={198} s={1.2} />
      <g className="ma-embers">
        {Array.from({ length: 6 }, (_, i) => (
          <circle key={i} className="ma-ember" style={{ animationDelay: `${i * 0.6}s` }} cx={180} cy={240} r={3.5} fill="#d2501c" />
        ))}
      </g>
      <g stroke="#2a2a2a" strokeWidth={3} fill="none" strokeLinecap="round">
        <path d="M40 60 L 140 60 M120 48 L140 60 L120 72" />
        <path d="M60 90 L 160 90 M140 78 L160 90 L140 102" />
      </g>
      <Label x={40} y={36}>Wind pushes it</Label>
      <Leader d="M175 238 L 200 330" />
      <Label x={130} y={346}>The fire front: faster uphill</Label>
      <Label x={330} y={110}>Embers fly ahead</Label>
      <Leader d="M520 150 L 540 110" />
      <Label x={630} y={100} anchor="end">Does anything reach the house?</Label>
      <Label x={20} y={262}>What burns</Label>
    </Frame>
  );
}

/* ---------------- hurricane: storm over ocean, toward the coast ---------------- */
function HurricaneArt() {
  return (
    <Frame title="Illustration seen from above: a spiral storm crosses the ocean along a dotted track toward the coastline and a small town." className="ma-hurricane">
      <rect width={W} height={H} fill="#dfe6f2" />
      <path d="M0 0 L 250 0 C 230 80 270 140 240 220 C 220 280 250 330 230 360 L0 360 Z" fill="#cbbf9c" />
      <path d="M250 0 C 230 80 270 140 240 220 C 220 280 250 330 230 360" fill="none" stroke="#8f7a52" strokeWidth={3} />
      {/* track */}
      <path d="M600 330 C 520 280 420 230 250 160" fill="none" stroke="#44408f" strokeWidth={2.5} strokeDasharray="2 10" strokeLinecap="round" />
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={600 - i * 80} cy={330 - i * 38 - (i > 2 ? (i - 2) * 6 : 0)} r={4} fill="#44408f" />
      ))}
      <g className="ma-storm-move">
        <g className="ma-storm-spin">
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d="M0 0 C 20 -10 46 -6 58 18" transform={`rotate(${i * 90})`} fill="none" stroke="#44408f" strokeWidth={9} strokeLinecap="round" opacity={0.85} />
          ))}
          <circle r={9} fill="#dfe6f2" stroke="#44408f" strokeWidth={3} />
        </g>
      </g>
      {/* town */}
      <g fill="#f3efe6" stroke="#2a2a2a" strokeWidth={1.2}>
        <rect x={150} y={140} width={16} height={12} />
        <rect x={172} y={150} width={16} height={12} />
        <rect x={150} y={164} width={16} height={12} />
        <rect x={190} y={168} width={16} height={12} />
      </g>
      <Label x={630} y={40} anchor="end">Storms learned from decades of weather</Label>
      <Label x={470} y={300} anchor="end">Its own track</Label>
      <Leader d="M180 182 L 150 236" />
      <Label x={40} y={252}>Winds over land</Label>
      <Label x={30} y={40}>The coast</Label>
    </Frame>
  );
}

/* ---------------- bristlecone: rings that hold every test ---------------- */
const RING_COLORS = ["#0b6a88", "#c8314b", "#a5742c", "#5d9472", "#d0682a", "#7d78d0"];
function BristleconeArt() {
  const rings = Array.from({ length: 14 }, (_, i) => 18 + i * 10);
  return (
    <Frame title="Illustration: the cross-section of an old tree trunk, its rings coloured for the models it checks, beside a cloud of scattered misses being packed into a short code." className="ma-bristle">
      <rect width={W} height={H} fill="#17150f" />
      <g transform="translate(200 180)">
        <path d="M0 -170 C 120 -170 175 -90 172 0 C 168 100 100 170 -10 168 C -120 166 -172 90 -170 0 C -168 -100 -110 -170 0 -170 Z" fill="#3a2f1d" />
        {rings.map((r, i) => {
          const wob = (i % 3) * 2;
          const d = `M0 ${-r} C ${r * 0.7 + wob} ${-r} ${r + wob} ${-r * 0.55} ${r} 0 C ${r - wob} ${r * 0.6} ${r * 0.6} ${r + wob} 0 ${r} C ${-r * 0.65} ${r} ${-r - wob} ${r * 0.55} ${-r} 0 C ${-r} ${-r * 0.6} ${-r * 0.6 - wob} ${-r} 0 ${-r} Z`;
          return <path key={r} className="ma-ring" style={{ animationDelay: `${i * 0.12}s` }} d={d} fill="none" stroke={i % 3 === 2 ? RING_COLORS[Math.floor(i / 3) % 6] : "#e2c68a"} strokeOpacity={i % 3 === 2 ? 0.95 : 0.45} strokeWidth={i % 3 === 2 ? 3 : 1.5} />;
        })}
        <circle r={6} fill="#e2c68a" />
      </g>
      {/* misses being packed */}
      <g className="ma-misses">
        {Array.from({ length: 22 }, (_, i) => (
          <circle key={i} cx={420 + ((i * 37) % 120)} cy={60 + ((i * 53) % 110)} r={3.5} fill="#e2c68a" opacity={0.85} />
        ))}
      </g>
      <path d="M470 190 L 470 214 M462 206 L470 214 L478 206" stroke="#e2c68a" strokeWidth={2.5} fill="none" />
      <g className="ma-bits">
        {Array.from({ length: 10 }, (_, i) => (
          <rect key={i} x={410 + i * 12} y={226} width={9} height={14} fill={i < 7 ? "#e2c68a" : "#7a6a48"} />
        ))}
      </g>
      <Label x={620} y={52} anchor="end" tone="paper">A model&apos;s misses</Label>
      <Label x={620} y={238} anchor="end" tone="paper">Packed tight</Label>
      <Label x={620} y={290} anchor="end" tone="paper">A physics term that packs them</Label>
      <Label x={620} y={310} anchor="end" tone="paper">tighter names what is missing</Label>
      <Label x={30} y={350} tone="paper">Every ring, a test</Label>
    </Frame>
  );
}

export function ModelArt({ slug }: { slug: ModelSlug }) {
  switch (slug) {
    case "flood":
      return <FloodArt />;
    case "heat":
      return <HeatArt />;
    case "ground":
      return <GroundArt />;
    case "wind":
      return <WindArt />;
    case "wildfire":
      return <FireArt />;
    case "hurricane":
      return <HurricaneArt />;
    case "bristlecone":
      return <BristleconeArt />;
  }
}

/* ---------------- Storm Ahead: the five stages ---------------- */
export const STORM_STAGES = [
  { t: "Quiet", b: "Nothing threatening. We keep watching the official forecasts." },
  { t: "Watching", b: "A forecast puts your area in a storm's possible path. Your house's pre-run storms are ready." },
  { t: "Preparing", b: "The odds climb. We run the models for your block on the storm as forecast: lighter, middle and heavier." },
  { t: "Storm here", b: "What the models showed, beside the official word. Follow your local officials." },
  { t: "After", b: "We run the rain that actually fell and compare. Your photos make the models better." },
];

export function StormAheadArt() {
  return (
    <svg viewBox="0 0 960 300" role="img" aria-label="Illustration: a storm moves from the left toward a house on the right, passing five stages: quiet, watching, preparing, storm here, and after." className="model-art ma-storm">
      <title>Storm Ahead: a storm approaches a house through five stages</title>
      <rect width={960} height={300} fill="#e9edf3" />
      <path d="M0 230 L960 230 L960 300 L0 300 Z" fill="#c9bfa6" />
      <g className="ma-sa-storm">
        <ellipse cx={0} cy={0} rx={60} ry={24} fill="#5c6670" />
        <ellipse cx={40} cy={-10} rx={46} ry={20} fill="#4a535c" />
        {Array.from({ length: 7 }, (_, i) => (
          <line key={i} className="ma-sa-rain" x1={-40 + i * 14} y1={22} x2={-46 + i * 14} y2={44} stroke="#0b6a88" strokeWidth={2.5} strokeLinecap="round" />
        ))}
        <path d="M18 18 L6 46 L20 46 L10 72" stroke="#f2a516" strokeWidth={3.5} fill="none" strokeLinejoin="round" className="ma-sa-bolt" />
      </g>
      <g transform="translate(880 230) scale(1.6)">
        <rect x={-18} y={-26} width={36} height={26} fill="#f3efe6" stroke="#2a2a2a" strokeWidth={1.2} />
        <path d="M-22 -26 L0 -44 L22 -26 Z" fill="#3b3b3a" />
        <rect x={-5} y={-14} width={10} height={14} fill="#6b5a44" />
      </g>
      {STORM_STAGES.map((s, i) => (
        <g key={s.t} transform={`translate(${90 + i * 170} 262)`} className="ma-sa-stage" style={{ animationDelay: `${i * 1.6}s` }}>
          <rect x={-70} y={-18} width={140} height={34} rx={17} className="ma-sa-chip" />
          <text x={0} y={5} textAnchor="middle" className="ma-label ma-sa-chip-text">{s.t}</text>
        </g>
      ))}
      <path d="M20 200 L 820 200" stroke="#5c5c5b" strokeWidth={1.5} strokeDasharray="3 8" />
      <text x={20} y={30} className="ma-label">Official forecasts, read every ten minutes</text>
      <text x={940} y={30} textAnchor="end" className="ma-label">Your house&apos;s own models</text>
    </svg>
  );
}
