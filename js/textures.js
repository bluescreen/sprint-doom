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

// Dunkler polierter Gussboden, fast schwarz mit warmen Wolken und Glanzschleiern —
// nach den Fotos der Etage (references/material): der Boden ist deutlich dunkler als floor.png.
export function makeFloorTexture() {
  return canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = '#38332e'; g.fillRect(0, 0, w, h);
    // dunklere Wolken
    g.fillStyle = 'rgba(32,29,26,0.45)';
    for (const [x, y, r] of [[10, 16, 12], [46, 10, 9], [28, 40, 14], [58, 52, 10], [4, 56, 8]]) {
      g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
    // warme Glanzschleier (Deckenlicht spiegelt sich im polierten Boden)
    g.fillStyle = 'rgba(92,82,70,0.30)';
    for (const [x, y, r] of [[26, 12, 8], [54, 30, 10], [12, 42, 7], [40, 58, 9]]) {
      g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
    speckle(g, w, h, 380, ['#332e29', '#3d3832', '#36312c', '#403a34']);
    // helle Kratzer und Flecken
    g.fillStyle = 'rgba(120,110,96,0.30)';
    g.fillRect(14, 50, 5, 1); g.fillRect(44, 22, 4, 1); g.fillRect(30, 8, 1, 3);
    g.fillRect(8, 30, 2, 2); g.fillRect(52, 44, 2, 2);
  });
}

// Weiß verputzte Decke der Meetingräume — glatt, mit dezenten Spots (Fotos: weiße
// Decke mit Pendelleuchten statt Sichtbeton).
export function makePlasterCeilingTexture() {
  return canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = '#e7e3dc'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 180, ['#dfdbd4', '#eeeae3', '#e3dfd8']);
    g.fillStyle = 'rgba(150,146,140,0.18)'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h);
    // Einbauspot
    g.fillStyle = '#c9c4bc'; g.fillRect(30, 30, 5, 5);
    g.fillStyle = '#fff7e0'; g.fillRect(31, 31, 3, 3);
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

// Glastrennwand Konfizone ↔ Meetingraum: echt transparent, rahmenlos gestoßen,
// mit den schwarzen Diagonallinien-Decals aus dem Wandbild-Motiv (Fotos/Video).
export function makeGlassTexture() {
  return canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = 'rgba(190,205,220,0.10)'; g.fillRect(0, 0, w, h); // leichte Tönung
    g.fillStyle = 'rgba(235,242,250,0.10)'; // Reflexstreifen
    g.fillRect(8, 0, 7, h); g.fillRect(42, 0, 4, h);
    // Decal-Linien (Motiv der Murals läuft über das Glas weiter)
    g.strokeStyle = 'rgba(20,20,24,0.9)'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(-4, 44); g.lineTo(52, 18); g.stroke();
    g.beginPath(); g.moveTo(14, 58); g.lineTo(68, 34); g.stroke();
    g.beginPath(); g.moveTo(30, 10); g.lineTo(64, 26); g.stroke();
    g.fillStyle = '#2a2d34';
    g.fillRect(0, 0, w, 2); g.fillRect(0, 62, w, 2);
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

// Glasschiebetür der Meetingräume: rahmenlos, Decal-Linien wie auf den Trennwänden,
// lange Edelstahl-Griffstangen — nach Fotos IMG…080533 / Video-Frames.
export function makeGlassDoorTexture() {
  return canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = 'rgba(190,205,220,0.12)'; g.fillRect(0, 0, w, h); // leichte Tönung
    g.fillStyle = 'rgba(235,242,250,0.10)'; g.fillRect(10, 0, 6, h); // Reflex
    // Decal-Linien wie auf den Trennwänden
    g.strokeStyle = 'rgba(20,20,24,0.9)'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(0, 20); g.lineTo(28, 30); g.stroke();
    g.beginPath(); g.moveTo(36, 40); g.lineTo(64, 30); g.stroke();
    // Mittelfuge + lange Griffstangen (Edelstahl)
    g.fillStyle = '#23262d';
    g.fillRect(0, 0, w, 2); g.fillRect(0, 62, w, 2); g.fillRect(31, 0, 2, h);
    g.fillStyle = '#c8ccd4'; g.fillRect(26, 10, 2, 40); g.fillRect(36, 10, 2, 40);
  });
}

// Helle Ahorn-Schiebetür der Meetingräume: Scheunentor-Prinzip auf Laufschiene,
// lange Edelstahl-Griffstange — nach Foto IMG…080554 und Video.
export function makeWoodDoorTexture() {
  return canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = '#c1934f'; g.fillRect(0, 0, w, h);
    // vertikale Furnierbahnen
    for (let x = 0; x < w; x += 9) {
      g.fillStyle = x % 18 === 0 ? '#b8894a' : '#c79a58';
      g.fillRect(x, 0, 9, h);
      g.fillStyle = 'rgba(120,84,38,0.35)'; g.fillRect(x, 0, 1, h);
    }
    speckle(g, w, h, 160, ['#bd8e4d', '#cb9d5c', '#b2853f']);
    // Laufschiene + Rollenbeschläge oben
    g.fillStyle = '#2a2d34'; g.fillRect(0, 0, w, 3);
    g.fillStyle = '#43464e'; g.fillRect(8, 3, 4, 4); g.fillRect(52, 3, 4, 4);
    // lange Edelstahl-Griffstange links
    g.fillStyle = '#9aa0aa'; g.fillRect(10, 12, 2, 42);
    g.fillStyle = '#d5dae2'; g.fillRect(10, 12, 1, 42);
    g.fillStyle = '#6a6f78'; g.fillRect(9, 16, 4, 2); g.fillRect(9, 48, 4, 2);
  });
}

