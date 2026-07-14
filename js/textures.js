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

// Weißer Altbau-Putz mit Sockelleiste — wie im Moodboard der Etage.
export function makeWallTexture() {
  return canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = '#ddd9d2'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 300, ['#d6d2cb', '#e3dfd8', '#d0ccc5', '#e0dcd5']);
    // dezenter Schatten unter der Decke
    g.fillStyle = 'rgba(150,146,140,0.3)'; g.fillRect(0, 0, w, 2);
    g.fillStyle = 'rgba(150,146,140,0.15)'; g.fillRect(0, 2, w, 2);
    // Gebrauchsspuren
    g.fillStyle = 'rgba(170,166,158,0.35)';
    g.fillRect(9, 44, 14, 1); g.fillRect(38, 50, 10, 1); g.fillRect(52, 30, 1, 8);
    // Sockelleiste
    g.fillStyle = '#4a4d55'; g.fillRect(0, 58, w, 6);
    g.fillStyle = '#5c606a'; g.fillRect(0, 58, w, 1);
  });
}

// Warmgrauer geschliffener Estrich, wolkig mit hellen Schleifspuren — nach floor.png.
export function makeFloorTexture() {
  return canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = '#6e675e'; g.fillRect(0, 0, w, h);
    // dunklere Wolken
    g.fillStyle = 'rgba(72,66,59,0.40)';
    for (const [x, y, r] of [[10, 16, 12], [46, 10, 9], [28, 40, 14], [58, 52, 10], [4, 56, 8]]) {
      g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
    // hellere Schleier
    g.fillStyle = 'rgba(148,140,128,0.30)';
    for (const [x, y, r] of [[26, 12, 8], [54, 30, 10], [12, 42, 7], [40, 58, 9]]) {
      g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
    speckle(g, w, h, 380, ['#665f56', '#766e64', '#6a6359', '#71695f']);
    // helle Kratzer und Flecken
    g.fillStyle = 'rgba(180,172,158,0.35)';
    g.fillRect(14, 50, 5, 1); g.fillRect(44, 22, 4, 1); g.fillRect(30, 8, 1, 3);
    g.fillRect(8, 30, 2, 2); g.fillRect(52, 44, 2, 2);
  });
}

// Sichtbeton-Decke mit Lüftungsrohr, Neonröhre und Sprinkler.
export function makeCeilingTexture() {
  return canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = '#8e8e94'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 300, ['#86868c', '#96969c', '#8a8a90']);
    // Schalungsfugen
    g.fillStyle = '#7a7a80'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h);
    // Lüftungsrohr entlang einer Kante (kachelt zur durchgehenden Trasse)
    g.fillStyle = '#6f6f76'; g.fillRect(0, 4, w, 10);
    g.fillStyle = '#9b9ba2'; g.fillRect(0, 5, w, 3);
    g.fillStyle = '#5f5f66'; g.fillRect(0, 13, w, 1);
    g.fillStyle = '#55555c'; g.fillRect(30, 4, 3, 10); // Rohrschelle
    // Neonröhre in Panelmitte
    g.fillStyle = '#b8b8c4'; g.fillRect(14, 36, 36, 5);
    g.fillStyle = '#eceef8'; g.fillRect(16, 37, 32, 3);
    // Sprinkler
    g.fillStyle = '#c1272d'; g.fillRect(52, 46, 3, 3);
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

// Außenfenster: Nachtblick über Köln — Dom-Silhouette, erleuchtete Nachbarhäuser.
export function makeWindowTexture() {
  return canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = '#0a1226'; g.fillRect(0, 0, w, h); // Glas
    g.fillStyle = '#101a36'; g.fillRect(0, 0, w, 20); // Himmel-Stufen
    g.fillStyle = '#0d1530'; g.fillRect(0, 20, w, 14);
    g.fillStyle = '#cdd6ff';
    for (let i = 0; i < 12; i++) g.fillRect(5 + ((Math.random() * 54) | 0), 4 + ((Math.random() * 20) | 0), 1, 1);
    // Dom
    g.fillStyle = '#060a18';
    g.fillRect(10, 26, 5, 20); g.fillRect(19, 26, 5, 20);
    g.beginPath(); g.moveTo(10, 26); g.lineTo(12.5, 15); g.lineTo(15, 26); g.fill();
    g.beginPath(); g.moveTo(19, 26); g.lineTo(21.5, 15); g.lineTo(24, 26); g.fill();
    g.fillRect(14, 33, 6, 13);
    // Nachbarhäuser mit Licht
    g.fillStyle = '#0a0f20';
    g.fillRect(36, 42, 11, 18); g.fillRect(48, 38, 12, 22); g.fillRect(4, 48, 12, 12);
    g.fillStyle = '#ffd76a';
    for (const [x, y] of [[38, 45], [42, 45], [38, 51], [50, 41], [54, 45], [56, 41], [50, 51], [6, 51], [10, 55]]) g.fillRect(x, y, 2, 2);
    g.fillStyle = 'rgba(160,190,255,0.10)'; g.fillRect(6, 6, 9, 48); // Reflex
    // Fensterkreuz + Rahmen
    g.fillStyle = '#30343c'; g.fillRect(29, 0, 4, h); g.fillRect(0, 30, w, 4);
    g.fillStyle = '#3c414b';
    g.fillRect(0, 0, w, 3); g.fillRect(0, 61, w, 3); g.fillRect(0, 0, 3, h); g.fillRect(61, 0, 3, h);
  });
}

