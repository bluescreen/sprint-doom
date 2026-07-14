// Office-Deko nach dem 3.BA-Grundriss: Konferenztische, Kickertisch, Aktenregale,
// Küchenzeile, Flügel — alles code-generiert aus Boxen + Canvas-Pixeltexturen.
import * as THREE from 'three';
import { CONFIG } from './config.js';

const T = CONFIG.tileSize;

function ctex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const box = (w, h, d, material) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);

// ---------- geteilte Materialien ----------
const woodMat = new THREE.MeshBasicMaterial({
  map: ctex(32, 32, (g) => {
    g.fillStyle = '#8f8270'; g.fillRect(0, 0, 32, 32);
    g.fillStyle = '#847661';
    for (let y = 3; y < 32; y += 6) g.fillRect(0, y, 32, 1);
    g.fillStyle = '#9a8d7a';
    for (let i = 0; i < 40; i++) g.fillRect((Math.random() * 32) | 0, (Math.random() * 32) | 0, 2, 1);
  }),
});
const darkMat = new THREE.MeshBasicMaterial({ color: 0x23262d });
const midMat = new THREE.MeshBasicMaterial({ color: 0x3c414b });
const chairMat = new THREE.MeshBasicMaterial({ color: 0x2e4a7a }); // dunkelblaues Polster wie im Moodboard
const potMat = new THREE.MeshBasicMaterial({ color: 0x8a4a32 });
const whiteMat = new THREE.MeshBasicMaterial({ color: 0xd8d8d0 });

// ---------- Monitor-Inhalte ----------
function screenTex(kind) {
  return ctex(32, 24, (g) => {
    g.fillStyle = '#0d1117'; g.fillRect(0, 0, 32, 24);
    if (kind === 'code') {
      const colors = ['#39d97d', '#6ab7ff', '#ff42a1', '#8a8f9a', '#ffd76a'];
      for (let y = 2; y < 22; y += 3) {
        const indent = 2 + ((Math.random() * 3) | 0) * 3;
        g.fillStyle = colors[(Math.random() * colors.length) | 0];
        g.fillRect(indent, y, 4 + ((Math.random() * (26 - indent)) | 0), 2);
      }
    } else if (kind === 'chart') {
      g.strokeStyle = '#3a3f4a'; g.strokeRect(2, 2, 28, 20);
      const cols = ['#ff42a1', '#6ab7ff', '#39d97d', '#ffd76a', '#ff42a1', '#6ab7ff'];
      for (let i = 0; i < 6; i++) {
        const h = 3 + ((Math.random() * 14) | 0);
        g.fillStyle = cols[i];
        g.fillRect(4 + i * 4, 21 - h, 3, h);
      }
    } else { // Monitoring
      g.fillStyle = '#1d2330'; g.fillRect(0, 0, 32, 5);
      g.fillStyle = '#39d97d'; g.fillRect(1, 1, 6, 3);
      for (let y = 7; y < 23; y += 4) {
        g.fillStyle = y === 7 ? '#2a3245' : '#181e2a';
        g.fillRect(1, y, 30, 3);
        g.fillStyle = '#5a6478'; g.fillRect(3, y + 1, 12, 1);
      }
    }
  });
}
const monitorMats = ['code', 'chart', 'mail'].map((k) => [
  darkMat, darkMat, darkMat, darkMat,
  new THREE.MeshBasicMaterial({ map: screenTex(k) }),
  darkMat,
]);

// ---------- Möbel-Bausteine ----------
function makeDesk(variant) {
  const gr = new THREE.Group();
  const top = box(3.0, 0.12, 1.3, woodMat); top.position.y = 1.0; gr.add(top);
  const l1 = box(0.08, 1.0, 1.2, midMat); l1.position.set(-1.4, 0.5, 0); gr.add(l1);
  const l2 = box(0.08, 1.0, 1.2, midMat); l2.position.set(1.4, 0.5, 0); gr.add(l2);

  // Monitor (Screen zeigt zur Raumseite, +z)
  const mon = box(0.85, 0.55, 0.05, monitorMats[variant % monitorMats.length]);
  mon.position.set(-0.35, 1.62, -0.35); mon.rotation.x = -0.06; gr.add(mon);
  const stand = box(0.08, 0.3, 0.08, darkMat); stand.position.set(-0.35, 1.2, -0.35); gr.add(stand);
  const base = box(0.4, 0.05, 0.28, darkMat); base.position.set(-0.35, 1.08, -0.35); gr.add(base);
  const kb = box(0.65, 0.05, 0.22, darkMat); kb.position.set(-0.2, 1.09, 0.25); gr.add(kb);

  return gr;
}

function makeChair() {
  const gr = new THREE.Group();
  const seat = box(0.6, 0.08, 0.6, chairMat); seat.position.y = 0.55; gr.add(seat);
  const back = box(0.6, 0.72, 0.07, chairMat); back.position.set(0, 1.0, 0.3); gr.add(back);
  const pole = box(0.08, 0.5, 0.08, darkMat); pole.position.y = 0.27; gr.add(pole);
  const foot = box(0.5, 0.05, 0.5, darkMat); foot.position.y = 0.03; gr.add(foot);
  return gr;
}

