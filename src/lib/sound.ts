// Lightweight synthesized sound engine using Web Audio.
// No external audio files required — easy to swap with files later.

let ctx: AudioContext | null = null;
let musicNode: { stop: () => void } | null = null;
let musicMode: "off" | "happy" | "horror" | "victory" = "off";
let muteSfx = false;
let muteMusic = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function envBeep(freq: number, dur = 0.08, type: OscillatorType = "square", gain = 0.15) {
  if (muteSfx) return;
  const c = getCtx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  o.connect(g).connect(c.destination);
  o.start();
  o.stop(c.currentTime + dur + 0.02);
}

export const sfx = {
  tick: () => envBeep(1100 + Math.random() * 200, 0.04, "square", 0.08),
  click: () => envBeep(660, 0.06, "triangle", 0.12),
  hover: () => envBeep(880, 0.04, "sine", 0.05),
  suspense: () => {
    const c = getCtx(); if (!c || muteSfx) return;
    const o = c.createOscillator(); const g = c.createGain();
    o.type = "sawtooth"; o.frequency.setValueAtTime(120, c.currentTime);
    o.frequency.linearRampToValueAtTime(60, c.currentTime + 1.2);
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.linearRampToValueAtTime(0.12, c.currentTime + 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 1.3);
    o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 1.4);
  },
  celebrate: () => {
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((f, i) => setTimeout(() => envBeep(f, 0.18, "triangle", 0.18), i * 90));
  },
  doom: () => {
    const c = getCtx(); if (!c || muteSfx) return;
    const o = c.createOscillator(); const g = c.createGain();
    o.type = "sawtooth"; o.frequency.setValueAtTime(180, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(40, c.currentTime + 1.5);
    g.gain.setValueAtTime(0.25, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 1.6);
    o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 1.7);
  },
};

function startHappyMusic() {
  const c = getCtx(); if (!c) return null;
  const master = c.createGain(); master.gain.value = muteMusic ? 0 : 0.06;
  master.connect(c.destination);
  const bpm = 124, beat = 60 / bpm;
  const bass = [55, 55, 73, 65, 87, 87, 98, 73];
  const lead = [523, 659, 784, 659, 587, 784, 880, 784];
  let step = 0;
  const id = setInterval(() => {
    const t = c.currentTime;
    const bo = c.createOscillator(); const bg = c.createGain();
    bo.type = "square"; bo.frequency.value = bass[step % bass.length];
    bg.gain.setValueAtTime(0.18, t); bg.gain.exponentialRampToValueAtTime(0.001, t + beat * 0.9);
    bo.connect(bg).connect(master); bo.start(t); bo.stop(t + beat);
    if (step % 2 === 0) {
      const lo = c.createOscillator(); const lg = c.createGain();
      lo.type = "triangle"; lo.frequency.value = lead[(step / 2) % lead.length];
      lg.gain.setValueAtTime(0.12, t); lg.gain.exponentialRampToValueAtTime(0.001, t + beat * 1.6);
      lo.connect(lg).connect(master); lo.start(t); lo.stop(t + beat * 2);
    }
    step++;
  }, beat * 1000);
  return { stop: () => { clearInterval(id); master.disconnect(); } };
}

function startHorrorMusic() {
  const c = getCtx(); if (!c) return null;
  const master = c.createGain(); master.gain.value = muteMusic ? 0 : 0.08;
  master.connect(c.destination);
  const drone = c.createOscillator(); const dg = c.createGain();
  drone.type = "sawtooth"; drone.frequency.value = 55; dg.gain.value = 0.15;
  drone.connect(dg).connect(master); drone.start();
  const drone2 = c.createOscillator(); const dg2 = c.createGain();
  drone2.type = "sine"; drone2.frequency.value = 58; dg2.gain.value = 0.1;
  drone2.connect(dg2).connect(master); drone2.start();
  const id = setInterval(() => {
    const t = c.currentTime;
    const o = c.createOscillator(); const g = c.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(900 + Math.random() * 400, t);
    o.frequency.exponentialRampToValueAtTime(200, t + 1.5);
    g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
    o.connect(g).connect(master); o.start(t); o.stop(t + 1.6);
  }, 2200);
  return { stop: () => { clearInterval(id); try { drone.stop(); drone2.stop(); } catch {} master.disconnect(); } };
}

function startVictoryMusic() {
  const c = getCtx(); if (!c) return null;
  const master = c.createGain(); master.gain.value = muteMusic ? 0 : 0.07;
  master.connect(c.destination);
  const melody = [784, 880, 988, 1047, 988, 880, 784, 1047];
  const beat = 0.22; let step = 0;
  const id = setInterval(() => {
    const t = c.currentTime;
    const o = c.createOscillator(); const g = c.createGain();
    o.type = "triangle"; o.frequency.value = melody[step % melody.length];
    g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + beat * 1.4);
    o.connect(g).connect(master); o.start(t); o.stop(t + beat * 1.5);
    step++;
  }, beat * 1000);
  return { stop: () => { clearInterval(id); master.disconnect(); } };
}

export function setMusic(mode: "off" | "happy" | "horror" | "victory") {
  if (musicMode === mode) return;
  if (musicNode) { musicNode.stop(); musicNode = null; }
  musicMode = mode;
  if (mode === "happy") musicNode = startHappyMusic();
  else if (mode === "horror") musicNode = startHorrorMusic();
  else if (mode === "victory") musicNode = startVictoryMusic();
}

export function getMusicMode() { return musicMode; }
export function setMuteSfx(m: boolean) { muteSfx = m; }
export function setMuteMusic(m: boolean) {
  muteMusic = m;
  // Quickest way to apply: restart current mode
  const cur = musicMode;
  if (musicNode) { musicNode.stop(); musicNode = null; musicMode = "off"; setMusic(cur); }
}
export function isMuteSfx() { return muteSfx; }
export function isMuteMusic() { return muteMusic; }

export function unlockAudio() { getCtx(); }
