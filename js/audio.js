// WebAudio-Synth-SFX im 8-bit-Stil — keine Audiodateien.
let ctx = null;
let master = null;

export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain();
  master.gain.value = 0.32;
  master.connect(ctx.destination);
}

function tone({ f0, f1, dur, type = 'square', vol = 0.18, delay = 0 }) {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1 ?? f0), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + dur + 0.02);
}

function noise({ dur, vol = 0.2, freq = 1000, delay = 0 }) {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const len = Math.max(1, (ctx.sampleRate * dur) | 0);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(f); f.connect(g); g.connect(master);
  src.start(t);
}

// ---------- DOOM-inspirierter Soundtrack (prozeduraler Sequencer) ----------
// E-Moll-Chug-Riff (Achtel) + Kick/Snare/HiHat. Im Kampf: doppelte Hats + Lead-Gitarre.
const BASS_RIFF = [0, 0, 12, 0, 0, 10, 0, 8, 0, 0, 12, 0, 0, 10, 8, 7]; // Halbtöne über E2
const LEAD_SEQ = [12, 15, 17, 15, 12, 10, 8, 10, 12, 15, 19, 17, 15, 12, 10, 7]; // über E4
const E2 = 82.41, E4 = 329.63;
const STEP_DUR = 60 / 132 / 2; // Achtel bei 132 BPM

let musicGain = null;
let musicTimer = null;
let musicStep = 0;
let musicNextT = 0;
let fightMode = false;
let noiseBuf = null;

function getNoiseBuf() {
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

function mBass(t, off) {
  const f = E2 * Math.pow(2, off / 12);
  const flt = ctx.createBiquadFilter();
  flt.type = 'lowpass'; flt.frequency.value = 520; flt.Q.value = 1;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime(0.3, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.19);
  flt.connect(g); g.connect(musicGain);
  for (const det of [-6, 6]) {
    const o = ctx.createOscillator();
    o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det;
    o.connect(flt); o.start(t); o.stop(t + 0.22);
  }
}

function mKick(t) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(125, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.11);
  g.gain.setValueAtTime(0.6, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
  o.connect(g); g.connect(musicGain);
  o.start(t); o.stop(t + 0.15);
}

function mSnare(t) {
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuf();
  const flt = ctx.createBiquadFilter();
  flt.type = 'bandpass'; flt.frequency.value = 1900; flt.Q.value = 0.8;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.3, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  src.connect(flt); flt.connect(g); g.connect(musicGain);
  src.start(t); src.stop(t + 0.14);
}

function mHat(t, vol = 0.06) {
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuf();
  const flt = ctx.createBiquadFilter();
  flt.type = 'highpass'; flt.frequency.value = 7500;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
  src.connect(flt); flt.connect(g); g.connect(musicGain);
  src.start(t); src.stop(t + 0.05);
}

function mLead(t, off, dur) {
  const o = ctx.createOscillator();
  o.type = 'square';
  o.frequency.value = E4 * Math.pow(2, off / 12);
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 5.5;
  const lfoG = ctx.createGain(); lfoG.gain.value = 14; // Vibrato in Cents
  lfo.connect(lfoG); lfoG.connect(o.detune);
  const flt = ctx.createBiquadFilter();
  flt.type = 'lowpass'; flt.frequency.value = 2600;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime(0.1, t + 0.02);
  g.gain.setValueAtTime(0.1, t + dur * 0.6);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(flt); flt.connect(g); g.connect(musicGain);
  o.start(t); lfo.start(t);
  o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
}

function playMusicStep(s, t) {
  mBass(t, BASS_RIFF[s % 16]);
  if (s % 4 === 0) mKick(t);
  if (s % 8 === 4) mSnare(t);
  mHat(t, s % 4 === 0 ? 0.08 : 0.05);
  if (fightMode) {
    mHat(t + STEP_DUR / 2, 0.045); // 16tel-Hats im Kampf
    if (s % 2 === 0) mLead(t, LEAD_SEQ[(s / 2) % 16], STEP_DUR * 1.9);
  }
}

export const music = {
  start() {
    if (!ctx || musicTimer) return;
    ensureMusicGain();
    musicStep = 0;
    musicNextT = ctx.currentTime + 0.1;
    musicTimer = setInterval(() => {
      while (musicNextT < ctx.currentTime + 0.18) {
        playMusicStep(musicStep, musicNextT);
        musicStep = (musicStep + 1) % 32;
        musicNextT += STEP_DUR;
      }
    }, 45);
  },
  stop() {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    fightMode = false;
  },
  setFight(v) { fightMode = v; },
};

function ensureMusicGain() {
  if (!musicGain) {
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.5;
    musicGain.connect(master);
  }
}

export const sfx = {
  shoot() {
    noise({ dur: 0.08, vol: 0.22, freq: 1600 });
    tone({ f0: 320, f1: 60, dur: 0.12, type: 'square', vol: 0.15 });
  },
  hitEnemy() {
    tone({ f0: 720, f1: 380, dur: 0.07, type: 'square', vol: 0.14 });
  },
  playerHurt() {
    tone({ f0: 220, f1: 70, dur: 0.28, type: 'sawtooth', vol: 0.22 });
    noise({ dur: 0.12, vol: 0.1, freq: 500 });
  },
  excuse() {
    tone({ f0: 480, f1: 640, dur: 0.1, type: 'triangle', vol: 0.14 });
    tone({ f0: 640, f1: 500, dur: 0.12, type: 'triangle', vol: 0.12, delay: 0.1 });
  },
  bossDie() {
    [420, 310, 210, 120].forEach((f, i) =>
      tone({ f0: f, f1: f * 0.7, dur: 0.14, type: 'square', vol: 0.16, delay: i * 0.11 }));
    noise({ dur: 0.4, vol: 0.14, freq: 400, delay: 0.35 });
  },
  award(good) {
    if (good) {
      [523, 659, 784, 1047].forEach((f, i) =>
        tone({ f0: f, dur: 0.1, type: 'square', vol: 0.14, delay: i * 0.09 }));
    } else {
      [420, 350, 280].forEach((f, i) =>
        tone({ f0: f, f1: f - 40, dur: 0.18, type: 'triangle', vol: 0.15, delay: i * 0.16 }));
    }
  },
  door() {
    noise({ dur: 0.35, vol: 0.12, freq: 300 });
    tone({ f0: 90, f1: 130, dur: 0.3, type: 'sawtooth', vol: 0.08 });
  },
  doorSlam() {
    noise({ dur: 0.2, vol: 0.2, freq: 250 });
    tone({ f0: 100, f1: 45, dur: 0.25, type: 'square', vol: 0.16 });
  },
  breakdown() {
    [300, 240, 180, 120, 80].forEach((f, i) =>
      tone({ f0: f, f1: f * 0.8, dur: 0.22, type: 'sawtooth', vol: 0.16, delay: i * 0.18 }));
  },
  win() {
    [523, 523, 659, 784, 1047, 784, 1047].forEach((f, i) =>
      tone({ f0: f, dur: 0.13, type: 'square', vol: 0.15, delay: i * 0.13 }));
  },
  lose() {
    [349, 330, 311, 294].forEach((f, i) =>
      tone({ f0: f, f1: f - 15, dur: 0.32, type: 'sawtooth', vol: 0.14, delay: i * 0.3 }));
  },
};