function makeConfTable(len, dep) {
  const gr = new THREE.Group();
  const top = box(len, 0.12, dep, woodMat); top.position.y = 1.0; gr.add(top);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const leg = box(0.1, 1.0, 0.1, midMat);
    leg.position.set(sx * (len / 2 - 0.25), 0.5, sz * (dep / 2 - 0.25));
    gr.add(leg);
  }
  return gr;
}

function makeRoundTable() {
  const gr = new THREE.Group();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.1, 10), woodMat);
  top.position.y = 1.0; gr.add(top);
  const pole = box(0.12, 0.95, 0.12, darkMat); pole.position.y = 0.5; gr.add(pole);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 8), darkMat);
  base.position.y = 0.03; gr.add(base);
  return gr;
}

const plantTex = ctex(32, 48, (g) => {
  g.strokeStyle = '#2e6b34'; g.lineWidth = 2;
  for (const [x0, x1] of [[16, 6], [16, 16], [16, 26], [16, 10], [16, 22]]) {
    g.beginPath(); g.moveTo(x0, 46); g.quadraticCurveTo((x0 + x1) / 2, 28, x1, 10); g.stroke();
  }
  const greens = ['#39a34a', '#2e8b3d', '#4dbf5e'];
  for (let i = 0; i < 26; i++) {
    g.fillStyle = greens[(Math.random() * greens.length) | 0];
    const x = 3 + ((Math.random() * 26) | 0), y = 2 + ((Math.random() * 26) | 0);
    g.fillRect(x, y, 3 + ((Math.random() * 4) | 0), 2 + ((Math.random() * 3) | 0));
  }
});
const plantMat = new THREE.MeshBasicMaterial({
  map: plantTex, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide,
});

function makePlant() {
  const gr = new THREE.Group();
  const pot = box(0.45, 0.4, 0.45, potMat); pot.position.y = 0.2; gr.add(pot);
  const p1 = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.6), plantMat);
  p1.position.y = 1.15; gr.add(p1);
  const p2 = p1.clone(); p2.rotation.y = Math.PI / 2; gr.add(p2);
  return gr;
}

function makeCoffeeMachine() {
  const frontTex = ctex(32, 56, (g) => {
    g.fillStyle = '#2a2d34'; g.fillRect(0, 0, 32, 56);
    g.fillStyle = '#c1272d'; g.fillRect(2, 2, 28, 10);
    g.fillStyle = '#fff'; g.font = 'bold 7px monospace'; g.fillText('KAFFEE', 4, 10);
    g.fillStyle = '#0a2a1a'; g.fillRect(6, 16, 20, 8);
    g.fillStyle = '#39d97d'; g.font = '6px monospace'; g.fillText('LEER', 9, 22);
    g.fillStyle = '#454a54'; g.fillRect(8, 28, 16, 16); // Ausgabe-Nische
    g.fillStyle = '#111'; g.fillRect(10, 30, 12, 12);
    g.fillStyle = '#e8e8e8'; g.fillRect(13, 36, 6, 6); // Becher
    g.fillStyle = '#ffd76a'; g.fillRect(4, 48, 4, 4); g.fillRect(12, 48, 4, 4);
    g.fillStyle = '#ff42a1'; g.fillRect(24, 48, 4, 4);
  });
  const m = box(1.0, 1.8, 0.8, [
    midMat, midMat, midMat, midMat,
    new THREE.MeshBasicMaterial({ map: frontTex }),
    midMat,
  ]);
  m.position.y = 0.9;
  const gr = new THREE.Group();
  gr.add(m);
  return gr;
}

// Kickertisch — das Spielfeld aus dem Grundriss, originalgetreu.
const kickerTopMat = new THREE.MeshBasicMaterial({
  map: ctex(48, 32, (g) => {
    g.fillStyle = '#2e8b3d'; g.fillRect(0, 0, 48, 32);
    g.strokeStyle = '#e8e8e2'; g.lineWidth = 1;
    g.strokeRect(2, 2, 44, 28);
    g.beginPath(); g.moveTo(24, 2); g.lineTo(24, 30); g.stroke();
    g.beginPath(); g.arc(24, 16, 5, 0, 7); g.stroke();
    g.strokeRect(2, 10, 6, 12); g.strokeRect(40, 10, 6, 12);
    g.fillStyle = '#fff'; g.fillRect(28, 18, 2, 2); // Ball
  }),
});

