// Canvas-generierte Pixeltexturen — keine externen Assets.
import * as THREE from 'three';

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function speckle(g, w, h, n, colors) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = colors[(Math.random() * colors.length) | 0];
    g.fillRect((Math.random() * w) | 0, (Math.random() * h) | 0, 1, 1);
  }
}

export function makeWallTexture() {
  return canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = '#454a54'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 420, ['#3d424b', '#4c515c', '#40454f', '#515763']);
    // Paneelfugen
    g.fillStyle = '#30343c';
    g.fillRect(0, 0, w, 2); g.fillRect(0, 31, w, 2); g.fillRect(0, 62, w, 2);
    g.fillRect(0, 0, 2, h); g.fillRect(31, 0, 2, h);
    // Kanten-Highlights
    g.fillStyle = '#565c68';
    g.fillRect(2, 2, w - 4, 1); g.fillRect(2, 33, w - 4, 1);
    // Nieten
    g.fillStyle = '#666d7a';
    for (const [x, y] of [[5, 5], [26, 5], [37, 5], [58, 5], [5, 36], [26, 36], [37, 36], [58, 36], [5, 27], [58, 27], [5, 58], [58, 58]]) {
      g.fillRect(x, y, 2, 2);
    }
  });
}

export function makeFloorTexture() {
  return canvasTex(64, 64, (g, w, h) => {
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        g.fillStyle = (x + y) % 2 ? '#2b292f' : '#312e35';
        g.fillRect(x * 8, y * 8, 8, 8);
      }
    }
    speckle(g, w, h, 350, ['#26242a', '#37343d', '#2e2b32']);
  });
}

export function makeCeilingTexture() {
  return canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = '#1d1c23'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#141319';
    g.fillRect(0, 0, w, 1); g.fillRect(0, 32, w, 1);
    g.fillRect(0, 0, 1, h); g.fillRect(32, 0, 1, h);
    speckle(g, w, h, 150, ['#191820', '#211f28']);
    // Neonröhre in Panelmitte
    g.fillStyle = '#4a4a58'; g.fillRect(12, 14, 40, 4);
    g.fillStyle = '#8b8ba8'; g.fillRect(14, 15, 36, 2);
  });
}

export function makeDoorTexture() {
  return canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = '#565b66'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 250, ['#4c515b', '#5f6570', '#525761']);
    // Mittelfuge + Rahmen
    g.fillStyle = '#33373f';
    g.fillRect(30, 0, 4, h);
    g.fillRect(0, 0, 3, h); g.fillRect(61, 0, 3, h);
    g.fillRect(0, 0, w, 3);
    // Warnstreifen unten
    for (let x = 0; x < w; x += 8) {
      g.fillStyle = '#d8b021'; g.fillRect(x, 52, 4, 12);
      g.fillStyle = '#16161a'; g.fillRect(x + 4, 52, 4, 12);
    }
    // rote Statusleuchte
    g.fillStyle = '#7a1a1a'; g.fillRect(14, 8, 6, 6);
    g.fillStyle = '#e04040'; g.fillRect(15, 9, 4, 4);
    g.fillStyle = '#7a1a1a'; g.fillRect(44, 8, 6, 6);
    g.fillStyle = '#e04040'; g.fillRect(45, 9, 4, 4);
  });
}

export function makeBoardTexture(tickets) {
  return canvasTex(512, 208, (g, w, h) => {
    g.fillStyle = '#20242c'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#0f1116'; g.fillRect(0, 0, w, 6); g.fillRect(0, h - 6, w, 6);
    g.fillRect(0, 0, 6, h); g.fillRect(w - 6, 0, 6, h);
    // Header
    g.fillStyle = '#e6007e'; g.fillRect(6, 6, w - 12, 30);
    g.fillStyle = '#fff';
    g.font = 'bold 18px monospace'; g.textBaseline = 'middle';
    g.fillText('denkwerk · SPRINT 42 PLANNING', 16, 22);
    // Spaltenköpfe
    g.font = 'bold 12px monospace';
    g.fillStyle = '#9aa0ac';
    g.fillText('BACKLOG — DIESE TICKETS WARTEN AUF DICH:', 16, 50);
    // Tickets als Sticky Notes
    const colors = ['#ffd76a', '#7dd8ff', '#a4ff9a', '#ffb3c1', '#e0a4ff'];
    (tickets || []).forEach((t, i) => {
      const x = 16 + (i % 3) * 165, y = 62 + Math.floor(i / 3) * 68;
      g.fillStyle = colors[i % colors.length];
      g.fillRect(x, y, 152, 58);
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x + 62, y, 28, 8);
      g.fillStyle = '#1a1a1a';
      g.font = 'bold 11px monospace';
      g.fillText(t.code, x + 8, y + 15);
      g.font = '10px monospace';
      const words = t.title.split(' ');
      let line = '', ly = y + 30;
      for (const wd of words) {
        if ((line + wd).length > 22) { g.fillText(line, x + 8, ly); line = wd + ' '; ly += 11; }
        else line += wd + ' ';
      }
      g.fillText(line.trim(), x + 8, ly);
      g.font = 'bold 10px monospace';
      g.fillText(`${t.min}–${t.max} SP?`, x + 92, y + 15);
    });
  });
}
