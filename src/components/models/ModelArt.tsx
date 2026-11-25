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

/* ---------------- the model scenes: Kyle's drawings ----------------
 * Kyle (25 Nov 2026): "crop these images and use them … we don't need animations for
 * each model … I might replace later." Cropped from his sheet (project files
 * site/art-incoming/kyle-models-sheet-2026-11-25.jpg) into public/models/<slug>.jpg.
 * The words are part of the drawings, so the alt text repeats what each one shows. */
const MODEL_IMAGES: Record<ModelSlug, { src: string; w: number; h: number; alt: string }> = {
  flood: { src: "/models/flood.jpg", w: 575, h: 202, alt: "Drawing: rain falls on houses along a slope; the water runs downhill and floods the low ground at the bottom." },
  heat: { src: "/models/heat.jpg", w: 575, h: 202, alt: "Drawing: by day the sun heats the ground and heat rises off it; at night the ground and buildings give that heat back to the sky." },
  ground: { src: "/models/ground.jpg", w: 575, h: 203, alt: "Drawing: a satellite measures the ground under a house by radar, with a GPS post nearby and a layer below that is sinking." },
  wind: { src: "/models/wind.jpg", w: 575, h: 203, alt: "Drawing: severe wind bends a tree and blows between two tall buildings, past a house, toward a sheltered yard behind a wall." },
  wildfire: { src: "/models/wildfire.jpg", w: 575, h: 188, alt: "Drawing: a fire front burns through a forest on a hill, its smoke and embers blowing toward a house beyond a fence." },
  hurricane: { src: "/models/hurricane.jpg", w: 575, h: 188, alt: "Drawing: a hurricane spiral over the ocean and the dashed path it takes toward the coast." },
  bristlecone: { src: "/models/bristlecone.jpg", w: 575, h: 192, alt: "Drawing: the cross-section of an ancient bristlecone pine, its rings counting back two thousand years, with a fire scar and dense growth." },
};

export function ModelArt({ slug }: { slug: ModelSlug }) {
  const m = MODEL_IMAGES[slug];
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={m.src} width={m.w} height={m.h} alt={m.alt} className="model-art model-art-img" loading="lazy" decoding="async" />;
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