function makeKicker() {
  const gr = new THREE.Group();
  const body = box(2.3, 0.35, 1.4, [midMat, midMat, kickerTopMat, midMat, midMat, midMat]);
  body.position.y = 0.95; gr.add(body);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const leg = box(0.14, 0.8, 0.14, darkMat);
    leg.position.set(sx * 0.95, 0.4, sz * 0.55); gr.add(leg);
  }
  const rodMat = new THREE.MeshBasicMaterial({ color: 0x9aa0ac });
  for (let i = 0; i < 6; i++) {
    const rod = box(0.05, 0.05, 2.0, rodMat);
    rod.position.set(-0.75 + i * 0.3, 1.2, 0); gr.add(rod);
    const grip = box(0.09, 0.09, 0.16, i % 2 ? potMat : darkMat);
    grip.position.set(-0.75 + i * 0.3, 1.2, i % 2 ? 1.05 : -1.05); gr.add(grip);
  }
  return gr;
}

// Aktenregal voller Ordner — Archiv FiBu.
function shelfMats() {
  const front = ctex(48, 64, (g) => {
    g.fillStyle = '#3c414b'; g.fillRect(0, 0, 48, 64);
    const spines = ['#c1272d', '#2a4a8a', '#2e8b3d', '#ffd76a', '#ff42a1', '#8a8f9a'];
    for (let row = 0; row < 4; row++) {
      const y = 4 + row * 15;
      g.fillStyle = '#23262d'; g.fillRect(3, y, 42, 13);
      for (let x = 4; x < 44; x += 5) {
        g.fillStyle = spines[(Math.random() * spines.length) | 0];
        g.fillRect(x, y + 1, 4, 11);
        g.fillStyle = '#e8e4d8'; g.fillRect(x + 1, y + 3, 2, 3); // Etikett
      }
    }
  });
  return [midMat, midMat, midMat, midMat, new THREE.MeshBasicMaterial({ map: front }), midMat];
}

function makeShelf(mats) {
  const gr = new THREE.Group();
  const m = box(2.4, 2.6, 0.7, mats);
  m.position.y = 1.3; gr.add(m);
  return gr;
}

// Umzugskartons — Officelager 1.
const cartonMat = new THREE.MeshBasicMaterial({
  map: ctex(32, 32, (g) => {
    g.fillStyle = '#a08050'; g.fillRect(0, 0, 32, 32);
    g.fillStyle = '#8a6c42'; g.fillRect(0, 0, 32, 2); g.fillRect(15, 0, 2, 32);
    g.fillStyle = '#c8b088'; g.fillRect(4, 20, 12, 6); // Etikett
    g.fillStyle = '#6a5432'; g.font = '5px monospace'; g.fillText('dw', 6, 25);
  }),
});

function makeCartonStack() {
  const gr = new THREE.Group();
  let y = 0;
  for (const [w, h] of [[1.1, 0.7], [0.9, 0.6], [0.7, 0.5]]) {
    const c = box(w, h, w, cartonMat);
    c.position.set((Math.random() - 0.5) * 0.15, y + h / 2, (Math.random() - 0.5) * 0.15);
    c.rotation.y = (Math.random() - 0.5) * 0.4;
    gr.add(c);
    y += h;
    if (Math.random() < 0.35) break;
  }
  return gr;
}

// Küchenzeile mit Arbeitsplatte und Spüle.
function makeCounter(len) {
  const gr = new THREE.Group();
  const base = box(len, 0.95, 0.7, whiteMat); base.position.y = 0.48; gr.add(base);
  const top = box(len + 0.08, 0.06, 0.78, darkMat); top.position.y = 0.99; gr.add(top);
  const sink = box(0.8, 0.02, 0.5, midMat); sink.position.set(-len / 4, 1.03, 0); gr.add(sink);
  return gr;
}

// Der Flügel im Flügelraum. Selbstverständlich.
const pianoMat = new THREE.MeshBasicMaterial({ color: 0x16181d });
function makePiano() {
  const gr = new THREE.Group();
  const body = box(2.5, 0.5, 1.4, pianoMat); body.position.y = 1.05; gr.add(body);
  const keybed = box(1.6, 0.18, 0.4, pianoMat); keybed.position.set(-0.45, 0.86, 0.85); gr.add(keybed);
  const keys = box(1.5, 0.06, 0.3, whiteMat); keys.position.set(-0.45, 0.98, 0.85); gr.add(keys);
  for (const [sx, sz] of [[-1.05, 0.5], [1.05, 0.5], [0, -0.55]]) {
    const leg = box(0.12, 0.85, 0.12, pianoMat);
    leg.position.set(sx, 0.43, sz); gr.add(leg);
  }
  return gr;
}

// Lounge-Möbel nach Moodboard: Koralle-Sessel, orangefarbener Hocker.
const coralMat = new THREE.MeshBasicMaterial({ color: 0xe8734a });
const orangeMat = new THREE.MeshBasicMaterial({ color: 0xe05a28 });

function makeLoungeChair() {
  const gr = new THREE.Group();
  const seat = box(1.4, 0.45, 0.9, coralMat); seat.position.y = 0.42; gr.add(seat);
  const back = box(1.4, 0.7, 0.22, coralMat); back.position.set(0, 0.9, 0.36); gr.add(back);
  const arm1 = box(0.2, 0.3, 0.9, coralMat); arm1.position.set(-0.62, 0.75, 0); gr.add(arm1);
  const arm2 = box(0.2, 0.3, 0.9, coralMat); arm2.position.set(0.62, 0.75, 0); gr.add(arm2);
  return gr;
}