// Glastrennwand Konfizone ↔ Meetingraum: echt transparent, nur Rahmen,
// Sprosse und ein satinierter Streifen auf Augenhöhe.
export function makeGlassTexture() {
  return canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = 'rgba(190,205,220,0.10)'; g.fillRect(0, 0, w, h); // leichte Tönung
    g.fillStyle = 'rgba(235,242,250,0.10)'; // Reflexstreifen
    g.fillRect(8, 0, 7, h); g.fillRect(42, 0, 4, h);
    g.fillStyle = 'rgba(225,232,240,0.30)'; g.fillRect(0, 26, w, 5); // Satinband
    g.fillStyle = '#2a2d34';
    g.fillRect(0, 0, w, 3); g.fillRect(0, 61, w, 3); g.fillRect(0, 0, 3, h); g.fillRect(61, 0, 3, h);
    g.fillStyle = '#3c414b'; g.fillRect(30, 0, 3, h);
  });
}

// Tonnengewölbe über der Konfizone: weißer Putz, Gurtbogen alle 4 m — nach bow.png.
export function makeVaultTexture() {
  return canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = '#e6e2db'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 200, ['#ded9d2', '#ece8e1', '#e0dcd5']);
    // Schattierung zum Gewölbeansatz hin (u-Ränder = Kämpferlinien)
    g.fillStyle = 'rgba(150,146,140,0.25)';
    g.fillRect(0, 0, 6, h); g.fillRect(w - 6, 0, 6, h);
    g.fillStyle = 'rgba(150,146,140,0.12)';
    g.fillRect(6, 0, 6, h); g.fillRect(w - 12, 0, 6, h);
    // Gurtbogen (Rippe)
    g.fillStyle = '#cdc8c0'; g.fillRect(0, 0, w, 4);
    g.fillStyle = '#b5b0a8'; g.fillRect(0, 4, w, 1);
  });
}

// Glasschiebetür: echt transparent, Sicherheitsstreifen + Griffstangen.
export function makeGlassDoorTexture() {
  return canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = 'rgba(190,205,220,0.12)'; g.fillRect(0, 0, w, h); // leichte Tönung
    g.fillStyle = 'rgba(235,242,250,0.10)'; g.fillRect(10, 0, 6, h); // Reflex
    // Sicherheitsstreifen auf Augenhöhe
    g.fillStyle = 'rgba(240,244,250,0.55)'; g.fillRect(0, 24, w, 3);
    g.fillStyle = 'rgba(240,244,250,0.35)'; g.fillRect(0, 30, w, 2);
    // Rahmen + Mittelfuge + Griffstangen
    g.fillStyle = '#23262d';
    g.fillRect(0, 0, w, 3); g.fillRect(0, 61, w, 3); g.fillRect(0, 0, 3, h); g.fillRect(61, 0, 3, h);
    g.fillRect(30, 0, 4, h);
    g.fillStyle = '#c8ccd4'; g.fillRect(26, 20, 2, 18); g.fillRect(36, 20, 2, 18);
  });
}

// Türschild im dw-Look (Deck-Palette: Schwarz, Weiß, Marker-Gelb).
export function makeSignTexture(text, { bg = '#101010', fg = '#ffffff', accent = '#ffe449' } = {}) {
  return canvasTex(256, 40, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = accent; g.fillRect(0, 0, 6, h);
    g.strokeStyle = '#0f1116'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
    g.fillStyle = fg; g.textBaseline = 'middle'; g.textAlign = 'center';
    let size = 22;
    do { g.font = `bold ${size--}px monospace`; } while (g.measureText(text).width > w - 24 && size > 8);
    g.fillText(text, w / 2 + 3, h / 2 + 1);
  });
}

export function makeBoardTexture(tickets) {
  return canvasTex(512, 208, (g, w, h) => {
    g.fillStyle = '#20242c'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#0f1116'; g.fillRect(0, 0, w, 6); g.fillRect(0, h - 6, w, 6);
    g.fillRect(0, 0, 6, h); g.fillRect(w - 6, 0, 6, h);
    // Header
    g.fillStyle = '#ff42a1'; g.fillRect(6, 6, w - 12, 30);
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
