// SPRINT DOOM — Bootstrap, Game-Loop und Verdrahtung aller Module.
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { buildLevel } from './level.js';
import { buildProps } from './props.js';
import { Player } from './player.js';
import { Weapon } from './weapon.js';
import { Boss, Adds, Projectiles } from './enemy.js';
import { Pickups } from './pickups.js';
import { SprintManager } from './tickets.js';
import { Hud } from './hud.js';
import { initAudio, sfx, music } from './audio.js';

const $ = (id) => document.getElementById(id);

// ---------- Renderer / Szene ----------
const canvas = $('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setPixelRatio(1);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101014);
scene.fog = new THREE.Fog(0x101014, 12, 66);

const camera = new THREE.PerspectiveCamera(72, 1, 0.1, 200);

function resize() {
  const w = Math.floor(window.innerWidth / CONFIG.downscale);
  const h = Math.floor(window.innerHeight / CONFIG.downscale);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// ---------- Welt & Akteure ----------
const level = buildLevel(scene);
buildProps(scene, level);
const player = new Player(level);
const weapon = new Weapon();
const boss = new Boss(scene, level);
const adds = new Adds(scene, level);
const projectiles = new Projectiles(scene);
const pickups = new Pickups(scene);
const hud = new Hud();

let state = 'title'; // title | playing | ended
let paused = false;
let time = 0;
let mouseDown = false;
const keys = new Set();

const sprint = new SprintManager({
  level, player, boss, adds, projectiles, weapon, hud, sfx, pickups,
  onFightStart(cfg) {
    introT = 1.6;
    hud.bossIntro(cfg);
  },
  onGameOver(results, total) {
    state = 'ended';
    music.stop();
    document.exitPointerLock();
    const win = total >= CONFIG.sprint.min && total <= CONFIG.sprint.max;
    if (win) sfx.win(); else sfx.lose();
    hud.showEnd(results, total);
  },
});

level.onDoorMove = (d) => { if (d.target === 1) sfx.door(); };

// ---------- Input ----------
window.addEventListener('keydown', (e) => {
  keys.add(e.code);
  if (e.code === 'Space') e.preventDefault(); // kein Page-Scroll beim Springen
  // Doom classic: pick the skill level with keys 1-5
  if (state === 'title' && !$('skill-overlay').classList.contains('hidden')) {
    const n = +e.key;
    if (n >= 1 && n <= CONFIG.difficulties.length) startGame(n - 1);
  }
  // Waffenwechsel mit 1-6 im Spiel
  if (state === 'playing' && /^Digit[1-9]$/.test(e.code)) {
    const w = +e.code[5] - 1;
    if (CONFIG.weapons[w] && weapon.switchTo(w)) {
      sfx.weaponSwitch();
      hud.message(CONFIG.weapons[w].name, 1.1);
    }
  }
});
window.addEventListener('keyup', (e) => keys.delete(e.code));
window.addEventListener('mousemove', (e) => {
  if (document.pointerLockElement) player.onMouseMove(e.movementX, e.movementY);
});
window.addEventListener('mousedown', (e) => { if (e.button === 0) mouseDown = true; });
window.addEventListener('mouseup', (e) => { if (e.button === 0) mouseDown = false; });

// Skill screen after the classic Doom selection screen
function startGame(skill) {
  CONFIG.skill = skill;
  sprint.prepareRoom(); // first room crew appears behind the glass
  pickups.spawnWeapons(level.rooms); // Waffen 2-6 liegen im Flur vor den Räumen
  initAudio();
  music.start();
  $('skill-overlay').classList.add('hidden');
  state = 'playing';
  canvas.requestPointerLock();
  hud.message('SPRINT PLANNING: Das Board zeigt deine 5 Tickets. Termin 1: Konferenzraum 1 →', 5);
}

CONFIG.difficulties.forEach((d, i) => {
  const btn = document.createElement('button');
  btn.className = 'skill-item' + (i === CONFIG.difficulties.length - 1 ? ' nightmare' : '');
  btn.textContent = d.name;
  btn.addEventListener('click', () => startGame(i));
  $('skill-list').appendChild(btn);
});

$('title-overlay').addEventListener('click', () => {
  $('title-overlay').classList.add('hidden');
  $('skill-overlay').classList.remove('hidden');
});

// Titelmusik direkt auf dem Titelbild: sofort starten, falls der Browser
// Autoplay erlaubt — sonst bei der allerersten Geste (Taste/Klick) nachholen.
function tryTitleMusic() {
  if (state !== 'title') return;
  initAudio();
  music.startTitle();
}
tryTitleMusic();
window.addEventListener('pointerdown', tryTitleMusic);
window.addEventListener('keydown', tryTitleMusic);

$('pause-overlay').addEventListener('click', () => {
  canvas.requestPointerLock();
});

$('restart-btn').addEventListener('click', () => location.reload());

document.addEventListener('pointerlockchange', () => {
  if (state !== 'playing') return;
  if (document.pointerLockElement) {
    paused = false;
    $('pause-overlay').classList.add('hidden');
  } else {
    paused = true;
    mouseDown = false;
    $('pause-overlay').classList.remove('hidden');
  }
});

// ---------- Screenshake & Hit-Stop ----------
let shakeMag = 0;
let hitStopT = 0;
let introT = 0; // Boss-Intro-Karte: kurzer Freeze
const addShake = (m) => { shakeMag = Math.min(0.5, Math.max(shakeMag, m)); };
const addHitStop = (d) => { hitStopT = Math.max(hitStopT, d); };

// ---------- Schießen ----------
function raySphereT(origin, dir, center, r) {
  const oc = center.sub(origin); // center ist ein Wegwerf-Vektor
  const tca = oc.dot(dir);
  if (tca < 0) return Infinity;
  const d2 = oc.lengthSq() - tca * tca;
  if (d2 > r * r) return Infinity;
  return tca - Math.sqrt(r * r - d2);
}

const _dir = new THREE.Vector3();
const _pdir = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _center = new THREE.Vector3();

// Ein Strahl (Pellet): nächstes Ziel unter Kunde + Beratern, vor der Wand
function pelletTarget(dir) {
  const h = Math.hypot(dir.x, dir.z);
  let wallT = CONFIG.weapon.range;
  if (h > 1e-4) {
    wallT = level.raycastWall(player.pos.x, player.pos.z, dir.x / h, dir.z / h, CONFIG.weapon.range) / h;
  }
  let hitT = Infinity, target = null;
  for (const e of [boss, ...adds.alive]) {
    if (!e.alive) continue;
    _center.set(e.pos.x, 1.9, e.pos.z);
    const r = e === boss ? CONFIG.boss.hitRadius : CONFIG.boss.hitRadius * 0.8;
    const t = raySphereT(camera.position, dir, _center, r);
    if (t < hitT) { hitT = t; target = e; }
  }
  return target && hitT < wallT && hitT < CONFIG.weapon.range ? target : null;
}

function fire() {
  const def = weapon.def;
  weapon.onFire(time);
  sfx.shoot(weapon.idx);
  if (weapon.idx === 5) addShake(0.12); // der A9K tritt beim Abfeuern
  camera.getWorldDirection(_dir);
  if (def.splash) { fireSplash(def); return; }
  const dmgMul = weapon.buffMul('dmg', time);
  const dmg = new Map(); // Ziel → Summe der Pellet-Treffer
  for (let i = 0; i < def.pellets; i++) {
    _pdir.copy(_dir);
    if (def.spread) {
      _pdir.applyAxisAngle(_up, (Math.random() - 0.5) * 2 * def.spread);
      _pdir.y += (Math.random() - 0.5) * def.spread;
      _pdir.normalize();
    }
    const t = pelletTarget(_pdir);
    if (t) dmg.set(t, (dmg.get(t) || 0) + def.damage * dmgMul * (0.8 + Math.random() * 0.4));
  }
  if (dmg.size) {
    weapon.hits++; // Accuracy zählt Schüsse, nicht Pellets
    sfx.hitEnemy();
    for (const [target, d] of dmg) {
      if (target.takeDamage(d)) {
        if (target === boss) { sprint.onBossKilled(time); addShake(0.3); addHitStop(0.18); }
        else { sfx.minionDie(); addShake(0.15); addHitStop(0.07); }
      }
    }
  }
}

const _impact = new THREE.Vector3();

// Change Request: explodiert am nächsten Ziel oder an der Wand — Volltreffer
// plus Flächenschaden mit Falloff, und wer zu nah dran steht, zahlt selbst
function fireSplash(def) {
  const h = Math.hypot(_dir.x, _dir.z);
  let wallT = CONFIG.weapon.range;
  if (h > 1e-4) {
    wallT = level.raycastWall(player.pos.x, player.pos.z, _dir.x / h, _dir.z / h, CONFIG.weapon.range) / h;
  }
  let hitT = Infinity, direct = null;
  for (const e of [boss, ...adds.alive]) {
    if (!e.alive) continue;
    _center.set(e.pos.x, 1.9, e.pos.z);
    const r = e === boss ? CONFIG.boss.hitRadius : CONFIG.boss.hitRadius * 0.8;
    const t = raySphereT(camera.position, _dir, _center, r);
    if (t < hitT) { hitT = t; direct = e; }
  }
  if (hitT >= wallT) direct = null;
  _impact.copy(camera.position).addScaledVector(_dir, Math.min(hitT, wallT, CONFIG.weapon.range));
  sfx.explode();
  addShake(0.35);
  addHitStop(0.05);
  const dmgMul = weapon.buffMul('dmg', time);
  let anyHit = false;
  for (const e of [boss, ...adds.alive]) {
    if (!e.alive) continue;
    const d = Math.hypot(e.pos.x - _impact.x, e.pos.z - _impact.z);
    const dm = (e === direct ? def.damage : d < def.splash ? def.damage * 0.6 * (1 - d / def.splash) : 0) * dmgMul;
    if (dm <= 0) continue;
    anyHit = true;
    if (e.takeDamage(dm * (0.8 + Math.random() * 0.4))) {
      if (e === boss) { sprint.onBossKilled(time); addShake(0.3); addHitStop(0.18); }
      else { sfx.minionDie(); addShake(0.15); addHitStop(0.07); }
    }
  }
  if (anyHit) { weapon.hits++; sfx.hitEnemy(); }
  const pd = Math.hypot(player.pos.x - _impact.x, player.pos.z - _impact.z);
  if (pd < def.splash) {
    const dead = player.damage(Math.round(12 * (1 - pd / def.splash)));
    hud.flashDamage();
    sfx.playerHurt();
    hud.setFaceTemp('hurt', 0.6);
    if (dead && sprint.phase === 'fight') sprint.onPlayerDown(time);
  }
}

// ---------- Game-Loop ----------
function update(dt) {
  time += dt;
  player.update(dt, keys);
  level.updateDoors(dt, player.pos);
  sprint.update(time);

  boss.update(dt, player, time, projectiles, (ex) => {
    hud.ticker(ex);
    sfx.excuse();
  });
  adds.update(dt, player, time, projectiles);

  projectiles.update(dt, level, player, (dmg) => {
    const dead = player.damage(dmg);
    hud.flashDamage();
    sfx.playerHurt();
    hud.setFaceTemp('hurt', 0.6);
    addShake(0.22);
    if (dead && sprint.phase === 'fight') sprint.onPlayerDown(time);
  });

  pickups.update(time, player, (item) => {
    if (item.heal) player.health = Math.min(CONFIG.player.maxHealth, player.health + item.heal);
    if (item.buff) weapon.buff(item.buff.kind, item.buff.mul, time + item.buff.dur);
    if (item.weapon !== undefined) {
      weapon.unlock(item.weapon);
      sfx.weaponSwitch();
    }
    hud.message(item.label, 2.2);
    hud.setFaceTemp('grin', 1.2);
    sfx.pickup();
  });

  if (mouseDown && weapon.canFire(time)) fire();

  weapon.update(dt, player.moving);
  hud.tick(dt, player.health);
  hud.setHealth(player.health);
  if (boss.alive) hud.bossHp(boss.hp / boss.maxHp);

  player.applyToCamera(camera);

  // Screenshake obendrauf — klingt pro Frame aus
  if (shakeMag > 0.004) {
    camera.position.x += (Math.random() - 0.5) * shakeMag;
    camera.position.y += (Math.random() - 0.5) * shakeMag;
    camera.rotation.z += (Math.random() - 0.5) * shakeMag * 0.05;
    shakeMag *= 0.88;
  } else {
    shakeMag = 0;
  }
}

let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (state === 'playing' && !paused) {
    if (introT > 0) {
      introT -= dt; // Boss-Intro: die Welt hält kurz den Atem an
    } else {
      if (hitStopT > 0) { hitStopT -= dt; dt *= 0.12; } // kurze Zeitlupe bei harten Treffern
      update(dt);
    }
  }
  renderer.render(scene, camera);
}
player.applyToCamera(camera);
requestAnimationFrame(frame);

// Debug-Zugriff für Tests
window.SD = { player, boss, sprint, level, weapon, hud, camera, CONFIG, get time() { return time; } };
