// Code-generierte Pixelart-Sprites: der Kunde, Waffe, HUD-Gesichter, Ausreden-Projektile.
import * as THREE from 'three';

const C = {
  suit: '#23262e', suitLight: '#2f333d', shirt: '#e8e8e8', tie: '#c1272d',
  skin: '#e0b08c', skinShade: '#c99a76', hair: '#5a5a64', shoe: '#101014',
  pants: '#1c1e26', mouth: '#5a2020', case: '#6b4a2f', caseDark: '#523823',
};

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function toTex(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------- Der Kunde (48x64) ----------
function drawCustomer(g, pose) {
  const P = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  g.clearRect(0, 0, 48, 64);
  const attack = pose === 'attack';
  const walk1 = pose === 'walk1', walk2 = pose === 'walk2';

  // Beine + Schuhe
  if (walk1) {
    P(15, 44, 5, 16, C.pants); P(28, 44, 5, 16, C.pants);
    P(13, 60, 7, 3, C.shoe); P(28, 60, 7, 3, C.shoe);
  } else if (walk2) {
    P(18, 44, 5, 16, C.pants); P(25, 44, 5, 16, C.pants);
    P(17, 60, 7, 3, C.shoe); P(24, 60, 7, 3, C.shoe);
  } else {
    P(17, 44, 5, 16, C.pants); P(26, 44, 5, 16, C.pants);
    P(15, 60, 7, 3, C.shoe); P(26, 60, 7, 3, C.shoe);
  }

  // Torso (Anzug)
  P(14, 20, 20, 24, C.suit);
  P(14, 20, 2, 24, C.suitLight); P(32, 20, 2, 24, C.suitLight);
  // Hemd + Krawatte
  P(21, 20, 6, 12, C.shirt);
  P(23, 21, 2, 10, C.tie); P(22, 20, 4, 2, C.tie);

  // linker Arm (mit Aktenkoffer)
  P(9, 21, 4, 16, C.suit); P(9, 37, 4, 3, C.skin);
  P(4, 40, 11, 9, C.case); P(4, 40, 11, 2, C.caseDark); P(8, 38, 3, 2, C.caseDark);

  // rechter Arm: normal unten, beim Angriff erhoben mit Zeigefinger
  if (attack) {
    P(35, 10, 4, 12, C.suit);
    P(35, 7, 4, 4, C.skin);
    P(36, 4, 2, 4, C.skin); // Zeigefinger
  } else {
    P(35, 21, 4, 16, C.suit); P(35, 37, 4, 3, C.skin);
  }

  // Kopf
  P(18, 6, 12, 12, C.skin);
  P(18, 13, 12, 1, C.skinShade);
  P(17, 4, 14, 3, C.hair); P(17, 6, 2, 5, C.hair); P(29, 6, 2, 5, C.hair);
  // wütende Brauen + Augen
  P(19, 9, 4, 1, '#2a2a2a'); P(22, 10, 1, 1, '#2a2a2a');
  P(25, 10, 1, 1, '#2a2a2a'); P(25, 9, 4, 1, '#2a2a2a');
  P(20, 11, 2, 2, '#1a1a1a'); P(26, 11, 2, 2, '#1a1a1a');
  // Mund: zu / offen brüllend
  if (attack) { P(21, 14, 6, 3, C.mouth); P(22, 14, 4, 1, '#e8e8e8'); }
  else P(21, 15, 6, 1, C.mouth);

  // Krawattennadel-Glanz
  P(23, 24, 1, 1, '#ffd76a');
}

function drawCustomerDead(g) {
  const P = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  g.clearRect(0, 0, 48, 64);
  // liegender Kunde unten im Frame
  P(2, 50, 12, 11, C.skin);                       // Kopf links
  P(1, 49, 3, 12, C.hair); P(2, 48, 12, 3, C.hair);
  P(5, 53, 3, 1, '#1a1a1a'); P(10, 53, 3, 1, '#1a1a1a'); // X-Augen
  P(6, 52, 1, 3, '#1a1a1a'); P(11, 52, 1, 3, '#1a1a1a');
  P(6, 57, 5, 1, C.mouth);
  P(14, 51, 22, 10, C.suit);                      // Torso
  P(16, 52, 8, 3, C.shirt); P(18, 52, 2, 8, C.tie);
  P(36, 52, 10, 4, C.pants); P(36, 57, 10, 4, C.pants); // Beine
  P(45, 51, 3, 5, C.shoe); P(45, 57, 3, 5, C.shoe);
  // Sternchen überm Kopf
  P(6, 40, 2, 2, '#ffd76a'); P(14, 36, 2, 2, '#ffd76a'); P(20, 42, 2, 2, '#ffd76a');
}

export function makeCustomerTextures() {
  const frames = {};
  for (const pose of ['idle', 'walk1', 'walk2', 'attack', 'hit']) {
    const c = makeCanvas(48, 64);
    const g = c.getContext('2d');
    drawCustomer(g, pose === 'hit' ? 'idle' : pose);
    if (pose === 'hit') {
      g.globalCompositeOperation = 'source-atop';
      g.fillStyle = 'rgba(255,255,255,0.65)';
      g.fillRect(0, 0, 48, 64);
    }
    frames[pose] = toTex(c);
  }
  const d = makeCanvas(48, 64);
  drawCustomerDead(d.getContext('2d'));
  frames.dead = toTex(d);
  return frames;
}

// ---------- Ausreden-Sprechblasen ----------
const excuseCache = new Map();
export function getExcuseMaterial(text) {
  if (excuseCache.has(text)) return excuseCache.get(text);
  const c = makeCanvas(180, 80);
  const g = c.getContext('2d');
  // Blase
  g.fillStyle = '#f4f4f4';
  g.strokeStyle = '#111';
  g.lineWidth = 4;
  g.beginPath();
  g.roundRect(4, 4, 172, 56, 10);
  g.fill(); g.stroke();
  // Schwänzchen
  g.beginPath();
  g.moveTo(30, 58); g.lineTo(18, 76); g.lineTo(48, 58);
  g.closePath(); g.fill();
  g.strokeStyle = '#111';
  g.beginPath(); g.moveTo(30, 59); g.lineTo(18, 76); g.lineTo(48, 59); g.stroke();
  // Text (max 3 Zeilen)
  g.fillStyle = '#111';
  g.font = 'bold 15px monospace';
  g.textAlign = 'center';
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + w).length > 18 && line) { lines.push(line.trim()); line = ''; }
    line += w + ' ';
  }
  lines.push(line.trim());
  const y0 = 32 - (lines.length - 1) * 8;
  lines.forEach((l, i) => g.fillText(l, 90, y0 + i * 16));
  const mat = new THREE.SpriteMaterial({ map: toTex(c), transparent: true });
  excuseCache.set(text, mat);
  return mat;
}

