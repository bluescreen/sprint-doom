// Der Kunde: Billboard-Sprite mit Zustandsmaschine (Chase → Windup → Ausrede feuern) + Projektile.
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { collideMove } from './level.js';
import { makeCustomerTextures, getExcuseMaterial } from './sprites.js';

export class Boss {
  constructor(scene, level) {
    this.level = level;
    this.tex = makeCustomerTextures();
    this.mat = new THREE.MeshBasicMaterial({
      map: this.tex.idle, transparent: true, alphaTest: 0.15, side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(3, 4), this.mat);
    this.mesh.visible = false;
    scene.add(this.mesh);
    this.pos = new THREE.Vector3();
    this.alive = false;
  }

  spawn(cfg, p) {
    this.cfg = cfg;
    this.hp = cfg.hp;
    this.maxHp = cfg.hp;
    this.pos.set(p.x, 0, p.z);
    this.alive = true;
    this.state = 'chase';
    this.cool = 1.1;
    this.wind = 0;
    this.hitT = 0;
    this.mesh.visible = true;
    this.mat.map = this.tex.idle;
  }

  takeDamage(d) {
    if (!this.alive) return false;
    this.hp -= d;
    this.hitT = 0.13;
    if (this.hp <= 0) {
      this.alive = false;
      this.mat.map = this.tex.dead;
      return true; // gerade gestorben
    }
    return false;
  }

  despawn() {
    this.alive = false;
    this.mesh.visible = false;
  }

  update(dt, player, time, projectiles, onExcuse) {
    if (!this.mesh.visible) return;

    // Billboard: nur um Y zur Kamera drehen
    this.mesh.rotation.y = Math.atan2(player.pos.x - this.pos.x, player.pos.z - this.pos.z);
    this.mesh.position.set(this.pos.x, this.alive ? 2 : 1.2, this.pos.z);
    if (!this.alive) return;

    this.cool -= dt;

    if (this.hitT > 0) { // kurzer Treffer-Stun
      this.hitT -= dt;
      this.mat.map = this.tex.hit;
      return;
    }

    const dx = player.pos.x - this.pos.x;
    const dz = player.pos.z - this.pos.z;
    const dist = Math.hypot(dx, dz);

    if (this.state === 'windup') {
      this.mat.map = this.tex.attack;
      this.wind -= dt;
      if (this.wind <= 0) {
        const ex = this.cfg.excuses[(Math.random() * this.cfg.excuses.length) | 0];
        projectiles.spawn(this.pos, player.pos, this.cfg, ex);
        if (onExcuse) onExcuse(ex);
        this.cool = this.cfg.fireInterval;
        this.state = 'chase';
      }
      return;
    }

    // Verfolgen mit seitlichem Pendeln (Strafing)
    if (dist > CONFIG.boss.minDist) {
      const inv = 1 / dist;
      const s = Math.sin(time * 2.1 + this.cfg.id * 1.7) * 0.8;
      let mx = dx * inv - dz * inv * s;
      let mz = dz * inv + dx * inv * s;
      const l = Math.hypot(mx, mz) || 1;
      collideMove(this.level, this.pos,
        (mx / l) * this.cfg.speed * dt, (mz / l) * this.cfg.speed * dt, CONFIG.boss.radius);
    }

    if (dist < CONFIG.boss.attackRange && this.cool <= 0) {
      this.state = 'windup';
      this.wind = this.cfg.windup;
      return;
    }

    this.mat.map = ((time * 4) | 0) % 2 ? this.tex.walk1 : this.tex.walk2;
  }
}

export class Projectiles {
  constructor(scene) {
    this.scene = scene;
    this.list = [];
  }

  spawn(from, targetPos, cfg, text) {
    const sprite = new THREE.Sprite(getExcuseMaterial(text));
    sprite.scale.set(2.9, 1.29, 1);
    const origin = new THREE.Vector3(from.x, 2.5, from.z);
    const vel = new THREE.Vector3(targetPos.x, 1.5, targetPos.z)
      .sub(origin).normalize().multiplyScalar(cfg.projSpeed);
    sprite.position.copy(origin);
    this.scene.add(sprite);
    this.list.push({ sprite, vel, dmg: cfg.projDamage, life: 6 });
  }

  update(dt, level, player, onHit) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.sprite.position.addScaledVector(p.vel, dt);
      p.life -= dt;
      const pos = p.sprite.position;
      let kill = p.life <= 0 || level.isSolidWorld(pos.x, pos.z);
      if (!kill) {
        const dx = pos.x - player.pos.x, dz = pos.z - player.pos.z;
        if (Math.hypot(dx, dz) < 1.0 && Math.abs(pos.y - player.pos.y) < 1.7) {
          onHit(p.dmg);
          kill = true;
        }
      }
      if (kill) {
        this.scene.remove(p.sprite);
        this.list.splice(i, 1);
      }
    }
  }

  clear() {
    for (const p of this.list) this.scene.remove(p.sprite);
    this.list.length = 0;
  }
}
