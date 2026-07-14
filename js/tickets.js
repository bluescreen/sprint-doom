// Sprint-Meta-Game: Raum-Trigger, Punkteformel, Velocity, Ticket-Ergebnisse.
import { CONFIG } from './config.js';
import { music } from './audio.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class SprintManager {
  constructor({ level, player, boss, adds, projectiles, weapon, hud, sfx, pickups, onGameOver }) {
    this.level = level;
    this.player = player;
    this.boss = boss;
    this.adds = adds;
    this.projectiles = projectiles;
    this.weapon = weapon;
    this.hud = hud;
    this.sfx = sfx;
    this.pickups = pickups;
    this.onGameOver = onGameOver;
    this.current = 0;
    this.phase = 'roam'; // roam | fight
    this.results = [];
    this.total = 0;
    this.finished = false;
    this.prepared = false; // room crew stands behind the glass, waiting
  }

  update(time) {
    if (this.finished || this.phase !== 'roam' || this.current >= 5 || !this.prepared) return;
    const room = this.level.rooms[this.current];
    if (room.inside(this.player.pos.x, this.player.pos.z)) this.startFight(time);
  }

  // Pre-spawn the customer and his consultants dormant, visible through the glass
  prepareRoom() {
    if (this.finished || this.current >= 5) return;
    const room = this.level.rooms[this.current];
    const base = CONFIG.tickets[this.current];
    const d = CONFIG.difficulties[CONFIG.skill];
    const finale = base.id === 5;
    const bb = CONFIG.bigboss;
    // parTime scales with hp so the time score stays reachable on higher skills
    const cfg = this.cfg = {
      ...base,
      hp: Math.round(base.hp * d.hp * (finale ? bb.hp : 1)),
      speed: base.speed * d.speed,
      fireInterval: base.fireInterval * d.fire,
      windup: base.windup * d.wind,
      projDamage: Math.round(base.projDamage * d.dmg * (finale ? bb.dmg : 1)),
      projSpeed: base.projSpeed * d.proj,
      volley: d.volley,
      patterns: d.patterns,
      parTime: base.parTime * d.hp * (finale ? bb.hp : 1),
      // Jeder Kunde rastet unter 30 % HP aus; der CEO wie gehabt früher & härter
      rage: finale
        ? { ...bb.rage, taunt: 'JETZT REDE ICH!' }
        : { at: 0.3, fire: 0.75, proj: 1.12, speed: 1.25, taunt: 'SO NICHT, FREUNDCHEN!' },
      bossName: finale ? 'DER CEO PERSÖNLICH' : 'DER KUNDE',
    };
    this.boss.setVariant(finale ? 'bigboss' : 'boss');
    this.boss.spawn(cfg, room.bossSpawn, true);
    this.addCount = d.adds ? Math.min(4, d.adds + (base.id >= 4 ? 1 : 0)) : 0;
    this.adds.spawn(cfg, room, this.addCount, true);
    this.prepared = true;
  }

  startFight(time) {
    const room = this.level.rooms[this.current];
    const cfg = this.cfg;
    room.state = 'fight';
    this.phase = 'fight';
    this.level.doors[this.current].locked = true; // Tür fällt hinter dir zu
    this.boss.wake();
    this.adds.wakeAll();
    if (this.addCount) this.hud.ticker('Ich habe meine Berater mitgebracht!');
    this.weapon.resetStats();
    this.t0 = time;
    this.h0 = Math.max(1, this.player.health);
    this.hud.showTicketCard(cfg);
    this.hud.bossShow(cfg);
    this.sfx.doorSlam();
    this.pickups.spawnArena(room, this.level);
    music.setFight(true, cfg.id === 5); // Finale: Boss-Stufe der Kampfmusik
  }

  onBossKilled(time) {
    const cfg = this.cfg;
    this.adds.despawnAll(); // the entourage leaves with the customer
    const t = time - this.t0;
    const timeFactor = clamp(1 - (t - cfg.parTime) / (2 * cfg.parTime), 0, 1);
    const acc = this.weapon.accuracy;
    const healthFactor = clamp(this.player.health / this.h0, 0, 1);
    const score = 0.4 * timeFactor + 0.35 * acc + 0.25 * healthFactor;
    const points = Math.round(cfg.min + score * (cfg.max - cfg.min));
    this.sfx.bossDie();
    this.finishTicket({ cfg, points, score, t, acc, lost: false });
  }

  onPlayerDown(time) {
    const cfg = this.cfg;
    this.boss.despawn();
    this.adds.despawnAll();
    this.projectiles.clear();
    this.player.health = CONFIG.player.respawnHealth;
    this.sfx.breakdown();
    this.finishTicket({ cfg, points: 0, score: 0, t: time - this.t0, acc: this.weapon.accuracy, lost: true });
  }

  finishTicket(res) {
    music.setFight(false);
    this.pickups.clearArena();
    this.results.push(res);
    this.total += res.points;
    this.hud.hideBoss();
    this.hud.hideTicketCard();
    this.hud.award(res);
    this.hud.setVelocity(this.total);
    this.hud.setTicketMini(res, this.current);

    if (res.lost) {
      this.hud.setFaceTemp('dead', 2.2);
    } else {
      this.sfx.award(res.score >= 0.55);
      this.hud.setFaceTemp(res.score >= 0.55 ? 'grin' : 'sad', 2.2);
      const heal = Math.round(CONFIG.player.coffeeHeal * CONFIG.difficulties[CONFIG.skill].heal);
      this.player.health = Math.min(CONFIG.player.maxHealth, this.player.health + heal);
      this.hud.message(`☕ Kaffeepause: +${heal} Nerven`, 2.4);
    }

    this.level.doors[this.current].locked = false;
    if (this.current < 4) this.level.doors[this.current + 1].locked = false;
    this.level.rooms[this.current].state = 'done';
    this.phase = 'roam';
    this.current++;
    this.prepared = false;
    // Small delay so the fallen customer stays on the floor for a moment
    // before the same sprite pool mans the next room behind its glass.
    if (this.current < 5) setTimeout(() => this.prepareRoom(), 1800);

    if (this.current === 5) {
      this.finished = true;
      setTimeout(() => this.onGameOver(this.results, this.total), 2800);
    } else {
      this.pickups.spawnWave(2);
      this.hud.message(res.lost
        ? 'Ticket verloren… weiter zum nächsten →'
        : 'Weiter zum nächsten Ticket →', 2.4, 2.6);
      this.hud.message('Psst: Goodies in den Nebenräumen aufgetaucht!', 2.6, 5.2);
    }
  }
}