// ---------- Waffe: Argumentator 9000 (DOM-Canvas 96x72) ----------
export function drawWeapon(g, firing) {
  const P = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  g.clearRect(0, 0, 96, 72);
  const oy = firing ? 5 : 0; // Rückstoß

  // Mündungsflash
  if (firing) {
    P(40, 2, 12, 12, '#fff8d0');
    P(36, 6, 20, 4, '#ffd76a');
    P(44, 0, 4, 18, '#ffd76a');
    P(30, 4, 4, 3, '#ff9a3c'); P(60, 4, 4, 3, '#ff9a3c');
  }

  // Megafon-Trichter
  P(34, 14 + oy, 24, 6, '#31353e');
  P(30, 20 + oy, 32, 6, '#454a54');
  P(32, 21 + oy, 28, 1, '#666d7a');
  // Gerätekörper
  P(34, 26 + oy, 28, 22, '#575d68');
  P(34, 26 + oy, 28, 3, '#6a7180');
  P(34, 45 + oy, 28, 3, '#3a3e46');
  // Display
  P(38, 31 + oy, 10, 7, '#0a2a1a');
  P(39, 32 + oy, 8, 2, '#39d97d');
  P(39, 35 + oy, 5, 2, '#39d97d');
  // roter Knopf + Label
  P(52, 31 + oy, 6, 6, '#7a1a1a'); P(53, 32 + oy, 4, 4, '#e04040');
  g.fillStyle = '#ffd76a'; g.font = 'bold 7px monospace';
  g.fillText('A9K', 40, 45 + oy);
  // Antenne
  P(60, 8 + oy, 2, 18, '#31353e'); P(59, 5 + oy, 4, 4, '#e6007e');

  // Griff + Hand
  P(42, 48 + oy, 12, 14, '#2f333d');
  P(38, 54 + oy, 20, 12, '#e0b08c');
  P(38, 54 + oy, 20, 2, '#c99a76');
  P(40, 66 + oy, 18, 6, '#3a3020'); // Ärmel
}

