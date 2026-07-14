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

// ---------- Doom-flavored soundtrack (procedural sequencer) ----------
// Riff transcribed from the piano sheet: ♩=114, 4/4, E minor, f.
// Two bars of sixteenths in [E2 E2 x] groups, x descending e' d' c' B♭ B♮ c';
// bar 2 ends on a B♭ tied through the rest of the bar (null = keep ringing).
// L.H.: dotted-quarter E1 ("an octave lower than written") on each downbeat.
const RIFF = [
  0, 0, 12, 0, 0, 10, 0, 0, 8, 0, 0, 6, 0, 0, 7, 8,          // bar 1
  0, 0, 12, 0, 0, 10, 0, 0, 8, 0, 0, 6, null, null, null, null, // bar 2
];
const HELD_STEP = 27; // the tied B♭ in bar 2
// Battle lead, 4 bars of eighths in E phrygian: [semitones from E4, length in
// eighths], null = rest. Stabby low phrases rise to a held high-E climax.
const LEAD_PHRASE = [
  [0, 1], [null, 1], [3, 1], [0, 1], [1, 1], [null, 1], [0, 1], [null, 1],   // bar 1: stabs
  [5, 1], [3, 1], [1, 1], [3, 1], [1, 1], [0, 1], [-5, 2],                   // bar 2: coil down
  [0, 1], [null, 1], [0, 1], [3, 1], [5, 1], [null, 1], [8, 1], [7, 1],      // bar 3: climb
  [12, 3], [8, 1], [7, 1], [1, 1], [0, 2],                                   // bar 4: climax, fall
];
// Expand to a 32-slot eighth grid: {off, dur} on attacks, sparse elsewhere.
const LEAD_STEPS = (() => {
  const steps = [];
  let i = 0;
  for (const [off, len] of LEAD_PHRASE) {
    if (off !== null) steps[i] = { off, dur: len };
    i += len;
  }
  return steps;
})();
const E2 = 82.41, E4 = 329.63;
const STEP_DUR = 60 / 114 / 4; // sixteenths at 114 BPM

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

const distCurves = new Map();
function getDistCurve(drive = 2.5) {
  let c = distCurves.get(drive);
  if (!c) {
    c = new Float32Array(256);
    for (let i = 0; i < 256; i++) c[i] = Math.tanh(drive * (i / 127.5 - 1));
    distCurves.set(drive, c);
  }
  return c;
}

function mBass(t, off, accent, dur = 0.12) {
  const f = E2 * Math.pow(2, off / 12);
  const shaper = ctx.createWaveShaper();
  shaper.curve = getDistCurve(fightMode ? 4.5 : 2.5);
  const flt = ctx.createBiquadFilter();
  flt.type = 'lowpass';
  flt.frequency.value = fightMode ? (accent ? 1100 : 640) : (accent ? 700 : 460);
  flt.Q.value = 1;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime((accent ? 0.24 : 0.18) * (fightMode ? 1.3 : 1), t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  shaper.connect(flt); flt.connect(g); g.connect(musicGain);
  // Power chord: detuned root pair + fifth
  for (const [semi, det] of [[0, -5], [0, 5], [7, 0]]) {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = f * Math.pow(2, semi / 12);
    o.detune.value = det;
    o.connect(shaper); o.start(t); o.stop(t + dur + 0.02);
  }
}

function mDrone(t, dur) {
  const flt = ctx.createBiquadFilter();
  flt.type = 'lowpass'; flt.frequency.value = 220;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime(0.14, t + 0.03);
  g.gain.setValueAtTime(0.14, t + dur * 0.7);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  flt.connect(g); g.connect(musicGain);
  for (const type of ['sine', 'sawtooth']) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = E2 / 2; // sounds E1 — "Play L.H. an octave lower than written"
    o.connect(flt); o.start(t); o.stop(t + dur + 0.05);
  }
}

function mKick(t, punch = 1) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(125 + 35 * (punch - 1), t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.11);
  g.gain.setValueAtTime(0.6 * punch, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
  o.connect(g); g.connect(musicGain);
  o.start(t); o.stop(t + 0.15);
  if (punch > 1) {
    // beater click so the kick cuts through the wall of bass
    const src = ctx.createBufferSource();
    src.buffer = getNoiseBuf();
    const cg = ctx.createGain();
    cg.gain.setValueAtTime(0.12, t);
    cg.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    src.connect(cg); cg.connect(musicGain);
    src.start(t); src.stop(t + 0.03);
  }
}

function mSnare(t, mult = 1) {
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuf();
  const flt = ctx.createBiquadFilter();
  flt.type = 'bandpass'; flt.frequency.value = 1900 + 400 * (mult - 1); flt.Q.value = 0.8;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.3 * mult, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  src.connect(flt); flt.connect(g); g.connect(musicGain);
  src.start(t); src.stop(t + 0.14);
}

