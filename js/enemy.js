// Der Kunde: Billboard-Sprite mit Zustandsmaschine (Chase → Windup → Ausrede feuern) + Projektile.
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { collideMove } from './level.js';
import { makeCustomerTextures, getExcuseMaterial } from './sprites.js';

// Attack patterns. windup scales the telegraph; fixed taunts override the
// ticket excuses so the player learns to read what's coming.
const PATTERNS = {
  single:  { windup: 1 },
  double:  { windup: 1 },
  lead:    { windup: 1.1, taunt: 'Ich weiß genau, wo du hinwillst!' },
  mg:      { windup: 1.5, taunt: 'Und das! Und das! Und das!' },
  ring:    { windup: 1.3, taunt: 'ALLE IN CC!' },
  wall:    { windup: 1.4, taunt: 'DEADLINE IST DEADLINE!' },
  split:   { windup: 1.1, taunt: 'Nur ein kleiner Change…!' },
  homing:  { windup: 1.2, taunt: 'Da bleib ich dran!' },
  spiral:  { windup: 1.5, taunt: 'FEEDBACK-SCHLEIFE!' },
  pincer:  { windup: 1.2, taunt: 'Wir kommen von zwei Seiten!' },
  bounce:  { windup: 1.1, taunt: 'Das kommt zurück aufs Board!' },
  rain:    { windup: 1.6, taunt: 'FREITAG, 17 UHR: MAIL-FLUT!' },
  cluster: { windup: 1.3, taunt: 'Kurzes Meeting? Kurzes Meeting!' },
};

function pickPattern(weights) {
  let sum = 0;
  for (const k in weights) sum += weights[k];
  let r = Math.random() * sum;
  for (const k in weights) { r -= weights[k]; if (r <= 0) return k; }
  return 'single';
}

function rotY(v, a) {
  const c = Math.cos(a), s = Math.sin(a);
  return new THREE.Vector3(v.x * c - v.z * s, v.y, v.x * s + v.z * c);
}

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
    this.pattern = 'single';
    this.burst = null;
    this.px = null; this.pz = null; this.pvx = 0; this.pvz = 0;
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

    // Estimate the player's velocity (smoothed) for the 'lead' pattern
    if (dt > 0 && this.px !== null) {
      this.pvx = this.pvx * 0.8 + ((player.pos.x - this.px) / dt) * 0.2;
      this.pvz = this.pvz * 0.8 + ((player.pos.z - this.pz) / dt) * 0.2;
    }
    this.px = player.pos.x; this.pz = player.pos.z;

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
        this.executePattern(projectiles, player, onExcuse);
        if (this.burst) {
          this.state = 'burst';
        } else {
          this.cool = this.cfg.fireInterval;
          this.state = 'chase';
        }
      }
      return;
    }

    if (this.state === 'burst') { // follow-up shots (double / machine gun)
      this.mat.map = this.tex.attack;
      this.burst.t -= dt;
      if (this.burst.t <= 0) {
        const b = this.burst;
        if (b.mode === 'spiral') {
          projectiles.radial(this.pos, b.angle, this.cfg, b.text);
          b.angle += b.step;
        } else if (b.fan) {
          projectiles.spawn(this.pos, player.pos, this.cfg, b.text);
        } else {
          projectiles.aimed(this.pos, player.pos, this.cfg, b.text, { jitter: b.jitter, dmgMul: b.dmgMul });
        }
        b.t = b.interval;
        if (--b.left <= 0) {
          this.burst = null;
          this.cool = this.cfg.fireInterval;
          this.state = 'chase';
        }
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
      this.pattern = pickPattern(this.cfg.patterns || { single: 1 });
      this.state = 'windup';
      this.wind = this.cfg.windup * (PATTERNS[this.pattern].windup || 1);
      return;
    }

    this.mat.map = ((time * 4) | 0) % 2 ? this.tex.walk1 : this.tex.walk2;
  }

  executePattern(projectiles, player, onExcuse) {
    const cfg = this.cfg;
    const def = PATTERNS[this.pattern] || PATTERNS.single;
    const text = def.taunt || cfg.excuses[(Math.random() * cfg.excuses.length) | 0];
    if (onExcuse) onExcuse(text);

    switch (this.pattern) {
      case 'double': // second fan re-aims at the player's new position
        projectiles.spawn(this.pos, player.pos, cfg, text);
        this.burst = { left: 1, interval: 0.22, t: 0.22, text, fan: true };
        break;
      case 'mg': // tracking burst, weak single bullets
        this.burst = { left: 8, interval: 0.09, t: 0, text, jitter: 0.07, dmgMul: 0.4 };
        break;
      case 'lead': { // aims where the player is heading, fast shot
        const dist = Math.hypot(player.pos.x - this.pos.x, player.pos.z - this.pos.z);
        const t = dist / (cfg.projSpeed * 1.3);
        const tgt = { x: player.pos.x + this.pvx * t, z: player.pos.z + this.pvz * t };
        projectiles.aimed(this.pos, tgt, cfg, text, { speedMul: 1.3 });
        break;
      }
      case 'ring':
        projectiles.ring(this.pos, cfg, text);
        break;
      case 'wall':
        projectiles.wall(this.pos, player.pos, cfg, text);
        break;
      case 'split': // one shot that bursts into a fan mid-flight
        projectiles.aimed(this.pos, player.pos, cfg, text, { splitAt: 0.55 });
        break;
      case 'homing': // curves after the player for a while
        projectiles.aimed(this.pos, player.pos, cfg, text, { homingT: 1.6, speedMul: 0.85 });
        break;
      case 'spiral': { // rotating spray, bullet-hell style
        const start = Math.atan2(player.pos.z - this.pos.z, player.pos.x - this.pos.x);
        this.burst = { left: 16, interval: 0.07, t: 0, text, mode: 'spiral', angle: start, step: 0.42 };
        break;
      }
      case 'pincer': // two shots swing out sideways, then curve back in
        projectiles.aimed(this.pos, player.pos, cfg, text, { rot: 1.3, homingT: 1.5, speedMul: 0.9 });
        projectiles.aimed(this.pos, player.pos, cfg, text, { rot: -1.3, homingT: 1.5, speedMul: 0.9 });
        break;
      case 'bounce': // ricochets off walls up to three times
        projectiles.aimed(this.pos, player.pos, cfg, text, { flat: true, bounces: 3, speedMul: 0.9 });
        break;
      case 'rain': // barrage from above, centered on the player
        projectiles.rain(player.pos, cfg, text);
        break;
      case 'cluster': // slow lob that detonates into a ring
        projectiles.aimed(this.pos, player.pos, cfg, text, { speedMul: 0.6, splitAt: 0.8, splitMode: 'ring' });
        break;
      default:
        projectiles.spawn(this.pos, player.pos, cfg, text);
    }
  }
}

