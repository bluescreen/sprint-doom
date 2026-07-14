// Der "Argumentator 9000": DOM-Canvas-Overlay mit Bobbing, Rückstoß und Accuracy-Tracking.
import { CONFIG } from './config.js';
import { drawWeapon } from './sprites.js';

export class Weapon {
  constructor() {
    this.canvas = document.getElementById('weapon');
    this.ctx = this.canvas.getContext('2d');
    this.shots = 0;
    this.hits = 0;
    this.lastFire = -99;
    this.flash = 0;
    this.bobT = 0;
    this.wasFiring = false;
    this.idx = 0; // Start wie im Original: mit der Pistole
    this.switching = -1; // Ziel-Index während der Wechsel-Animation
    this.switchT = 0;
    this.buffs = {}; // kind → { mul, until } aus Arena-Pickups
    this.owned = CONFIG.weapons.map((_, i) => i === 0); // nur die Pistole am Start
    drawWeapon(this.ctx, false, this.idx);
  }

  get def() { return CONFIG.weapons[this.idx]; }

  switchTo(i) {
    if (i === this.idx || !CONFIG.weapons[i] || !this.owned[i] || this.switching >= 0) return false;
    this.switching = i;
    this.switchT = 0;
    return true;
  }

  unlock(i) {
    if (this.owned[i]) return false;
    this.owned[i] = true;
    this.switching = -1; // Doom-Klassiker: die neue Waffe sofort in die Hand
    this.switchTo(i);
    return true;
  }

  resetStats() { this.shots = 0; this.hits = 0; }

  get accuracy() { return this.shots ? this.hits / this.shots : 0; }

  buff(kind, mul, until) { this.buffs[kind] = { mul, until }; }

  buffMul(kind, t) {
    const b = this.buffs[kind];
    return b && t <= b.until ? b.mul : 1;
  }

  canFire(t) { return this.switching < 0 && t - this.lastFire >= this.def.fireInterval / this.buffMul('rate', t); }

  onFire(t) {
    this.lastFire = t;
    this.flash = 0.09;
    this.shots++;
  }

  update(dt, moving) {
    this.bobT += dt * (moving ? 7.5 : 1.8);
    this.flash = Math.max(0, this.flash - dt);
    const firing = this.flash > 0;
    if (firing !== this.wasFiring) {
      this.wasFiring = firing;
      drawWeapon(this.ctx, firing, this.idx);
    }
    // Wechsel-Animation wie im Original: Waffe taucht ab, kommt neu wieder hoch
    let switchY = 0;
    if (this.switching >= 0) {
      const HALF = 0.19; // s pro Richtung
      this.switchT += dt;
      if (this.switchT >= HALF && this.idx !== this.switching) {
        this.idx = this.switching;
        drawWeapon(this.ctx, false, this.idx);
      }
      if (this.switchT >= 2 * HALF) {
        this.switching = -1;
      } else {
        const p = this.switchT < HALF ? this.switchT / HALF : 2 - this.switchT / HALF;
        switchY = p * 210;
      }
    }
    const bobX = Math.sin(this.bobT) * (moving ? 10 : 3);
    const bobY = Math.abs(Math.cos(this.bobT)) * (moving ? 7 : 2) + (firing ? 10 : 0);
    this.canvas.style.transform = `translate(${bobX}px, ${bobY + switchY}px)`;
  }
}