// ---------- HUD-Gesichter (32x32) ----------
function drawFace(g, state) {
  const P = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  g.clearRect(0, 0, 32, 32);
  P(0, 0, 32, 32, '#14151a');
  // denkwerk-Shirt
  P(6, 26, 20, 6, '#e6007e');
  P(13, 27, 6, 3, '#fff');
  // Kopf
  P(8, 4, 16, 20, C.skin);
  P(8, 20, 16, 2, C.skinShade);
  P(7, 2, 18, 4, '#3a2c1e'); P(7, 5, 2, 4, '#3a2c1e'); P(23, 5, 2, 4, '#3a2c1e');

  if (state === 'dead') {
    P(11, 11, 3, 1, '#111'); P(12, 10, 1, 3, '#111');
    P(18, 11, 3, 1, '#111'); P(19, 10, 1, 3, '#111');
    P(13, 18, 6, 2, C.mouth);
  } else if (state === 'grin') {
    P(11, 10, 3, 2, '#111'); P(18, 10, 3, 2, '#111');
    P(12, 16, 8, 3, '#fff'); P(11, 16, 1, 2, C.mouth); P(20, 16, 1, 2, C.mouth);
  } else if (state === 'sad') {
    P(11, 11, 3, 2, '#111'); P(18, 11, 3, 2, '#111');
    P(10, 9, 4, 1, '#3a2c1e'); P(18, 9, 4, 1, '#3a2c1e');
    P(13, 19, 6, 1, C.mouth); P(12, 20, 1, 1, C.mouth); P(19, 20, 1, 1, C.mouth);
  } else if (state === 'hurt') {
    P(11, 11, 3, 1, '#111'); P(18, 11, 3, 1, '#111');
    P(12, 17, 8, 2, '#fff'); P(12, 17, 8, 1, C.mouth);
    P(9, 6, 2, 5, '#c1272d'); P(21, 14, 2, 4, '#c1272d'); // Kratzer
  } else if (state === 'worried') {
    P(11, 11, 2, 2, '#111'); P(19, 11, 2, 2, '#111');
    P(10, 9, 4, 1, '#3a2c1e'); P(18, 9, 4, 1, '#3a2c1e');
    P(13, 18, 6, 1, C.mouth);
  } else { // ok
    P(11, 10, 3, 2, '#111'); P(18, 10, 3, 2, '#111');
    P(12, 17, 8, 2, C.mouth); P(13, 17, 6, 1, '#fff');
  }
}

export function makeFaces() {
  const faces = {};
  for (const s of ['ok', 'worried', 'hurt', 'grin', 'sad', 'dead']) {
    const c = makeCanvas(32, 32);
    drawFace(c.getContext('2d'), s);
    faces[s] = c;
  }
  return faces;
}
