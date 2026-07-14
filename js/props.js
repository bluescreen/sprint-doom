// Office-Deko: Schreibtische mit PCs, Stühle, Pflanzen, Poster, Kaffeemaschine —
// alles code-generiert aus Boxen + Canvas-Pixeltexturen.
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
const chairMat = new THREE.MeshBasicMaterial({ color: 0x1c1e24 });
const potMat = new THREE.MeshBasicMaterial({ color: 0x8a4a32 });
const whiteMat = new THREE.MeshBasicMaterial({ color: 0xd8d8d0 });

// ---------- Monitor-Inhalte ----------
function screenTex(kind) {
  return ctex(32, 24, (g) => {
    g.fillStyle = '#0d1117'; g.fillRect(0, 0, 32, 24);
    if (kind === 'code') {
      const colors = ['#39d97d', '#6ab7ff', '#e6007e', '#8a8f9a', '#ffd76a'];
      for (let y = 2; y < 22; y += 3) {
        const indent = 2 + ((Math.random() * 3) | 0) * 3;
        g.fillStyle = colors[(Math.random() * colors.length) | 0];
        g.fillRect(indent, y, 4 + ((Math.random() * (26 - indent)) | 0), 2);
      }
    } else if (kind === 'chart') {
      g.strokeStyle = '#3a3f4a'; g.strokeRect(2, 2, 28, 20);
      const cols = ['#e6007e', '#6ab7ff', '#39d97d', '#ffd76a', '#e6007e', '#6ab7ff'];
      for (let i = 0; i < 6; i++) {
        const h = 3 + ((Math.random() * 14) | 0);
        g.fillStyle = cols[i];
        g.fillRect(4 + i * 4, 21 - h, 3, h);
      }
    } else if (kind === 'mail') {
      g.fillStyle = '#1d2330'; g.fillRect(0, 0, 32, 5);
      g.fillStyle = '#e6007e'; g.fillRect(1, 1, 6, 3);
      for (let y = 7; y < 23; y += 4) {
        g.fillStyle = y === 7 ? '#2a3245' : '#181e2a';
        g.fillRect(1, y, 30, 3);
        g.fillStyle = '#5a6478'; g.fillRect(3, y + 1, 12, 1);
      }
    } else { // 404
      g.fillStyle = '#c1272d'; g.fillRect(0, 0, 32, 6);
      g.fillStyle = '#ffd76a'; g.font = 'bold 10px monospace';
      g.fillText('404', 7, 17);
    }
  });
}
const screenKinds = ['code', 'chart', 'mail', 'code', '404', 'chart'];
const monitorMats = screenKinds.map((k) => [
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

  // zweiter Monitor für jeden zweiten Platz (Entwickler!)
  if (variant % 2 === 0) {
    const mon2 = box(0.85, 0.55, 0.05, monitorMats[(variant + 1) % monitorMats.length]);
    mon2.position.set(0.6, 1.62, -0.35); mon2.rotation.y = -0.18; mon2.rotation.x = -0.06;
    gr.add(mon2);
    const stand2 = box(0.08, 0.3, 0.08, darkMat); stand2.position.set(0.6, 1.2, -0.35); gr.add(stand2);
  }

  const kb = box(0.65, 0.05, 0.22, darkMat); kb.position.set(-0.2, 1.09, 0.25); gr.add(kb);

  // PC-Tower mit Power-LED
  const tower = box(0.38, 0.75, 0.6, midMat); tower.position.set(1.05, 0.38, 0.15); gr.add(tower);
  const led = box(0.05, 0.05, 0.02, new THREE.MeshBasicMaterial({ color: 0x39d97d }));
  led.position.set(0.95, 0.62, 0.46); gr.add(led);

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
    g.fillStyle = '#e6007e'; g.fillRect(24, 48, 4, 4);
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
      g.fillStyle = '#e6007e'; g.fillRect(20, 98, 56, 3);
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
      g.fillStyle = '#e6007e'; g.fillRect(6, 6, 84, 116);
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
  g.fillStyle = '#e6007e'; g.beginPath(); g.arc(146, 14, 5, 0, 7); g.fill();
  g.fillStyle = '#6ab7ff'; g.beginPath(); g.arc(146, 82, 5, 0, 7); g.fill();
});

// ---------- CONTROL-Style: Terminal-Bullpens + Mainframes (instanziert) ----------
const crtBodyMat = new THREE.MeshBasicMaterial({
  map: ctex(32, 32, (g) => {
    g.fillStyle = '#b0a890'; g.fillRect(0, 0, 32, 32); // Retro-Beige
    g.fillStyle = '#9e9680';
    for (let y = 24; y < 32; y += 3) g.fillRect(4, y, 24, 1); // Lüftungsschlitze
    g.fillStyle = '#c0b8a0'; g.fillRect(0, 0, 32, 2);
  }),
});

