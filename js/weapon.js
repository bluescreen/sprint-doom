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
    drawWeapon(this.ctx, false);
  }

  resetStats() { this.shots = 0; this.hits = 0; }

  get accuracy() { return this.shots ? this.hits / this.shots : 0; }

  canFire(t) { return t - this.lastFire >= CONFIG.weapon.fireInterval; }

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
      drawWeapon(this.ctx, firing);
    }
    const bobX = Math.sin(this.bobT) * (moving ? 10 : 3);
    const bobY = Math.abs(Math.cos(this.bobT)) * (moving ? 7 : 2) + (firing ? 10 : 0);
    this.canvas.style.transform = `translate(${bobX}px, ${bobY}px)`;
  }
}
