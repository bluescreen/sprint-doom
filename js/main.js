// SPRINT DOOM — Bootstrap, Game-Loop und Verdrahtung aller Module.
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { buildLevel } from './level.js';
import { buildProps } from './props.js';
import { Player } from './player.js';
import { Weapon } from './weapon.js';
import { Boss, Projectiles } from './enemy.js';
import { SprintManager } from './tickets.js';
import { Hud } from './hud.js';
import { initAudio, sfx, music } from './audio.js';

const $ = (id) => document.getElementById(id);

// ---------- Renderer / Szene ----------
const canvas = $('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setPixelRatio(1);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);
scene.fog = new THREE.Fog(0x0a0a12, 10, 58);

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
const projectiles = new Projectiles(scene);
const hud = new Hud();

let state = 'title'; // title | playing | ended
let paused = false;
let time = 0;
let mouseDown = false;
const keys = new Set();

const sprint = new SprintManager({
  level, player, boss, projectiles, weapon, hud, sfx,
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
window.addEventListener('keydown', (e) => keys.add(e.code));
window.addEventListener('keyup', (e) => keys.delete(e.code));
window.addEventListener('mousemove', (e) => {
  if (document.pointerLockElement) player.onMouseMove(e.movementX, e.movementY);
});
window.addEventListener('mousedown', (e) => { if (e.button === 0) mouseDown = true; });
window.addEventListener('mouseup', (e) => { if (e.button === 0) mouseDown = false; });

$('title-overlay').addEventListener('click', () => {
  initAudio();
  music.start();
  $('title-overlay').classList.add('hidden');
  state = 'playing';
  canvas.requestPointerLock();
  hud.message('SPRINT PLANNING: Das Board zeigt deine 5 Tickets. Geh nach rechts zum ersten! →', 5);
});

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
const _center = new THREE.Vector3();

function fire() {
  weapon.onFire(time);
  sfx.shoot();
  camera.getWorldDirection(_dir);
  const h = Math.hypot(_dir.x, _dir.z);
  let wallT = CONFIG.weapon.range;
  if (h > 1e-4) {
    wallT = level.raycastWall(player.pos.x, player.pos.z, _dir.x / h, _dir.z / h, CONFIG.weapon.range) / h;
  }
  let hitT = Infinity;
  if (boss.alive) {
    _center.set(boss.pos.x, 1.9, boss.pos.z);
    hitT = raySphereT(camera.position, _dir, _center, CONFIG.boss.hitRadius);
  }
  if (hitT < wallT && hitT < CONFIG.weapon.range) {
    weapon.hits++;
    sfx.hitEnemy();
    const justDied = boss.takeDamage(CONFIG.weapon.damage * (0.8 + Math.random() * 0.4));
    if (justDied) sprint.onBossKilled(time);
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

  projectiles.update(dt, level, player, (dmg) => {
    const dead = player.damage(dmg);
    hud.flashDamage();
    sfx.playerHurt();
    hud.setFaceTemp('hurt', 0.6);
    if (dead && sprint.phase === 'fight') sprint.onPlayerDown(time);
  });

  if (mouseDown && weapon.canFire(time)) fire();

  weapon.update(dt, player.moving);
  hud.tick(dt, player.health);
  hud.setHealth(player.health);
  if (boss.alive) hud.bossHp(boss.hp / boss.maxHp);

  player.applyToCamera(camera);
}

let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (state === 'playing' && !paused) update(dt);
  renderer.render(scene, camera);
}
player.applyToCamera(camera);
requestAnimationFrame(frame);

// Debug-Zugriff für Tests
window.SD = { player, boss, sprint, level, weapon, hud, camera, CONFIG, get time() { return time; } };