function mCrash(t) {
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuf();
  const flt = ctx.createBiquadFilter();
  flt.type = 'highpass'; flt.frequency.value = 5000;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.16, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
  src.connect(flt); flt.connect(g); g.connect(musicGain);
  src.start(t); src.stop(t + 0.65);
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
  const flt = ctx.createBiquadFilter();
  flt.type = 'lowpass'; flt.frequency.value = 2200;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime(0.12, t + 0.02);
  g.gain.setValueAtTime(0.12, t + dur * 0.6);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  flt.connect(g); g.connect(musicGain);
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 5.5;
  const lfoG = ctx.createGain(); lfoG.gain.value = 25; // Vibrato in Cents
  lfo.connect(lfoG);
  // Square + detuned saw beat against each other for extra bite
  for (const [type, det] of [['square', 0], ['sawtooth', -8]]) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = E4 * Math.pow(2, off / 12);
    o.detune.value = det;
    lfoG.connect(o.detune);
    o.connect(flt);
    o.start(t); o.stop(t + dur + 0.05);
  }
  lfo.start(t); lfo.stop(t + dur + 0.05);
}

function playMusicStep(s, t) {
  const sub = s % 4;        // sixteenth within the beat
  if (s % 16 === 0) mDrone(t, STEP_DUR * 6); // L.H. dotted-quarter E1 on each downbeat
  const r = s % 32;
  const off = RIFF[r];
  // Melodic notes (off != 0) get the accent; the tied B♭ rings out the bar
  if (off !== null) mBass(t, off, off !== 0, r === HELD_STEP ? STEP_DUR * 5 : 0.12);
  if (fightMode) {
    // Double-time assault: driving kicks with gallop pushes, backbeat on 2 & 4
    if (s % 32 === 0) mCrash(t);
    if (s % 8 === 0 || s % 16 === 6 || s % 16 === 14) mKick(t, 1.2);
    if (s % 8 === 4) mSnare(t, 1.3);
    mHat(t, sub === 0 ? 0.06 : 0.03); // sixteenth hats
    if (sub % 2 === 0) {
      const n = LEAD_STEPS[(s >> 1) % 32];
      if (n) mLead(t, n.off, STEP_DUR * 2 * n.dur * 0.95);
    }
  } else {
    // Half-time drums: kick on 1 + and-of-2, snare on 3
    if (s % 16 === 0 || s % 16 === 6) mKick(t);
    if (s % 16 === 8) mSnare(t);
    if (sub % 2 === 0) mHat(t, sub === 0 ? 0.05 : 0.035);
  }
}

// ---------- Epic title theme (slow cinematic loop, E minor) ----------
const T_STEP = 60 / 72 / 2; // eighths at 72 BPM
const T_CHORDS = [0, 8, 10, 6]; // Em, C, D, B♭ power chords (semitones above E2)
// Soaring lead over E4, one phrase across the 4 bars; B♭ brings the dread home.
const T_MEL = (() => {
  const phrase = [
    [0, 6], [3, 1], [5, 1],   // bar 1: long E, G-A pickup
    [7, 4], [8, 2], [7, 2],   // bar 2: B, C, B
    [10, 6], [12, 2],         // bar 3: D rising to high E
    [6, 4], [7, 4],           // bar 4: tritone B♭, resolve to B
  ];
  const steps = []; let i = 0;
  for (const [off, len] of phrase) { steps[i] = { off, dur: len }; i += len; }
  return steps;
})();

let titleTimer = null;
let titleStep = 0;
let titleNextT = 0;

function tPad(t, off, dur = T_STEP * 8) {
  const base = E2 * Math.pow(2, off / 12);
  const flt = ctx.createBiquadFilter();
  flt.type = 'lowpass';
  flt.frequency.setValueAtTime(600, t);
  flt.frequency.linearRampToValueAtTime(1400, t + dur * 0.6);
  flt.frequency.linearRampToValueAtTime(700, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime(0.11, t + 0.7);
  g.gain.setValueAtTime(0.11, t + dur * 0.8);
  g.gain.linearRampToValueAtTime(0.001, t + dur + 0.2);
  flt.connect(g); g.connect(musicGain);
  // Root + fifth + octave, each as a detuned saw pair — wide and heavy
  for (const semi of [0, 7, 12]) {
    for (const det of [-7, 7]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = base * Math.pow(2, semi / 12);
      o.detune.value = det;
      o.connect(flt); o.start(t); o.stop(t + dur + 0.25);
    }
  }
}

function tBass(t, off, dur = T_STEP * 4) {
  const flt = ctx.createBiquadFilter();
  flt.type = 'lowpass'; flt.frequency.value = 300;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime(0.2, t + 0.03);
  g.gain.setValueAtTime(0.2, t + dur * 0.7);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  flt.connect(g); g.connect(musicGain);
  for (const type of ['sine', 'sawtooth']) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = (E2 / 2) * Math.pow(2, off / 12); // sounds around E1
    o.connect(flt); o.start(t); o.stop(t + dur + 0.05);
  }
}

