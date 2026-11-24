"use client";

import { useEffect, useRef, useState } from "react";
import { SCENES, Timelapse } from "@/lib/timelapse/engine";
import "@/styles/timelapse.css";

// The time-lapse in the How it works hero (engine: src/lib/timelapse/engine.ts).
// An illustration, said under it. It never autoplays for a reader who asked
// for reduced motion: they get a still and can step through the scenes. It
// stops whenever it is off screen or the tab is hidden, and anyone can pause it
// (WCAG 2.2.2, motion over five seconds).

export function HeroTimelapse() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Timelapse | null>(null);
  const [scene, setScene] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [reduced, setReduced] = useState(false);
  const wantPlay = useRef(true);
  const visible = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let engine: Timelapse;
    try {
      engine = new Timelapse(canvas, { onScene: setScene });
    } catch {
      return; // no canvas: the caption still says what it would have shown
    }
    engineRef.current = engine;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotion = () => {
      setReduced(mq.matches);
      if (mq.matches) {
        wantPlay.current = false;
        setPlaying(false);
        engine.stop();
        engine.setTime(SCENES[1].still);
      }
    };
    applyMotion();
    const sync = () => {
      if (wantPlay.current && visible.current && document.visibilityState === "visible") engine.start();
      else engine.stop();
    };
    if (!mq.matches) engine.setTime(SCENES[0].t0 + 0.01);
    sync();
    mq.addEventListener("change", applyMotion);
    const io = new IntersectionObserver(([e]) => {
      visible.current = e.isIntersecting;
      sync();
    });
    io.observe(canvas);
    const ro = new ResizeObserver(() => engine.resize());
    ro.observe(canvas);
    document.addEventListener("visibilitychange", sync);
    return () => {
      mq.removeEventListener("change", applyMotion);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", sync);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const toggle = () => {
    const e = engineRef.current;
    if (!e) return;
    const next = !playing;
    wantPlay.current = next;
    setPlaying(next);
    if (next && visible.current) e.start();
    else e.stop();
  };

  const jump = (i: number) => {
    const e = engineRef.current;
    if (!e) return;
    const sc = SCENES[i];
    e.setTime(playing ? sc.t0 + 0.01 : sc.still);
    setScene(i);
  };

  return (
    <figure className="tl" aria-labelledby="tl-cap">
      <div className="tl-stage">
        <canvas
          ref={canvasRef}
          className="tl-canvas"
          role="img"
          aria-label="An illustrated town on a floating block of ground, with a creek and a forest, over three days and nights: a flood, a hurricane, a heat wave, an earthquake that opens a sinkhole in a square, a wildfire through the forest, a winter storm and a wind storm. At the end the block folds into the SPARC Labs cube."
        />
        <div className="tl-now" aria-hidden="true">
          <span className="tl-now-dot" data-scene={SCENES[scene].id} />
          {SCENES[scene].label}
        </div>
        <button type="button" className="tl-play" onClick={toggle} aria-pressed={!playing}>
          {playing ? "Pause" : reduced ? "Play anyway" : "Play"}
        </button>
      </div>
      <div className="tl-chips" role="group" aria-label="Go to a moment in the animation">
        {SCENES.slice(1, -1).map((sc, k) => (
          <button
            key={sc.id}
            type="button"
            className="tl-chip"
            aria-current={scene === k + 1 ? "step" : undefined}
            onClick={() => jump(k + 1)}
          >
            {sc.label}
          </button>
        ))}
      </div>
      <figcaption id="tl-cap" className="tl-cap">
        An illustration of what we model, not a model result. The real thing is a{" "}
        <a href="/example">worked example of one block</a>.
      </figcaption>
    </figure>
  );
}
