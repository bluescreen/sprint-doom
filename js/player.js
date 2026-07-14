// Spieler: FPS-Steuerung (Pointer Lock + WASD), Kollision, Nerven (Health).
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { collideMove } from './level.js';

export class Player {
  constructor(level) {
    this.level = level;
    this.pos = new THREE.Vector3(level.playerSpawn.x, CONFIG.player.eyeHeight, level.playerSpawn.z);
    this.yaw = -Math.PI / 2; // Blick nach +x, Richtung Tickets
    this.pitch = 0;
    this.health = CONFIG.player.maxHealth;
    this.moving = false;
  }

  onMouseMove(dx, dy) {
    this.yaw -= dx * 0.0022;
    this.pitch -= dy * 0.0022;
    this.pitch = Math.max(-1.35, Math.min(1.35, this.pitch));
  }

  update(dt, keys) {
    let fw = 0, str = 0;
    if (keys.has('KeyW') || keys.has('ArrowUp')) fw += 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) fw -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) str += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) str -= 1;
    this.moving = fw !== 0 || str !== 0;
    if (!this.moving) return;

    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    // forward = (-sin, -cos), right = (cos, -sin)
    let dx = -sin * fw + cos * str;
    let dz = -cos * fw - sin * str;
    const len = Math.hypot(dx, dz) || 1;
    const s = CONFIG.player.speed * dt / len;
    collideMove(this.level, this.pos, dx * s, dz * s, CONFIG.player.radius);
  }

  applyToCamera(camera) {
    camera.position.copy(this.pos);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = this.yaw;
    camera.rotation.x = this.pitch;
  }

  damage(d) {
    this.health = Math.max(0, this.health - d);
    return this.health <= 0;
  }
}
