// SPRINT DOOM balance gate.
// Deterministic invariants over CONFIG so difficulty tuning stays sane:
// the ladder must be monotonic, tiers 0-3 must stay winnable, the last tier
// (Albtraum) must stay brutal but not mathematically impossible.
// Run: node tools/balance-check.mjs  (wired into .git/hooks/pre-commit)
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONFIG } from '../js/config.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const check = (cond, msg) => { if (!cond) errors.push(msg); };

const D = CONFIG.difficulties;
const P = CONFIG.player;
const finale = CONFIG.tickets[CONFIG.tickets.length - 1];
// TTK bounds assume the player picks the strongest sustained weapon
check(Array.isArray(CONFIG.weapons) && CONFIG.weapons.length > 0, 'weapons: arsenal missing or empty');
(CONFIG.weapons || []).forEach((w) => {
  check(w.damage > 0 && w.fireInterval > 0 && w.pellets >= 1, `weapon ${w.name}: invalid damage/fireInterval/pellets`);
});
const playerDps = Math.max(...(CONFIG.weapons || []).map(w => (w.damage * w.pellets) / w.fireInterval));
check(Number.isFinite(playerDps) && playerDps > 0, 'weapons: player DPS not computable');
const last = D.length - 1;

// Pattern keys actually implemented in enemy.js (parsed, so they can't drift)
const enemySrc = readFileSync(join(root, 'js/enemy.js'), 'utf8');
const block = enemySrc.slice(enemySrc.indexOf('const PATTERNS = {'), enemySrc.indexOf('\n};'));
const knownPatterns = new Set([...block.matchAll(/^\s{2}(\w+):\s*\{/gm)].map(m => m[1]));
check(knownPatterns.size >= 5, `could not parse PATTERNS from enemy.js (found ${knownPatterns.size})`);

const KILLERS = ['mg', 'wall', 'rain', 'cluster', 'spiral'];

// ---------- Per-tier structure and absolute bounds ----------
D.forEach((d, i) => {
  const id = `tier ${i} (${d.name})`;
  for (const f of ['hp', 'dmg', 'speed', 'fire', 'proj', 'wind', 'volley', 'heal', 'adds']) {
    check(typeof d[f] === 'number' && d[f] > 0 || (f === 'adds' && d[f] >= 0), `${id}: field ${f} missing or invalid`);
  }
  check(Number.isInteger(d.adds) && d.adds >= 0 && d.adds <= 4, `${id}: adds must be an integer 0-4 (pool size)`);
  check(Number.isInteger(d.volley) && d.volley >= 1 && d.volley <= 4, `${id}: volley must be 1-4`);
  check(d.patterns && Object.keys(d.patterns).length > 0, `${id}: empty pattern pool`);
  for (const [k, w] of Object.entries(d.patterns || {})) {
    check(knownPatterns.has(k), `${id}: pattern '${k}' not implemented in enemy.js`);
    check(w > 0, `${id}: pattern '${k}' has non-positive weight`);
  }
  // Coffee break must always heal something noticeable
  check(P.coffeeHeal * d.heal >= 8, `${id}: coffee break heals ${(P.coffeeHeal * d.heal).toFixed(1)} (< 8)`);
  // Never a one-shot from full health, not even on the last tier
  check(finale.projDamage * d.dmg < P.maxHealth, `${id}: finale boss one-shots the player`);
});

// ---------- Ladder monotonicity ----------
for (let i = 1; i < D.length; i++) {
  const a = D[i - 1], b = D[i], id = `tier ${i - 1}→${i}`;
  for (const f of ['hp', 'dmg', 'speed', 'proj', 'volley', 'adds']) {
    check(b[f] >= a[f], `${id}: ${f} decreases (${a[f]} → ${b[f]})`);
  }
  for (const f of ['fire', 'wind', 'heal']) {
    check(b[f] <= a[f], `${id}: ${f} increases (${a[f]} → ${b[f]}) — easier, not harder`);
  }
  const threat = (d) => (d.dmg * d.volley * d.proj) / d.fire + d.adds;
  check(threat(b) > threat(a), `${id}: composite threat not strictly increasing`);
}

// ---------- Winnable tiers (all but the last) ----------
D.slice(0, last).forEach((d, i) => {
  const id = `tier ${i} (${d.name})`;
  const ttk = (finale.hp * d.hp) / playerDps;
  check(ttk <= 14, `${id}: finale time-to-kill ${ttk.toFixed(1)}s > 14s`);
  check(finale.projDamage * d.dmg < P.maxHealth / 2, `${id}: player dies in 2 hits — reserved for the last tier`);
  check(finale.speed * d.speed < P.speed, `${id}: boss outruns the player — reserved for the last tier`);
  const cycle = finale.windup * d.wind + finale.fireInterval * d.fire;
  check(cycle >= 0.5, `${id}: finale shot cycle ${cycle.toFixed(2)}s < 0.5s`);
  check(finale.projSpeed * d.proj <= 24, `${id}: finale projectiles ${(finale.projSpeed * d.proj).toFixed(1)} u/s > 24 (undodgeable)`);
});

// Easy tiers stay gentle: no killer patterns, no entourage
D.slice(0, 2).forEach((d, i) => {
  const bad = KILLERS.filter(k => d.patterns[k]);
  check(bad.length === 0, `tier ${i} (${d.name}): killer patterns [${bad}] on an easy tier`);
  check(d.adds === 0, `tier ${i} (${d.name}): easy tiers bring no consultants`);
});

// ---------- Last tier: brutal but not mathematically impossible ----------
{
  const d = D[last], id = `tier ${last} (${d.name})`;
  const ttk = (finale.hp * d.hp) / playerDps;
  check(ttk <= 25, `${id}: finale time-to-kill ${ttk.toFixed(1)}s > 25s (impossible, not 'almost')`);
  const cycle = finale.windup * d.wind + finale.fireInterval * d.fire;
  check(cycle >= 0.25, `${id}: finale shot cycle ${cycle.toFixed(2)}s < 0.25s (no reaction window)`);
  check(Object.keys(d.patterns).length >= 8, `${id}: nightmare pool should stay varied (≥ 8 patterns)`);
}

// ---------- Sprint economy stays reachable ----------
{
  const mins = CONFIG.tickets.reduce((s, t) => s + t.min, 0);
  const maxs = CONFIG.tickets.reduce((s, t) => s + t.max, 0);
  check(CONFIG.sprint.min < CONFIG.sprint.max, 'sprint: min >= max');
  check(maxs >= CONFIG.sprint.min, `sprint: even perfect play (${maxs} SP) misses the ${CONFIG.sprint.min} SP floor`);
  check(mins <= CONFIG.sprint.max, `sprint: guaranteed points (${mins} SP) already overshoot the ${CONFIG.sprint.max} SP cap`);
  CONFIG.tickets.forEach((t) => check(t.min < t.max, `ticket ${t.code}: min >= max`));
}

if (errors.length) {
  console.error(`BALANCE GATE: ${errors.length} violation(s)\n` + errors.map(e => `  ✗ ${e}`).join('\n'));
  process.exit(1);
}
console.log(`BALANCE GATE: ok — ${D.length} tiers, ${knownPatterns.size} patterns, invariants hold.`);