function crtScreenTex(kind) {
  return ctex(24, 20, (g) => {
    if (kind === 0) { // grünes Terminal
      g.fillStyle = '#041406';
      g.fillRect(0, 0, 24, 20);
      g.fillStyle = '#39d97d';
      for (let y = 2; y < 16; y += 3) g.fillRect(2, y, 3 + ((Math.random() * 16) | 0), 1);
      g.fillRect(2, 17, 3, 2); // Cursor
    } else if (kind === 1) { // Amber-Terminal
      g.fillStyle = '#140e02'; g.fillRect(0, 0, 24, 20);
      g.fillStyle = '#ffb000';
      for (let y = 2; y < 18; y += 3) g.fillRect(2 + ((Math.random() * 4) | 0), y, 2 + ((Math.random() * 14) | 0), 1);
    } else { // dw-Screensaver
      g.fillStyle = '#1a0210'; g.fillRect(0, 0, 24, 20);
      g.fillStyle = '#e6007e'; g.font = 'bold 9px monospace';
      g.fillText('dw', 6, 13);
    }
  });
}
const crtScreenMats = [0, 1, 2].map((k) => [
  darkMat, darkMat, darkMat, darkMat,
  new THREE.MeshBasicMaterial({ map: crtScreenTex(k) }),
  darkMat,
]);

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

function buildBullpens(scene, level, areas) {
  // Platzierungen einsammeln
  const desks = []; // {x, z, ry, kind}
  const cabinets = []; // {x, z, ry}

  for (const a of areas) {
    // zwei Doppelreihen (Rücken an Rücken) pro Fläche
    const bands = [
      { zA: 18.0, zB: 19.6, rows: [4, 5] },
      { zA: 48.4, zB: 50.0, rows: [11, 12] },
    ];
    const span = (a.n - 1) * 4.4 + 3;
    const off = (a.w - span) / 2 + 1.5;
    for (const b of bands) {
      for (let i = 0; i < a.n; i++) {
        const x = a.x0 + off + i * 4.4;
        desks.push({ x, z: b.zA, ry: Math.PI, kind: (desks.length % 3) });
        desks.push({ x, z: b.zB, ry: 0, kind: (desks.length % 3) });
        for (const row of b.rows) {
          level.block(Math.floor((x - 1.5) / T), row);
          level.block(Math.floor((x + 1.5) / T), row);
        }
      }
    }
    // Mainframes an den Seitenwänden (Korridor-Zeilen 7–9 bleiben frei)
    for (const z of a.westCabs || []) cabinets.push({ x: a.x0 + 0.62, z, ry: Math.PI / 2 });
    for (const z of a.eastCabs || []) cabinets.push({ x: a.x0 + a.w - 0.62, z, ry: -Math.PI / 2 });
  }
  for (const c of cabinets) level.block(Math.floor(c.x / T), Math.floor(c.z / T));

  // ---------- InstancedMeshes ----------
  const Y = new THREE.Vector3(0, 1, 0);
  const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
  const _v = new THREE.Vector3(), _p = new THREE.Vector3();
  const _m = new THREE.Matrix4(), _s = new THREE.Vector3(1, 1, 1);
  const mk = (w, h, d, material, count) => {
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(w, h, d), material, count);
    scene.add(im);
    return im;
  };
  const inst = (im, idx, dx, dz, ry, lx, ly, lz, lry = 0) => {
    _q.setFromAxisAngle(Y, ry);
    _v.set(lx, 0, lz).applyQuaternion(_q);
    _p.set(dx + _v.x, ly, dz + _v.z);
    _q2.setFromAxisAngle(Y, ry + lry);
    _m.compose(_p, _q2, _s);
    im.setMatrixAt(idx, _m);
  };

  const N = desks.length;
  const kindCount = [0, 0, 0];
  for (const d of desks) kindCount[d.kind]++;

  const tops = mk(3.0, 0.12, 1.3, woodMat, N);
  const legs = mk(0.08, 1.0, 1.2, midMat, N * 2);
  const crts = mk(0.72, 0.62, 0.66, crtBodyMat, N);
  const screens = crtScreenMats.map((m, k) => mk(0.52, 0.42, 0.05, m, kindCount[k]));
  const kbs = mk(0.55, 0.05, 0.22, darkMat, N);
  const seats = mk(0.6, 0.08, 0.6, chairMat, N);
  const backs = mk(0.6, 0.72, 0.07, chairMat, N);
  const poles = mk(0.08, 0.55, 0.08, darkMat, N);

  const sIdx = [0, 0, 0];
  desks.forEach((d, i) => {
    inst(tops, i, d.x, d.z, d.ry, 0, 1.0, 0);
    inst(legs, i * 2, d.x, d.z, d.ry, -1.4, 0.5, 0);
    inst(legs, i * 2 + 1, d.x, d.z, d.ry, 1.4, 0.5, 0);
    inst(crts, i, d.x, d.z, d.ry, 0, 1.37, -0.22);
    inst(screens[d.kind], sIdx[d.kind]++, d.x, d.z, d.ry, 0, 1.39, 0.13);
    inst(kbs, i, d.x, d.z, d.ry, 0, 1.09, 0.42);
    const cdx = (Math.random() - 0.5) * 0.5, cry = (Math.random() - 0.5) * 1.1;
    inst(seats, i, d.x, d.z, d.ry, cdx, 0.55, 1.5, cry);
    inst(backs, i, d.x, d.z, d.ry, cdx, 1.0, 1.8, cry);
    inst(poles, i, d.x, d.z, d.ry, cdx, 0.27, 1.5, cry);
  });

  const cabs = new THREE.InstancedMesh(new THREE.BoxGeometry(1.1, 2.8, 0.9), mainframeMats, cabinets.length);
  scene.add(cabs);
  cabinets.forEach((c, i) => {
    _q.setFromAxisAngle(Y, c.ry);
    _p.set(c.x, 1.4, c.z);
    _m.compose(_p, _q, _s);
    cabs.setMatrixAt(i, _m);
  });
}