function makeStool() {
  const gr = new THREE.Group();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.5, 8), orangeMat);
  top.position.y = 0.25; gr.add(top);
  return gr;
}

// Wandmonitor mit dw-pinker Check-in-Folie („Wie geht es dir?").
function makeWallScreen() {
  const tex = ctex(64, 40, (g) => {
    g.fillStyle = '#ff42a1'; g.fillRect(0, 0, 64, 40);
    g.fillStyle = '#fff'; g.font = 'bold 8px monospace';
    g.fillText('Wie geht', 5, 15);
    g.fillText('es dir?', 5, 25);
    g.fillRect(44, 6, 15, 20); // Folien-Karte
    g.fillStyle = '#ff42a1';
    g.fillRect(46, 9, 11, 2); g.fillRect(46, 13, 8, 2); g.fillRect(46, 17, 10, 2);
    g.fillStyle = '#fff'; g.font = 'bold 6px monospace'; g.fillText('dw', 5, 36);
  });
  const gr = new THREE.Group();
  const frame = box(2.7, 1.6, 0.08, darkMat); frame.position.y = 2.4; gr.add(frame);
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(2.55, 1.45),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  screen.position.set(0, 2.4, 0.05);
  gr.add(screen);
  return gr;
}

// Wandfeuerlöscher — die roten Icons aus dem Grundriss.
const extinguisherMat = new THREE.MeshBasicMaterial({ color: 0xc1272d });
function makeExtinguisher() {
  const gr = new THREE.Group();
  const body = box(0.22, 0.5, 0.2, extinguisherMat); body.position.y = 1.05; gr.add(body);
  const neck = box(0.08, 0.12, 0.08, darkMat); neck.position.y = 1.36; gr.add(neck);
  return gr;
}

// Mainframe-Schrank (Technikraum) — Bandlaufwerke + Blinkenlights.
const mainframeMats = (() => {
  const front = ctex(48, 112, (g) => {
    g.fillStyle = '#3c414b'; g.fillRect(0, 0, 48, 112);
    g.fillStyle = '#2a2d34'; g.fillRect(2, 2, 44, 108);
    // Bandlaufwerke oben
    for (const cx of [14, 34]) {
      g.fillStyle = '#16181d'; g.beginPath(); g.arc(cx, 18, 10, 0, 7); g.fill();
      g.strokeStyle = '#6a6f7a'; g.lineWidth = 2;
      g.beginPath(); g.arc(cx, 18, 6, 0, 7); g.stroke();
      g.fillStyle = '#8a8f9a'; g.fillRect(cx - 1, 17, 2, 2);
    }
    // Blinkenlights
    const cols = ['#39d97d', '#c1272d', '#ffb000', '#1a1d22', '#1a1d22', '#6ab7ff'];
    for (let y = 38; y < 78; y += 6)
      for (let x = 6; x < 42; x += 6) {
        g.fillStyle = cols[(Math.random() * cols.length) | 0];
        g.fillRect(x, y, 3, 3);
      }
    // Schalterreihe + Lüftung unten
    g.fillStyle = '#8a8f9a';
    for (let x = 8; x < 40; x += 8) g.fillRect(x, 84, 4, 6);
    g.fillStyle = '#16181d';
    for (let y = 96; y < 108; y += 3) g.fillRect(6, y, 36, 1);
  });
  return [midMat, midMat, darkMat, darkMat, new THREE.MeshBasicMaterial({ map: front }), midMat];
})();

function makeMainframe() {
  const gr = new THREE.Group();
  const m = box(1.1, 2.8, 0.9, mainframeMats);
  m.position.y = 1.4; gr.add(m);
  return gr;
}

// ---------- denkwerk-Deck-Deko: Markenfarben, Formen und Statement-Art ----------
const DW = {
  yellow: '#ffe449', gold: '#ffd932', coral: '#ff644e', magenta: '#ff42a1',
  violet: '#bd95ff', olive: '#697d55', cream: '#f5f0eb', blue: '#2e67ff',
};

// Skulpturen wie die Section-Slides des Masters: Würfel, Pyramide, Zylinder.
function makeSculpture(kind) {
  const gr = new THREE.Group();
  const pedestal = box(1.0, 1.0, 1.0, whiteMat);
  pedestal.position.y = 0.5; gr.add(pedestal);
  const mat = (c) => new THREE.MeshBasicMaterial({ color: c });
  let m;
  if (kind === 'cube') {
    m = box(0.75, 0.75, 0.75, mat(0xffe449));
    m.position.y = 1.42; m.rotation.y = 0.5;
  } else if (kind === 'pyramid') {
    m = new THREE.Mesh(new THREE.ConeGeometry(0.58, 0.95, 4), mat(0xff42a1));
    m.position.y = 1.48; m.rotation.y = 0.3;
  } else {
    m = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.9, 10), mat(0xbd95ff));
    m.position.y = 1.45;
  }
  gr.add(m);
  return gr;
}

