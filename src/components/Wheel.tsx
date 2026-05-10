import { useEffect, useMemo, useRef, useState } from "react";
import { SLICES } from "@/lib/wheel-data";
import { sfx } from "@/lib/sound";

const SIZE = 360;
const R = SIZE / 2;
const N = SLICES.length; // 12
const SLICE_DEG = 360 / N;

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(idx: number) {
  const start = idx * SLICE_DEG;
  const end = start + SLICE_DEG;
  const p1 = polar(R, R, R - 4, start);
  const p2 = polar(R, R, R - 4, end);
  return `M ${R} ${R} L ${p1.x} ${p1.y} A ${R - 4} ${R - 4} 0 0 1 ${p2.x} ${p2.y} Z`;
}

type Props = {
  onResult: (idx: number) => void;
  spinning: boolean;
  setSpinning: (v: boolean) => void;
  flashKey: number; // increments to trigger flash
};

export default function Wheel({ onResult, spinning, setSpinning, flashKey }: Props) {
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const tickRef = useRef(0);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  useEffect(() => {
    const handler = () => spin();
    window.addEventListener("spin-now", handler);
    return () => window.removeEventListener("spin-now", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning]);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    sfx.click();
    setTimeout(() => sfx.suspense(), 100);

    const targetIdx = Math.floor(Math.random() * N);
    // Pointer is at top (0deg). After rotation R, slice center at (i+0.5)*SLICE_DEG must be at 0 (mod 360).
    // So R ≡ -(i+0.5)*SLICE_DEG (mod 360). Add full turns for drama.
    const turns = 6 + Math.floor(Math.random() * 4); // 6-9 full turns
    const finalAngle =
      turns * 360 + (360 - (targetIdx + 0.5) * SLICE_DEG);
    const start = rotationRef.current;
    const end = start + finalAngle;
    const duration = 5200 + Math.random() * 1200;
    const t0 = performance.now();
    tickRef.current = start;

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      const cur = start + (end - start) * easeOut(t);
      rotationRef.current = cur;
      setRotation(cur);
      // tick sound when crossing a slice boundary
      const passed = Math.floor((cur - start) / SLICE_DEG);
      const lastPassed = Math.floor((tickRef.current - start) / SLICE_DEG);
      if (passed !== lastPassed) sfx.tick();
      tickRef.current = cur;
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
        setSpinning(false);
        if (navigator.vibrate) navigator.vibrate([60, 40, 120]);
        onResult(targetIdx);
      }
    };
    rafRef.current = requestAnimationFrame(step);
  };

  const shakeKey = flashKey;
  const wheelGradient = useMemo(() => Date.now(), []);

  return (
    <div className="relative flex flex-col items-center select-none" key={shakeKey ? undefined : "x"}>
      {/* Glow halo */}
      <div className="absolute inset-0 -z-10 blur-3xl opacity-70 animate-pulse-glow rounded-full"
        style={{ background: "var(--gradient-neon)" }} />

      {/* Pointer */}
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-3 z-20"
          style={{
            width: 0,
            height: 0,
            borderLeft: "18px solid transparent",
            borderRight: "18px solid transparent",
            borderTop: "32px solid oklch(0.95 0.2 95)",
            filter: "drop-shadow(0 0 12px var(--gold))",
          }}
        />
        {/* Outer ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "conic-gradient(from 0deg, var(--neon-pink), var(--neon-cyan), var(--neon-yellow), var(--neon-purple), var(--neon-pink))",
            padding: 6,
            boxShadow: "0 0 40px var(--neon-pink), 0 0 80px var(--neon-purple), inset 0 0 20px oklch(0 0 0 / 0.5)",
          }}
        >
          <div className="w-full h-full rounded-full bg-[oklch(0.08_0.05_280)] p-1">
            <svg
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              width="100%"
              height="100%"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: "none",
                filter: "drop-shadow(0 0 8px oklch(0 0 0 / 0.6))",
              }}
              key={wheelGradient}
            >
              {SLICES.map((s, i) => (
                <g key={i}>
                  <path d={arcPath(i)} fill={s.color} stroke="oklch(1 0 0 / 0.25)" strokeWidth="1.5" />
                  <g
                    transform={`rotate(${i * SLICE_DEG + SLICE_DEG / 2} ${R} ${R}) translate(${R} 28)`}
                  >
                    <text
                      textAnchor="middle"
                      fontSize="22"
                      style={{ userSelect: "none" }}
                    >
                      {s.emoji}
                    </text>
                    <text
                      textAnchor="middle"
                      y="20"
                      fontSize="11"
                      fontWeight="800"
                      fill="white"
                      style={{ letterSpacing: 0.5 }}
                    >
                      {s.label}
                    </text>
                  </g>
                </g>
              ))}
              <circle cx={R} cy={R} r={R - 4} fill="none" stroke="oklch(1 0 0 / 0.18)" strokeWidth="2" />
            </svg>
          </div>
        </div>
        {/* Center hub */}
        <button
          onClick={spin}
          disabled={spinning}
          aria-label="Spin"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 rounded-full grid place-items-center font-black"
          style={{
            width: 78, height: 78,
            background: "var(--gradient-gold)",
            color: "oklch(0.15 0.05 30)",
            boxShadow: "0 0 24px var(--gold), inset 0 2px 0 oklch(1 0 0 / 0.6), inset 0 -4px 8px oklch(0 0 0 / 0.3)",
            border: "3px solid oklch(0.98 0.05 95)",
            fontSize: 14,
            letterSpacing: 1,
          }}
        >
          {spinning ? "..." : "SPIN"}
        </button>
      </div>
    </div>
  );
}

export { SIZE as WHEEL_SIZE };