// ---------- Platzierung ----------
export function buildProps(scene, level) {
  const add = (obj, x, z, ry = 0) => {
    obj.position.x = x;
    obj.position.z = z;
    obj.rotation.y = ry;
    scene.add(obj);
  };

  let variant = 0;

  // Eine Schreibtischreihe an der Nord- oder Südwand eines Raums
  function deskRow(x0Tile, cols, north) {
    const z = north ? 2.3 * T : 14.7 * T;
    const chairZ = north ? z + 1.7 : z - 1.7;
    const ry = north ? 0 : Math.PI;
    const row = north ? 2 : 14;
    for (const c of cols) {
      const x = (x0Tile + c) * T;
      add(makeDesk(variant++), x, z, ry);
      const chair = makeChair();
      add(chair, x - 0.3 + Math.random() * 0.6, chairZ, ry + (Math.random() - 0.5) * 0.9);
      level.block(Math.floor(x / T) - 1, row);
      level.block(Math.floor(x / T), row);
    }
  }

  // ---------- Intro-Raum (Spalten 1–10) ----------
  deskRow(1, [3, 6.2], true);
  deskRow(1, [3, 6.2], false);
  add(makeCoffeeMachine(), 1.6 * T, 11.5 * T, Math.PI / 2);
  level.block(1, 11);
  add(makePlant(), 1.6 * T, 3.2 * T);
  add(makePlant(), 9.4 * T, 12.8 * T);
  // Whiteboard an der Südwand
  const wb = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 2.16),
    new THREE.MeshBasicMaterial({ map: whiteboardTex })
  );
  wb.position.set(6 * T, 2.2, 15 * T - 0.06);
  wb.rotation.y = Math.PI;
  scene.add(wb);

  // ---------- Ticket-Räume ----------
  for (const room of level.rooms) {
    const rx = room.x0;
    deskRow(rx, [2.5, 5.8, 9.1], true);
    deskRow(rx, [3.5, 8.3], false);
    add(makePlant(), (rx + 0.7) * T, 3.2 * T);
    add(makePlant(), (rx + 11.3) * T, 13.8 * T);
    // Poster an der Nordwand über den Tischen
    const poster = makePoster(room.index % 5);
    poster.position.set((rx + 7.5) * T, 2.6, 2 * T + 0.06);
    scene.add(poster);
    // zweites Poster an der Südwand
    const poster2 = makePoster((room.index + 2) % 5);
    poster2.position.set((rx + 6) * T, 2.6, 15 * T - 0.06);
    poster2.rotation.y = Math.PI;
    scene.add(poster2);
  }

  // ---------- CONTROL-Halle: Terminal-Bullpens + Mainframes ----------
  const areas = [
    // Intro-Raum (Spalten 1–10)
    { x0: 1 * T, w: 10 * T, n: 7, westCabs: [16, 52] },
  ];
  for (const room of level.rooms) {
    areas.push({
      x0: room.x0 * T,
      w: 12 * T,
      n: 9,
      westCabs: [13, 23, 45, 55],
      eastCabs: [13, 23, 45, 55],
    });
  }
  buildBullpens(scene, level, areas);
}
