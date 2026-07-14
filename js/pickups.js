// Goodies: pickups scattered into the side rooms after each finished ticket.
import * as THREE from 'three';
import { CONFIG } from './config.js';

const T = CONFIG.tileSize;

// Free cells in the non-conference rooms (clear of furniture blocks)
const SPOTS = [
  { c: 4, r: 3, room: 'Technikraum' },
  { c: 9, r: 4, room: 'Kickerraum' },
  { c: 16, r: 3, room: 'Archiv FiBu' },
  { c: 21, r: 3, room: 'Officelager 1' },
  { c: 27, r: 3, room: 'Küche 2' },
  { c: 31, r: 2, room: 'Lounge' },
];

const ITEMS = [
  { key: 'coffee', heal: 20, weight: 0.45, label: '☕ Kaffee gefunden: +20 Nerven' },
  { key: 'mate', heal: 15, weight: 0.35, label: '🧃 Club-Mate gefunden: +15 Nerven' },
  { key: 'pizza', heal: 40, weight: 0.2, label: '🍕 Pizzastück gefunden: +40 Nerven' },
  // Kampf-Buffs: erscheinen nur mitten in der Arena (weight 0 = nie in Nebenräumen)
  { key: 'redbull', buff: { kind: 'rate', mul: 1.6, dur: 8 }, weight: 0, label: '⚡ Energy-Drink: Feuerrate ×1.6!' },
  { key: 'folder', buff: { kind: 'dmg', mul: 1.5, dur: 8 }, weight: 0, label: '📁 Eskalations-Ordner: Schaden ×1.5!' },
];

function pickItem() {
  let r = Math.random() * ITEMS.reduce((s, it) => s + it.weight, 0);
  for (const it of ITEMS) { r -= it.weight; if (r <= 0) return it; }
  return ITEMS[0];
}

const matCache = new Map();