// Wandbilder im Deck-Look: Statement mit Marker, Phasen-Rauten, Präsenz-Matrix, Cover-Shape.
function brandPosterTex(kind) {
  return ctex(96, 128, (g) => {
    const diamond = (cx, cy, r, color) => {
      g.fillStyle = color;
      g.beginPath();
      g.moveTo(cx, cy - r); g.lineTo(cx + r, cy); g.lineTo(cx, cy + r); g.lineTo(cx - r, cy);
      g.closePath(); g.fill();
    };
    g.fillStyle = kind === 'olive' ? DW.olive : DW.cream;
    g.fillRect(0, 0, 96, 128);
    g.textAlign = 'left';
    if (kind === 'statement') {
      g.fillStyle = DW.yellow; g.fillRect(8, 50, 66, 15); // Marker hinter dem Wort
      g.fillStyle = '#000'; g.font = 'bold 15px monospace';
      g.fillText('einfach', 10, 46);
      g.fillText('digital.', 10, 62);
      g.font = 'bold 8px monospace'; g.fillText('denkwerk', 10, 116);
    } else if (kind === 'olive') {
      g.fillStyle = '#fff'; g.font = 'bold 14px monospace';
      g.fillText('erst', 10, 48);
      g.fillText('denken,', 10, 64);
      g.fillText('dann', 10, 80);
      g.fillText('werken.', 10, 96);
      g.font = 'bold 8px monospace'; g.fillText('dw', 10, 118);
    } else if (kind === 'phases') {
      g.fillStyle = '#000'; g.font = 'bold 10px monospace'; g.fillText('PHASEN', 10, 18);
      g.strokeStyle = '#5e5e5e'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(14, 64); g.lineTo(82, 64); g.stroke();
      diamond(24, 64, 11, DW.violet);
      diamond(48, 64, 11, DW.gold);
      diamond(72, 64, 11, DW.coral);
      g.fillStyle = '#000'; g.font = '7px monospace';
      g.fillText('plan', 15, 90); g.fillText('build', 37, 90); g.fillText('ship', 63, 90);
    } else if (kind === 'matrix') {
      g.fillStyle = '#000'; g.font = 'bold 10px monospace'; g.fillText('MATRIX', 10, 18);
      for (let r = 0; r < 5; r++)
        for (let c = 0; c < 4; c++) {
          const x = 18 + c * 18, y = 36 + r * 16;
          const filled = (r + c) % 3 !== 0;
          if ((r === 2 && c === 1) || (r === 0 && c === 3)) {
            g.fillStyle = DW.magenta;
            g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill();
          } else if (filled) {
            g.fillStyle = '#000';
            g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill();
          } else {
            g.strokeStyle = '#000'; g.lineWidth = 1.5;
            g.beginPath(); g.arc(x, y, 5, 0, 7); g.stroke();
          }
        }
    } else { // cover
      g.fillStyle = DW.coral;
      g.beginPath(); g.moveTo(0, 128); g.lineTo(0, 58); g.lineTo(64, 128); g.closePath(); g.fill();
      g.fillStyle = DW.blue;
      g.beginPath(); g.arc(76, 30, 14, 0, 7); g.fill();
      g.fillStyle = '#000'; g.font = 'bold 13px monospace';
      g.fillText('SPRINT', 10, 26);
      g.fillText('42', 10, 42);
      g.font = 'bold 7px monospace'; g.fillText('Kickoff · 3.BA', 10, 54);
    }
    // Rahmen
    g.strokeStyle = '#3a3d45'; g.lineWidth = 3; g.strokeRect(1, 1, 94, 126);
  });
}

function makeBrandPoster(kind, w = 2.2, h = 2.9) {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: brandPosterTex(kind) })
  );
}