function tTimp(t, vol = 1) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(90, t);
  o.frequency.exponentialRampToValueAtTime(38, t + 0.4);
  g.gain.setValueAtTime(0.55 * vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  o.connect(g); g.connect(musicGain);
  o.start(t); o.stop(t + 0.55);
  // mallet thud
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuf();
  const flt = ctx.createBiquadFilter();
  flt.type = 'lowpass'; flt.frequency.value = 400;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.09 * vol, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  src.connect(flt); flt.connect(ng); ng.connect(musicGain);
  src.start(t); src.stop(t + 0.1);
}

function tLead(t, off, dur) {
  const flt = ctx.createBiquadFilter();
  flt.type = 'lowpass'; flt.frequency.value = 1000;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime(0.09, t + 0.08);
  g.gain.setValueAtTime(0.09, t + dur * 0.75);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  flt.connect(g); g.connect(musicGain);
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 4.2;
  const lfoG = ctx.createGain(); lfoG.gain.value = 14; // gentle vibrato in cents
  lfo.connect(lfoG);
  for (const det of [-5, 5]) { // horn-like detuned saw pair
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = E4 * Math.pow(2, off / 12);
    o.detune.value = det;
    lfoG.connect(o.detune);
    o.connect(flt);
    o.start(t); o.stop(t + dur + 0.05);
  }
  lfo.start(t); lfo.stop(t + dur + 0.05);
}

function playTitleStep(s, t) {
  const bar = (s >> 3) % 4;
  const sub = s % 8;
  if (sub === 0) {
    tPad(t, T_CHORDS[bar]);
    tBass(t, T_CHORDS[bar]);
    tTimp(t, 1);
    if (bar === 0) mCrash(t); // cymbal wash on each loop start
  }
  if (sub === 4) tBass(t, T_CHORDS[bar]);
  // "dum-DUM" timpani pickup into the next chord
  if (sub === 6) tTimp(t, 0.4);
  if (sub === 7) tTimp(t, 0.65);
  const n = T_MEL[s % 32];
  if (n) tLead(t, n.off, T_STEP * n.dur * 0.95);
}

export const music = {
  startTitle() {
    if (!ctx || titleTimer || musicTimer) return;
    if (ctx.state !== 'running') {
      // Autoplay noch gesperrt: Chrome löst das resume()-Promise nach der
      // ersten User-Geste ein — dann von vorn versuchen
      ctx.resume().then(() => this.startTitle()).catch(() => {});
      return;
    }
    ensureMusicGain();
    titleStep = 0;
    titleNextT = ctx.currentTime + 0.1;
    titleTimer = setInterval(() => {
      while (titleNextT < ctx.currentTime + 0.25) {
        playTitleStep(titleStep, titleNextT);
        titleStep = (titleStep + 1) % 32;
        titleNextT += T_STEP;
      }
    }, 60);
  },
  stopTitle() {
    if (titleTimer) { clearInterval(titleTimer); titleTimer = null; }
  },
  start() {
    if (!ctx || musicTimer) return;
    this.stopTitle();
    ensureMusicGain();
    musicStep = 0;
    musicNextT = ctx.currentTime + 0.1;
    musicTimer = setInterval(() => {
      while (musicNextT < ctx.currentTime + 0.18) {
        playMusicStep(musicStep, musicNextT);
        musicStep = (musicStep + 1) % 64;
        musicNextT += STEP_DUR;
      }
    }, 45);
  },
  stop() {
    this.stopTitle();
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    fightMode = false;
  },
  setFight(v) {
    fightMode = v;
    if (ctx && musicGain) {
      // Push the whole mix up a notch during combat
      const t = ctx.currentTime;
      musicGain.gain.cancelScheduledValues(t);
      musicGain.gain.setValueAtTime(musicGain.gain.value, t);
      musicGain.gain.linearRampToValueAtTime(v ? 0.62 : 0.5, t + 0.15);
    }
  },
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
  pickup() {
    tone({ f0: 660, f1: 880, dur: 0.07, type: 'square', vol: 0.12 });
    tone({ f0: 880, f1: 1320, dur: 0.09, type: 'square', vol: 0.12, delay: 0.06 });
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