function materialFor(key) {
  if (matCache.has(key)) return matCache.get(key);
  const c = document.createElement('canvas');
  c.width = 32; c.height = 32;
  const g = c.getContext('2d');

  if (key === 'coffee') {
    g.fillStyle = '#f4f0e8'; g.fillRect(8, 12, 14, 14);   // mug
    g.fillStyle = '#5a3a22'; g.fillRect(9, 13, 12, 4);    // coffee
    g.strokeStyle = '#f4f0e8'; g.lineWidth = 2;
    g.strokeRect(23, 15, 4, 6);                            // handle
    g.fillStyle = '#c9c4bb';                               // steam
    g.fillRect(12, 5, 2, 5); g.fillRect(17, 3, 2, 6);
  } else if (key === 'mate') {
    g.fillStyle = '#7a5c20'; g.fillRect(12, 8, 8, 20);     // bottle
    g.fillStyle = '#3a2c10'; g.fillRect(13, 4, 6, 4);      // neck
    g.fillStyle = '#FFE449'; g.fillRect(12, 14, 8, 8);     // label
    g.fillStyle = '#000'; g.fillRect(14, 17, 4, 2);
  } else if (key === 'redbull') {
    g.fillStyle = '#b8c4d0'; g.fillRect(12, 6, 8, 22);     // schlanke Dose
    g.fillStyle = '#2060a0'; g.fillRect(12, 12, 8, 10);    // Banderole
    g.fillStyle = '#FFE449';                               // Blitz
    g.fillRect(15, 13, 3, 4); g.fillRect(13, 17, 3, 4);
    g.fillStyle = '#8a949e'; g.fillRect(13, 4, 6, 2);      // Deckel
  } else if (key === 'folder') {
    g.fillStyle = '#e0b840'; g.fillRect(6, 10, 20, 16);    // Ordner
    g.fillStyle = '#c99a20'; g.fillRect(6, 10, 20, 3);
    g.fillStyle = '#f4f0e8'; g.fillRect(10, 15, 12, 8);    // Etikett
    g.fillStyle = '#c1272d'; g.fillRect(15, 16, 2, 4); g.fillRect(15, 21, 2, 1); // !
  } else { // pizza
    g.fillStyle = '#e8b84a';                               // slice
    g.beginPath(); g.moveTo(16, 28); g.lineTo(6, 8); g.lineTo(26, 8); g.closePath(); g.fill();
    g.fillStyle = '#c9762c'; g.fillRect(6, 6, 20, 4);      // crust
    g.fillStyle = '#c1272d';                               // salami
    g.fillRect(13, 12, 4, 4); g.fillRect(18, 17, 3, 3); g.fillRect(11, 19, 3, 3);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  matCache.set(key, mat);
  return mat;
}

// Waffen-Pickup: leuchtendes Kästchen mit der Waffentaste
function weaponMaterial(w) {
  const key = 'weapon' + w;
  if (matCache.has(key)) return matCache.get(key);
  const c = document.createElement('canvas');
  c.width = 32; c.height = 32;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(255,228,73,0.28)'; g.fillRect(1, 1, 30, 30); // Glow
  g.fillStyle = '#22252c'; g.fillRect(6, 6, 20, 20);
  g.strokeStyle = '#FFE449'; g.lineWidth = 2; g.strokeRect(6, 6, 20, 20);
  g.fillStyle = '#FFE449'; g.font = 'bold 15px monospace'; g.textAlign = 'center';
  g.fillText(String(w + 1), 16, 22);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  matCache.set(key, mat);
  return mat;
}

export class Pickups {
  constructor(scene) {
    this.scene = scene;
    this.list = [];
  }

  // Drop n goodies onto random still-empty spots
  spawnWave(n = 2) {
    const free = SPOTS.filter(s => !this.list.some(p => p.spot === s));
    for (let i = 0; i < n && free.length > 0; i++) {
      const spot = free.splice((Math.random() * free.length) | 0, 1)[0];
      const item = pickItem();
      const sprite = new THREE.Sprite(materialFor(item.key));
      sprite.scale.set(1.5, 1.5, 1);
      sprite.position.set((spot.c + 0.5) * T, 1.1, (spot.r + 0.5) * T);
      this.scene.add(sprite);
      this.list.push({ sprite, item, spot, baseY: 1.1 });
    }
  }

  // Doom-Progression: Waffe n+1 liegt im Flur vor Meetingraum n
  spawnWeapons(rooms) {
    for (let w = 1; w < CONFIG.weapons.length; w++) {
      const room = rooms[w - 1];
      const sprite = new THREE.Sprite(weaponMaterial(w));
      sprite.scale.set(1.6, 1.6, 1);
      sprite.position.set(room.bossSpawn.x, 1.1, 9.5 * T);
      this.scene.add(sprite);
      this.list.push({
        sprite,
        item: { key: 'weapon', weapon: w, label: `NEU: ${CONFIG.weapons[w].name} — Taste ${w + 1}` },
        spot: null, baseY: 1.1,
      });
    }
  }

  // Buff-Drops mitten im Kampfraum: wer sie will, muss durchs Feuer
  spawnArena(room, level, n = 2) {
    const buffs = ITEMS.filter((it) => it.buff);
    let tries = 24;
    for (let i = 0; i < n && tries > 0; tries--) {
      const x = (room.x0 + 1 + Math.random() * (room.x1 - room.x0 - 1) + 0.5) * T;
      const z = (12 + Math.random() * 4 + 0.5) * T;
      if (level.isSolidWorld(x, z)) continue;
      const item = buffs[(Math.random() * buffs.length) | 0];
      const sprite = new THREE.Sprite(materialFor(item.key));
      sprite.scale.set(1.5, 1.5, 1);
      sprite.position.set(x, 1.1, z);
      this.scene.add(sprite);
      this.list.push({ sprite, item, spot: null, baseY: 1.1, arena: true });
      i++;
    }
  }

  clearArena() { // Meeting vorbei — übrige Buffs verfallen
    for (let i = this.list.length - 1; i >= 0; i--) {
      if (!this.list[i].arena) continue;
      this.scene.remove(this.list[i].sprite);
      this.list.splice(i, 1);
    }
  }

  update(time, player, onCollect) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.sprite.position.y = p.baseY + Math.sin(time * 2.4 + i * 1.3) * 0.15;
      const dx = p.sprite.position.x - player.pos.x;
      const dz = p.sprite.position.z - player.pos.z;
      if (Math.hypot(dx, dz) < 1.4) {
        onCollect(p.item, p.spot);
        this.scene.remove(p.sprite);
        this.list.splice(i, 1);
      }
    }
  }
}