// ---------- Poster ----------
function posterTex(variant) {
  return ctex(96, 128, (g) => {
    g.fillStyle = '#e8e4d8'; g.fillRect(0, 0, 96, 128);
    g.strokeStyle = '#3a3d45'; g.lineWidth = 4; g.strokeRect(2, 2, 92, 124);
    g.fillStyle = '#1a1a1a'; g.font = 'bold 9px monospace'; g.textAlign = 'center';
    if (variant === 0) { // Burndown
      g.fillText('BURNDOWN', 48, 16);
      g.strokeStyle = '#8a8f9a'; g.lineWidth = 1;
      g.strokeRect(12, 24, 72, 70);
      g.strokeStyle = '#c1272d'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(14, 30); g.lineTo(34, 48); g.lineTo(50, 46);
      g.lineTo(62, 70); g.lineTo(72, 40); g.stroke();
      g.fillStyle = '#c1272d'; g.font = 'bold 8px monospace';
      g.fillText('TAG 9: PANIK', 48, 110);
    } else if (variant === 1) { // Meeting
      g.font = 'bold 10px monospace';
      g.fillText('DIESES', 48, 30);
      g.fillText('MEETING', 48, 44);
      g.fillText('HÄTTE EINE', 48, 58);
      g.fillText('E-MAIL', 48, 72);
      g.fillText('SEIN KÖNNEN', 48, 86);
      g.fillStyle = '#ff42a1'; g.fillRect(20, 98, 56, 3);
    } else if (variant === 2) { // Kanban
      g.fillText('KANBAN', 48, 16);
      const cols = ['TODO', 'DOING', 'DONE'];
      cols.forEach((c, i) => {
        const x = 8 + i * 28;
        g.fillStyle = '#c8c4b8'; g.fillRect(x, 24, 24, 88);
        g.fillStyle = '#1a1a1a'; g.font = 'bold 6px monospace'; g.fillText(c, x + 12, 32);
        const notes = i === 0 ? 5 : i === 1 ? 3 : 0;
        for (let n = 0; n < notes; n++) {
          g.fillStyle = ['#ffd76a', '#7dd8ff', '#ffb3c1'][n % 3];
          g.fillRect(x + 3, 38 + n * 14, 18, 10);
        }
      });
      g.fillStyle = '#c1272d'; g.font = 'bold 7px monospace'; g.fillText('DONE: GÄHNENDE LEERE', 48, 122);
    } else if (variant === 3) { // denkwerk
      g.fillStyle = '#ff42a1'; g.fillRect(6, 6, 84, 116);
      g.fillStyle = '#fff'; g.font = 'bold 22px monospace';
      g.fillText('dw', 48, 62);
      g.font = 'bold 9px monospace';
      g.fillText('denkwerk', 48, 84);
      g.font = '7px monospace';
      g.fillText('est. 1998', 48, 98);
    } else { // Ship it
      g.fillText('SHIP IT!', 48, 20);
      g.fillStyle = '#3c414b';
      g.fillRect(42, 40, 12, 34); // Rakete
      g.beginPath(); g.moveTo(42, 40); g.lineTo(48, 26); g.lineTo(54, 40); g.fill();
      g.fillStyle = '#6ab7ff'; g.fillRect(45, 48, 6, 6);
      g.fillStyle = '#ffd76a';
      g.beginPath(); g.moveTo(44, 74); g.lineTo(48, 90); g.lineTo(52, 74); g.fill();
      g.fillStyle = '#1a1a1a'; g.font = 'bold 7px monospace';
      g.fillText('FREITAG 17:59 UHR', 48, 112);
    }
  });
}

function makePoster(variant, w = 2.2, h = 2.9) {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: posterTex(variant) })
  );
}

const whiteboardTex = ctex(160, 96, (g) => {
  g.fillStyle = '#e8e8e2'; g.fillRect(0, 0, 160, 96);
  g.strokeStyle = '#9a9a94'; g.lineWidth = 6; g.strokeRect(0, 0, 160, 96);
  g.fillStyle = '#2a4a8a'; g.font = 'bold 13px monospace';
  g.fillText('SPRINT 42:', 14, 26);
  g.fillStyle = '#c1272d'; g.font = 'bold 16px monospace';
  g.fillText('NICHT STERBEN!', 14, 50);
  g.strokeStyle = '#c1272d'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(14, 58); g.lineTo(140, 58); g.stroke();
  g.fillStyle = '#2e8b3d'; g.font = '11px monospace';
  g.fillText('velocity 25-35 ✓', 14, 78);
  // Magnet-Punkte
  g.fillStyle = '#ff42a1'; g.beginPath(); g.arc(146, 14, 5, 0, 7); g.fill();
  g.fillStyle = '#6ab7ff'; g.beginPath(); g.arc(146, 82, 5, 0, 7); g.fill();
});

function makeWhiteboard() {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 2.16),
    new THREE.MeshBasicMaterial({ map: whiteboardTex })
  );
}

