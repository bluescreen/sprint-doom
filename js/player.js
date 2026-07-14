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
    this.vy = 0;
    this.grounded = true;
  }

  onMouseMove(dx, dy) {
    this.yaw -= dx * 0.0022;
    this.pitch -= dy * 0.0022;
    this.pitch = Math.max(-1.35, Math.min(1.35, this.pitch));
  }

  update(dt, keys, move = null) {
    // Sprung: nur vom Boden ab, volle Luftkontrolle (arcade)
    if (keys.has('Space') && this.grounded) {
      this.vy = CONFIG.player.jumpSpeed;
      this.grounded = false;
    }
    if (!this.grounded) {
      this.vy -= CONFIG.player.gravity * dt;
      this.pos.y += this.vy * dt;
      if (this.pos.y <= CONFIG.player.eyeHeight) {
        this.pos.y = CONFIG.player.eyeHeight;
        this.vy = 0;
        this.grounded = true;
      }
    }

    let fw = 0, str = 0;
    if (keys.has('KeyW') || keys.has('ArrowUp')) fw += 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) fw -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) str += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) str -= 1;
    if (move) { fw += move.y; str += move.x; } // analoger Touch-Stick
    this.moving = Math.abs(fw) > 0.01 || Math.abs(str) > 0.01;
    if (!this.moving) return;

    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    // forward = (-sin, -cos), right = (cos, -sin)
    let dx = -sin * fw + cos * str;
    let dz = -cos * fw - sin * str;
    // max(1, len): Tastatur wird normalisiert, halber Stick-Ausschlag bleibt langsam
    const s = CONFIG.player.speed * dt / Math.max(1, Math.hypot(dx, dz));
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
