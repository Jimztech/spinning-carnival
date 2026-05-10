import { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import Wheel from "./Wheel";
import { SLICES } from "@/lib/wheel-data";
import {
  sfx, setMusic, setMuteSfx, setMuteMusic, isMuteMusic, isMuteSfx, unlockAudio,
} from "@/lib/sound";

const FLOAT_EMOJIS = ["✨", "💫", "🎉", "💖", "⭐", "🔥", "💎", "🎊"];

export default function SpinGame() {
  const [spinning, setSpinning] = useState(false);
  const [resultIdx, setResultIdx] = useState<number | null>(null);
  const [spinCount, setSpinCount] = useState(0);
  const [luck, setLuck] = useState(50);
  const [flashKey, setFlashKey] = useState(0);
  const [muteM, setMuteM] = useState(false);
  const [muteS, setMuteS] = useState(false);
  const [shake, setShake] = useState(false);
  const [flashColor, setFlashColor] = useState<"none" | "red" | "gold">("none");
  const [floats, setFloats] = useState<{ id: number; emoji: string; left: number }[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [musicStarted, setMusicStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const result = resultIdx !== null ? SLICES[resultIdx] : null;

  // Background sparks (deterministic per session)
  const sparks = useMemo(
    () => Array.from({ length: 26 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 6 + Math.random() * 8,
      size: 3 + Math.random() * 6,
      hue: Math.floor(Math.random() * 360),
    })),
    []
  );
  const floatBg = useMemo(
    () => Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      emoji: FLOAT_EMOJIS[i % FLOAT_EMOJIS.length],
      left: (i * 7 + 5) % 95,
      top: (i * 13 + 10) % 80,
      delay: Math.random() * 4,
      size: 18 + Math.random() * 22,
    })),
    []
  );

  const startMusic = () => {
    unlockAudio();
    if (!musicStarted) {
      setMusic("happy");
      setMusicStarted(true);
    }
  };

  useEffect(() => {
    const onFirst = () => { startMusic(); window.removeEventListener("pointerdown", onFirst); };
    window.addEventListener("pointerdown", onFirst);
    return () => window.removeEventListener("pointerdown", onFirst);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResult = (idx: number) => {
    const s = SLICES[idx];
    setResultIdx(idx);
    setSpinCount((c) => c + 1);
    setLuck(Math.floor(Math.random() * 101));
    setFlashKey((k) => k + 1);
    setShake(true);
    setTimeout(() => setShake(false), 600);
    setShowPopup(true);

    // floating emojis
    const newFloats = Array.from({ length: 8 }).map((_, i) => ({
      id: Date.now() + i,
      emoji: s.emoji,
      left: 20 + Math.random() * 60,
    }));
    setFloats((f) => [...f, ...newFloats]);
    setTimeout(() => {
      setFloats((f) => f.filter((x) => !newFloats.find((n) => n.id === x.id)));
    }, 2200);

    if (s.outcome === "death") {
      setFlashColor("red");
      setMusic("horror");
      sfx.doom();
      if (navigator.vibrate) navigator.vibrate([200, 80, 300]);
      setTimeout(() => setFlashColor("none"), 2400);
    } else if (s.outcome === "money" || s.outcome === "jackpot") {
      setFlashColor("gold");
      setMusic("victory");
      sfx.celebrate();
      if (navigator.vibrate) navigator.vibrate([60, 30, 60, 30, 200]);
      // confetti
      const burst = (opts: confetti.Options) => confetti({
        particleCount: 120, spread: 90, startVelocity: 45,
        colors: ["#ffd700", "#ff66cc", "#66ffff", "#ffffff", "#ff8800"],
        ...opts,
      });
      burst({ origin: { x: 0.2, y: 0.6 } });
      burst({ origin: { x: 0.8, y: 0.6 } });
      setTimeout(() => burst({ origin: { x: 0.5, y: 0.4 }, particleCount: 200 }), 250);
      setTimeout(() => setFlashColor("none"), 2400);
    } else {
      // back to happy if previously horror/victory
      setMusic("happy");
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    }
  };

  const playAgain = () => {
    setResultIdx(null);
    setShowPopup(false);
    setFlashColor("none");
    setMusic("happy");
  };

  const toggleMusic = () => {
    const next = !muteM; setMuteM(next); setMuteMusic(next);
    if (!musicStarted) { startMusic(); }
  };
  const toggleSfx = () => { const next = !muteS; setMuteS(next); setMuteSfx(next); };

  const isMoney = result?.outcome === "money" || result?.outcome === "jackpot";
  const isDeath = result?.outcome === "death";

  return (
    <div
      ref={containerRef}
      className={`relative min-h-screen overflow-hidden ${shake ? "animate-shake" : ""}`}
      onPointerDown={startMusic}
    >
      {/* Animated background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 animate-hue"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, oklch(0.35 0.25 320 / 0.6), transparent 60%), radial-gradient(ellipse at 80% 90%, oklch(0.35 0.25 195 / 0.6), transparent 60%), radial-gradient(ellipse at 50% 50%, oklch(0.25 0.18 280 / 0.4), transparent 70%)",
        }}
      />
      {/* Floating background emojis */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {floatBg.map((f) => (
          <span
            key={f.id}
            className="absolute animate-float-bg opacity-30"
            style={{
              left: `${f.left}%`,
              top: `${f.top}%`,
              fontSize: f.size,
              animationDelay: `${f.delay}s`,
              animationDuration: `${6 + f.delay}s`,
            }}
          >
            {f.emoji}
          </span>
        ))}
        {sparks.map((s) => (
          <span
            key={s.id}
            className="absolute rounded-full"
            style={{
              left: `${s.left}%`,
              bottom: 0,
              width: s.size,
              height: s.size,
              background: `oklch(0.85 0.25 ${s.hue})`,
              boxShadow: `0 0 12px oklch(0.85 0.25 ${s.hue})`,
              animation: `spark-rise ${s.duration}s linear ${s.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Red / gold overlay */}
      {flashColor === "red" && (
        <div className="pointer-events-none fixed inset-0 z-40 animate-flash-red"
          style={{ background: "oklch(0.55 0.3 25 / 0.18)", backdropFilter: "brightness(0.6)" }} />
      )}
      {flashColor === "gold" && (
        <>
          <div className="pointer-events-none fixed inset-0 z-30 animate-glow-gold" />
          {/* money rain */}
          <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
            {Array.from({ length: 24 }).map((_, i) => (
              <span key={i} className="absolute text-3xl"
                style={{
                  left: `${(i * 4.3) % 100}%`,
                  top: "-10vh",
                  animation: `money-fall ${2.4 + Math.random() * 2}s linear ${Math.random() * 1.2}s forwards`,
                }}>
                {i % 2 === 0 ? "💵" : "💰"}
              </span>
            ))}
          </div>
        </>
      )}

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-4 pt-4">
        <div className="glass rounded-2xl px-3 py-2 text-xs font-bold">
          <div className="text-muted-foreground">SPINS</div>
          <div className="text-glow-cyan text-lg">{spinCount}</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleSfx}
            className="glass rounded-full w-10 h-10 grid place-items-center text-lg active:scale-95 transition"
            aria-label="Toggle sound effects"
          >
            {muteS ? "🔇" : "🔔"}
          </button>
          <button
            onClick={toggleMusic}
            className="glass rounded-full w-10 h-10 grid place-items-center text-lg active:scale-95 transition"
            aria-label="Toggle music"
          >
            {muteM ? "🎵" : "🎶"}
          </button>
        </div>
        <div className="glass rounded-2xl px-3 py-2 text-xs font-bold min-w-[88px]">
          <div className="text-muted-foreground">LUCK</div>
          <div className="h-2 w-full rounded-full bg-[oklch(0.2_0.05_280)] mt-1 overflow-hidden">
            <div className="h-full transition-all duration-700"
              style={{
                width: `${luck}%`,
                background: "linear-gradient(90deg, var(--neon-pink), var(--neon-yellow), var(--neon-green))",
                boxShadow: "0 0 10px var(--neon-yellow)",
              }} />
          </div>
          <div className="text-right text-[10px] text-glow-cyan mt-0.5">{luck}%</div>
        </div>
      </header>

      {/* Title */}
      <div className="relative z-10 mt-6 text-center px-4">
        <div className="inline-block animate-title-bounce">
          <h1 className="text-3xl sm:text-4xl font-black tracking-wide">
            <span className="text-glow-pink" style={{ background: "var(--gradient-neon)", WebkitBackgroundClip: "text", color: "transparent" }}>
              🎯 TRY YOUR LUCK 🎯
            </span>
          </h1>
          <p className="mt-1 text-xs uppercase tracking-[0.3em] text-glow-cyan opacity-90">
            spin · win · vibe
          </p>
        </div>
      </div>

      {/* Wheel */}
      <main className="relative z-10 mt-8 flex flex-col items-center px-4 pb-8">
        <Wheel
          spinning={spinning}
          setSpinning={setSpinning}
          onResult={handleResult}
          flashKey={flashKey}
        />

        {/* Spin button */}
        <button
          onClick={() => {
            startMusic();
            // Trigger via dispatching click on wheel hub? Simpler: call from window
            // Use a custom event so Wheel handles spin logic.
            const ev = new CustomEvent("spin-now");
            window.dispatchEvent(ev);
          }}
          disabled={spinning}
          className={`btn-spin mt-10 px-10 py-5 rounded-full text-xl font-black tracking-wider uppercase
            ${spinning ? "opacity-60" : "animate-pulse-glow active:scale-95"}
          `}
          style={{ letterSpacing: 2 }}
          onMouseEnter={() => sfx.hover()}
        >
          {spinning ? "Spinning..." : "Spin the wheel"}
        </button>

        <p className="mt-4 text-xs text-muted-foreground text-center max-w-xs">
          Tap the golden hub or the button. Brace yourself.
        </p>
      </main>

      {/* Floating reaction emojis */}
      <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
        {floats.map((f) => (
          <span
            key={f.id}
            className="absolute text-4xl"
            style={{
              left: `${f.left}%`,
              bottom: "30%",
              animation: "float-up 2s ease-out forwards",
            }}
          >
            {f.emoji}
          </span>
        ))}
      </div>

      {/* Result popup */}
      {showPopup && result && (
        <div className="fixed inset-0 z-50 grid place-items-center px-6">
          <div
            className="absolute inset-0"
            onClick={playAgain}
            style={{ background: "oklch(0 0 0 / 0.55)", backdropFilter: "blur(8px)" }}
          />
          <div
            className={`relative glass animate-pop-in rounded-3xl p-6 text-center max-w-sm w-full ${
              isDeath ? "border-2" : ""
            }`}
            style={{
              borderColor: isDeath ? "var(--blood)" : undefined,
              boxShadow: isDeath
                ? "0 0 60px var(--blood), inset 0 0 40px oklch(0 0 0 / 0.6)"
                : isMoney
                  ? "0 0 60px var(--gold), inset 0 0 40px oklch(0.84 0.18 90 / 0.2)"
                  : "var(--shadow-neon)",
            }}
          >
            <div className="text-6xl mb-2">{result.emoji}</div>
            <div
              className="text-2xl font-black mb-1"
              style={{
                color: isDeath ? "var(--blood)" : isMoney ? "var(--gold)" : "white",
                textShadow: isDeath
                  ? "0 0 12px var(--blood)"
                  : isMoney
                    ? "0 0 14px var(--gold)"
                    : "0 0 12px var(--neon-pink)",
              }}
            >
              {result.popup}
            </div>
            <div className="text-sm text-muted-foreground mb-5 uppercase tracking-widest">
              {result.label}
            </div>
            <button
              onClick={playAgain}
              className="btn-spin w-full py-3 rounded-2xl font-black uppercase tracking-wider animate-pulse-glow"
            >
              ▶ Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