// Mattschwarzer Wandblock (Workshopraum-Front zur Konfizone) — Träger des dunklen Murals.
export function makeDarkWallTexture() {
  return canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = '#1a1a1f'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 200, ['#17171c', '#1e1e24', '#1c1c21']);
    g.fillStyle = 'rgba(255,255,255,0.04)'; g.fillRect(0, 0, w, 2);
    g.fillStyle = '#0e0e12'; g.fillRect(0, 60, w, 4); // Sockel
  });
}

// Wandbild im Stil der Etage: zwei geometrische Figuren (Blau/Ocker/Weiß) im
// Streitgespräch, Kritzel-Wolke + Strahlen. 'dark' = schwarzer Grund (Konfizone),
// 'light' = weißer Grund (Konferenzraum 2) — nach den Mural-Fotos.
export function makeMuralTexture(variant = 'dark') {
  const dark = variant === 'dark';
  const bg = dark ? '#16161a' : '#efece6';
  const line = dark ? '#e8e5de' : '#1a1a1e';
  const BLUE = '#2d5a8c', OCHRE = '#d69a41', LIGHT = dark ? '#e8e5de' : '#c9c5bd';
  return canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);

    // Figur links: blauer Kopf mit Ocker-Hut, Ocker-Torso, blaue Arme
    g.fillStyle = OCHRE;
    g.beginPath(); g.moveTo(52, 18); g.lineTo(78, 8); g.lineTo(84, 24); g.fill();
    g.fillStyle = BLUE;
    g.beginPath(); g.arc(70, 34, 17, 0, 7); g.fill();
    g.fillStyle = OCHRE;
    g.beginPath(); g.moveTo(48, 56); g.lineTo(92, 52); g.lineTo(98, 108); g.lineTo(44, 112); g.fill();
    g.fillStyle = BLUE;
    g.beginPath(); g.moveTo(46, 58); g.lineTo(30, 92); g.lineTo(42, 100); g.lineTo(56, 70); g.fill();
    g.beginPath(); g.moveTo(94, 56); g.lineTo(112, 84); g.lineTo(100, 96); g.lineTo(88, 68); g.fill();
    // Schnabel
    g.fillStyle = OCHRE;
    g.beginPath(); g.moveTo(85, 30); g.lineTo(104, 24); g.lineTo(104, 32); g.lineTo(86, 40); g.fill();

    // Figur rechts: heller Kopf mit blauem Dreieckshut, blauer Torso, helle Arme
    g.fillStyle = BLUE;
    g.beginPath(); g.moveTo(168, 16); g.lineTo(188, 4); g.lineTo(198, 20); g.fill();
    g.fillStyle = LIGHT;
    g.beginPath(); g.arc(184, 36, 17, 0, 7); g.fill();
    // Miene
    g.strokeStyle = dark ? '#16161a' : '#efece6'; g.lineWidth = 2;
    g.beginPath(); g.arc(184, 44, 7, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
    g.fillStyle = OCHRE; // Schnabel nach links
    g.beginPath(); g.moveTo(168, 32); g.lineTo(150, 36); g.lineTo(168, 42); g.fill();
    g.fillStyle = BLUE;
    g.beginPath(); g.moveTo(162, 58); g.lineTo(208, 56); g.lineTo(214, 110); g.lineTo(158, 112); g.fill();
    g.fillStyle = LIGHT;
    g.beginPath(); g.moveTo(160, 60); g.lineTo(142, 90); g.lineTo(154, 100); g.lineTo(168, 72); g.fill();
    g.beginPath(); g.moveTo(210, 58); g.lineTo(228, 86); g.lineTo(216, 98); g.lineTo(204, 70); g.fill();

    // Kritzel-Wolke über den Köpfen + Strahlen
    g.strokeStyle = line; g.lineWidth = 2;
    g.beginPath(); g.ellipse(128, 14, 26, 9, 0.2, 0, 7); g.stroke();
    g.beginPath(); g.ellipse(120, 18, 18, 6, -0.3, 0, 7); g.stroke();
    for (const [x0, y0, x1, y1] of [
      [44, 20, 30, 10], [48, 34, 32, 30], [206, 18, 220, 8], [208, 34, 224, 30],
      [96, 14, 104, 4], [162, 12, 154, 2],
    ]) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
    // Schraffuren auf den Armen
    g.lineWidth = 1.5;
    for (const [x0, y0, x1, y1] of [
      [36, 78, 46, 66], [40, 88, 50, 76], [98, 72, 106, 82], [148, 82, 158, 70], [214, 74, 222, 84],
    ]) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  });
}

// Bodenlanger Vorhang (Workshopraum/Konferenzraum 2): cremefarben, weiche Faltenwürfe.
export function makeCurtainTexture() {
  return canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = '#ddd3c2'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 8) {
      g.fillStyle = 'rgba(120,108,92,0.35)'; g.fillRect(x, 0, 2, h);
      g.fillStyle = 'rgba(255,250,240,0.45)'; g.fillRect(x + 4, 0, 2, h);
    }
    g.fillStyle = 'rgba(120,108,92,0.25)'; g.fillRect(0, 61, w, 3); // Saum
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