export class Projectiles {
  constructor(scene) {
    this.scene = scene;
    this.list = [];
  }

  // Low-level: one projectile. extra: jitter/speedMul/dmgMul consumed by callers,
  // splitAt (s until fan burst) and homingT (s of steering) consumed in update().
  add(origin, vel, text, dmg, extra = {}) {
    const sprite = new THREE.Sprite(getExcuseMaterial(text));
    sprite.scale.set(2.9, 1.29, 1);
    sprite.position.copy(origin);
    this.scene.add(sprite);
    this.list.push({ sprite, vel, text, dmg: Math.max(1, Math.round(dmg)), life: 6, age: 0, ...extra });
  }

  // Fan of `volley` projectiles: center shot aims, the flanks block the dodge lanes
  spawn(from, targetPos, cfg, text) {
    const n = cfg.volley || 1;
    const origin = new THREE.Vector3(from.x, 2.5, from.z);
    const base = new THREE.Vector3(targetPos.x, 1.5, targetPos.z).sub(origin).normalize();
    for (let i = 0; i < n; i++) {
      const a = (i - (n - 1) / 2) * CONFIG.boss.volleySpread;
      this.add(origin, rotY(base, a).multiplyScalar(cfg.projSpeed), text, cfg.projDamage);
    }
  }

  // Single aimed shot with optional jitter/rotation/speed/damage tweaks and flight flags
  aimed(from, targetPos, cfg, text,
    { jitter = 0, rot = 0, speedMul = 1, dmgMul = 1, splitAt = 0, splitMode = 'fan', homingT = 0, bounces = 0, flat = false } = {}) {
    const origin = new THREE.Vector3(from.x, flat ? 1.4 : 2.5, from.z);
    let dir = new THREE.Vector3(targetPos.x, flat ? 1.4 : 1.5, targetPos.z).sub(origin).normalize();
    if (jitter) dir = rotY(dir, (Math.random() - 0.5) * 2 * jitter);
    if (rot) dir = rotY(dir, rot);
    this.add(origin, dir.multiplyScalar(cfg.projSpeed * speedMul), text, cfg.projDamage * dmgMul,
      { splitAt, splitMode, homingT, bounces });
  }