// ---------- Platzierung (Koordinaten in Welt-Einheiten, T = 4) ----------
export function buildProps(scene, level) {
  const add = (obj, x, z, ry = 0) => {
    obj.position.x = x;
    obj.position.z = z;
    obj.rotation.y = ry;
    scene.add(obj);
  };
  const blockAt = (x, z) => level.block(Math.floor(x / T), Math.floor(z / T));

  const chair = (x, z, ry) =>
    add(makeChair(), x + (Math.random() - 0.5) * 0.4, z, ry + (Math.random() - 0.5) * 0.7);

  const wallPlane = (mesh, x, y, z, ry = 0) => {
    mesh.position.set(x, y, z);
    mesh.rotation.y = ry;
    scene.add(mesh);
  };

  // ---------- Konferenzraum 1: lange Doppeltafel, 10 Plätze ----------
  add(makeConfTable(5.6, 2.4), 23.2, 60);
  add(makeConfTable(5.6, 2.4), 28.8, 60);
  for (let c = 5; c <= 7; c++) { level.block(c, 14); level.block(c, 15); }
  for (const x of [21.5, 24.3, 27.1, 29.9]) { chair(x, 57.4, Math.PI); chair(x, 62.6, 0); }
  chair(18.9, 60, -Math.PI / 2); chair(33.1, 60, Math.PI / 2);
  wallPlane(makeWhiteboard(), 4.06, 2.2, 60, Math.PI / 2);
  wallPlane(makePoster(0), 47.94, 2.6, 62, -Math.PI / 2);
  add(makePlant(), 6.5, 73); add(makePlant(), 45.5, 73.5);

  // Runder blauer Teppich wie im Moodboard
  const blueRug = (x, z, r = 2.8) => {
    const rim = new THREE.Mesh(new THREE.CircleGeometry(r, 20), new THREE.MeshBasicMaterial({ color: 0x2452b8 }));
    rim.rotation.x = -Math.PI / 2; rim.position.set(x, 0.02, z); scene.add(rim);
    const inner = new THREE.Mesh(new THREE.CircleGeometry(r - 0.3, 20), new THREE.MeshBasicMaterial({ color: 0x2b5fd9 }));
    inner.rotation.x = -Math.PI / 2; inner.position.set(x, 0.03, z); scene.add(inner);
  };

  // ---------- Besprechungsräume 1 + 2: runder Tisch, 4 Plätze ----------
  for (const [cx, col] of [[62, 15], [86, 21]]) {
    blueRug(cx, 61);
    add(makeRoundTable(), cx, 61);
    level.block(col, 14); level.block(col, 15);
    chair(cx, 58.2, Math.PI); chair(cx, 63.8, 0);
    chair(cx - 2.7, 61, -Math.PI / 2); chair(cx + 2.7, 61, Math.PI / 2);
  }
  wallPlane(makePoster(1), 52.06, 2.4, 66, Math.PI / 2);
  wallPlane(makePoster(2), 95.94, 2.4, 66, -Math.PI / 2);
  add(makePlant(), 69.3, 73.2); add(makePlant(), 93.4, 73.2);

  // ---------- Workshopraum: Arbeitstisch, Whiteboard, Sideboard ----------
  add(makeConfTable(4.8, 2.2), 112, 61);
  level.block(27, 14); level.block(27, 15); level.block(28, 14); level.block(28, 15);
  chair(110.5, 58.6, Math.PI); chair(113.5, 58.6, Math.PI);
  chair(110.5, 63.4, 0); chair(113.5, 63.4, 0);
  wallPlane(makeWhiteboard(), 135.94, 2.2, 60, -Math.PI / 2);
  add(makeShelf(shelfMats()), 126, 48.9); level.block(31, 12);
  wallPlane(makePoster(4), 100.06, 2.4, 56, Math.PI / 2);
  add(makePlant(), 103, 73.4); add(makePlant(), 133, 50);

  // ---------- Konferenzraum 2: zwei Tische, Sideboard ----------
  add(makeConfTable(5.6, 2.4), 158, 57.5);
  add(makeConfTable(5.6, 2.4), 158, 64.5);
  for (let c = 38; c <= 40; c++) { level.block(c, 14); level.block(c, 16); }
  for (const x of [155.8, 158, 160.2]) { chair(x, 54.9, Math.PI); chair(x, 67.1, 0); }
  chair(154.6, 61, -Math.PI / 2); chair(161.4, 61, Math.PI / 2);
  add(makeShelf(shelfMats()), 141, 60, Math.PI / 2); level.block(35, 14); level.block(35, 15);
  wallPlane(makePoster(3), 175.94, 2.4, 56, -Math.PI / 2);
  add(makePlant(), 173.4, 73.2);

  // ---------- Flügelraum ----------
  add(makePiano(), 188, 64, -0.6);
  level.block(46, 15); level.block(47, 15); level.block(46, 16); level.block(47, 16);
  add(makePlant(), 181.5, 73);

  // ---------- Technikraum: Mainframes + Admin-Platz ----------
  for (const x of [7, 10, 13]) { add(makeMainframe(), x, 4.6); blockAt(x, 4.6); }
  add(makeMainframe(), 27.4, 10, -Math.PI / 2); level.block(6, 2);
  add(makeMainframe(), 27.4, 14, -Math.PI / 2); level.block(6, 3);
  add(makeDesk(0), 12, 20.6, Math.PI); level.block(2, 5); level.block(3, 5);
  chair(12, 18.8, 0);
  add(makePlant(), 25.5, 21);

  // ---------- Kickerraum ----------
  add(makeKicker(), 42, 14); level.block(10, 3);
  wallPlane(makePoster(4), 32.06, 2.4, 14, Math.PI / 2);
  add(makePlant(), 50, 6);

  // ---------- Archiv FiBu: Ordnerregale ----------
  for (const x of [60, 64, 68]) add(makeShelf(shelfMats()), x, 4.6);
  for (let c = 14; c <= 17; c++) level.block(c, 1);
  for (const x of [62, 70]) add(makeShelf(shelfMats()), x, 27.4, Math.PI);
  level.block(15, 6); level.block(17, 6);
  add(makeCartonStack(), 74, 6.5); level.block(18, 1);

  // ---------- Officelager 1: Kartons + Regal ----------
  add(makeShelf(shelfMats()), 92, 4.6); level.block(22, 1); level.block(23, 1);
  for (const [x, z] of [[83, 6], [86.5, 5.5], [83, 10.5], [97, 6.5], [95, 20.5]]) {
    add(makeCartonStack(), x, z);
    blockAt(x, z);
  }
  add(makePlant(), 98, 21);

  // ---------- Küche 2: Zeile + Kaffeemaschine ----------
  add(makeCounter(6), 105.3, 11, Math.PI / 2); level.block(26, 2); level.block(26, 3);
  add(makeCoffeeMachine(), 105.4, 17.5, Math.PI / 2); level.block(26, 4);

  // ---------- Lounge/Küche (offen zur Konfizone) ----------
  // L-förmige Küchenzeile in der Nordost-Ecke + Kaffeemaschine
  add(makeCounter(8), 162, 4.55); level.block(39, 1); level.block(40, 1); level.block(41, 1);
  add(makeCounter(3), 170.9, 6.1, Math.PI / 2); level.block(42, 1);
  add(makeCoffeeMachine(), 170.6, 9.5, -Math.PI / 2); level.block(42, 2);
  // Drei lange Tische direkt neben der Küche — wie im Grundriss gestapelt
  for (const z of [6.8, 11.2, 15.6]) {
    add(makeConfTable(8, 1.8), 147, z);
    for (let c = 35; c <= 37; c++) level.block(c, Math.floor(z / T));
  }
  for (const x of [144, 147, 150]) { chair(x, 9.1, Math.PI); chair(x, 13.5, 0); }
  add(makePlant(), 122.5, 21); add(makePlant(), 126, 5.5);

  // Lounge-Ecke nach Moodboard: orangefarbener Teppich, Koralle-Sessel, Hocker, Screen
  const orangeRug = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 5),
    new THREE.MeshBasicMaterial({
      map: ctex(64, 36, (g) => {
        g.fillStyle = '#e05a28'; g.fillRect(0, 0, 64, 36);
        g.strokeStyle = '#b8431a'; g.lineWidth = 2; // Muster wie im Foto
        for (let i = -1; i < 5; i++) {
          g.beginPath(); g.moveTo(i * 16, 36); g.lineTo(i * 16 + 14, 0); g.stroke();
        }
        g.strokeStyle = '#f07a48';
        g.beginPath(); g.moveTo(6, 36); g.lineTo(26, 0); g.stroke();
      }),
    })
  );
  orangeRug.rotation.x = -Math.PI / 2;
  orangeRug.position.set(163, 0.02, 17.5);
  scene.add(orangeRug);
  add(makeLoungeChair(), 161, 19.5, Math.PI + 0.25); level.block(40, 4);
  add(makeLoungeChair(), 165.5, 17, -Math.PI / 2 - 0.2); level.block(41, 4);
  add(makeStool(), 161.5, 15.8);
  add(makeWallScreen(), 171.9, 15.5, -Math.PI / 2);

  // Wandfeuerlöscher — Positionen aus dem Grundriss
  for (const [x, z, ry] of [
    [34, 32.3, 0],          // Konfizone, Nordwand
    [177.2, 35.7, Math.PI], // Konfizone, Pfeiler am Flügelraum (wie im Plan)
    [17, 4.4, 0],           // Technikraum
    [195.7, 33, -Math.PI / 2], // Ostflur am Exit
  ]) add(makeExtinguisher(), x, z, ry);

  // ---------- Konfizone: Deck-Art + Poster an der Nordwand, Pflanzen an der Glasfront ----------
  wallPlane(makePoster(1), 14, 2.4, 32.06);
  wallPlane(makeBrandPoster('statement'), 46, 2.4, 32.06);
  wallPlane(makePoster(0), 60, 2.4, 32.06);
  wallPlane(makeBrandPoster('phases'), 94, 2.4, 32.06);
  wallPlane(makeBrandPoster('matrix'), 114, 2.4, 32.06);
  for (const [x, z] of [[50, 34.9], [98, 34.9], [146, 34.9], [10, 33.4]]) add(makePlant(), x, z);

  // Skulpturen wie auf den Section-Slides: Pyramide, Würfel, Zylinder
  add(makeSculpture('pyramid'), 6, 34.2); level.block(1, 8);
  add(makeSculpture('cube'), 138, 15.5); level.block(34, 3);
  add(makeSculpture('cylinder'), 190.5, 33.6); level.block(47, 8);

  // Statement-Art in Lounge und Konferenzraum 1
  wallPlane(makeBrandPoster('olive'), 171.9, 2.4, 21, -Math.PI / 2);
  wallPlane(makeBrandPoster('cover'), 4.06, 2.4, 66, Math.PI / 2);
}