  // One bullet at an absolute angle (spiral pattern)
  radial(from, angle, cfg, text) {
    this.add(new THREE.Vector3(from.x, 1.4, from.z),
      new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)).multiplyScalar(cfg.projSpeed * 0.7),
      text, cfg.projDamage * 0.7);
  }

  // Barrage falling from the ceiling around a point
  rain(around, cfg, text, n = 12) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, r = 1 + Math.random() * 5;
      this.add(new THREE.Vector3(around.x + Math.cos(a) * r, 7 + Math.random() * 2, around.z + Math.sin(a) * r),
        new THREE.Vector3(0, -9, 0), text, cfg.projDamage * 0.8);
    }
  }

  // 360° ring — find the gap or back off
  ring(from, cfg, text, n = 14) {
    const speed = cfg.projSpeed * 0.8;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      this.add(new THREE.Vector3(from.x, 1.4, from.z),
        new THREE.Vector3(Math.cos(a) * speed, 0, Math.sin(a) * speed), text, cfg.projDamage * 0.8);
    }
  }

  // Wide wall rolling at the player, one random gap to slip through
  wall(from, targetPos, cfg, text, n = 9) {
    const speed = cfg.projSpeed * 0.75;
    const origin = new THREE.Vector3(from.x, 1.4, from.z);
    const dir = new THREE.Vector3(targetPos.x - from.x, 0, targetPos.z - from.z).normalize();
    const perp = new THREE.Vector3(-dir.z, 0, dir.x);
    const gap = 1 + ((Math.random() * (n - 2)) | 0);
    for (let i = 0; i < n; i++) {
      if (i === gap) continue;
      const off = (i - (n - 1) / 2) * 1.5;
      this.add(origin.clone().addScaledVector(perp, off), dir.clone().multiplyScalar(speed), text, cfg.projDamage);
    }
  }

  update(dt, level, player, onHit) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.age += dt;
      const pos = p.sprite.position;

      if (p.homingT && p.age < p.homingT) { // steer toward the player, keep speed
        const speed = p.vel.length();
        const tx = player.pos.x - pos.x, tz = player.pos.z - pos.z;
        const tl = Math.hypot(tx, tz) || 1;
        p.vel.x += (tx / tl) * speed * 2.2 * dt;
        p.vel.z += (tz / tl) * speed * 2.2 * dt;
        p.vel.setLength(speed);
      }

      if (p.splitAt && p.age >= p.splitAt) { // detonate, parent dies
        if (p.splitMode === 'ring') { // cluster: ring at chest height
          const speed = p.vel.length() * 1.2;
          for (let k = 0; k < 8; k++) {
            const a = (k / 8) * Math.PI * 2;
            this.add(new THREE.Vector3(pos.x, 1.4, pos.z),
              new THREE.Vector3(Math.cos(a) * speed, 0, Math.sin(a) * speed), p.text, p.dmg * 0.7);
          }
        } else { // split: fan along the flight direction
          for (const a of [-0.38, 0, 0.38]) {
            this.add(pos, rotY(p.vel, a).multiplyScalar(1.15), p.text, p.dmg * 0.7);
          }
        }
        this.scene.remove(p.sprite);
        this.list.splice(i, 1);
        continue;
      }

      pos.addScaledVector(p.vel, dt);
      p.life -= dt;
      let kill = p.life <= 0 || pos.y < 0;
      if (!kill && level.isSolidWorld(pos.x, pos.z)) {
        if (p.bounces > 0) { // ricochet: step back, flip the blocked axis
          p.bounces--;
          pos.addScaledVector(p.vel, -dt);
          const sx = level.isSolidWorld(pos.x + p.vel.x * dt, pos.z);
          const sz = level.isSolidWorld(pos.x, pos.z + p.vel.z * dt);
          if (sx) p.vel.x *= -1;
          if (sz) p.vel.z *= -1;
          if (!sx && !sz) { p.vel.x *= -1; p.vel.z *= -1; }
        } else {
          kill = true;
        }
      }
      if (!kill) {
        const dx = pos.x - player.pos.x, dz = pos.z - player.pos.z;
        // Körperfenster von Schienbein bis knapp über den Kopf (pos.y = Augenhöhe):
        // ein voller Sprung hebt die Füße über flache Patterns (Ring, Wand bei y 1.4)
        if (Math.hypot(dx, dz) < 1.0 && pos.y > player.pos.y - 1.35 && pos.y < player.pos.y + 0.35) {
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
