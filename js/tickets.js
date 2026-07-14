// Sprint-Meta-Game: Raum-Trigger, Punkteformel, Velocity, Ticket-Ergebnisse.
import { CONFIG } from './config.js';
import { music } from './audio.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class SprintManager {
  constructor({ level, player, boss, projectiles, weapon, hud, sfx, onGameOver }) {
    this.level = level;
    this.player = player;
    this.boss = boss;
    this.projectiles = projectiles;
    this.weapon = weapon;
    this.hud = hud;
    this.sfx = sfx;
    this.onGameOver = onGameOver;
    this.current = 0;
    this.phase = 'roam'; // roam | fight
    this.results = [];
    this.total = 0;
    this.finished = false;
  }

  update(time) {
    if (this.finished || this.phase !== 'roam' || this.current >= 5) return;
    const room = this.level.rooms[this.current];
    if (this.player.pos.x > room.entryX) this.startFight(time);
  }

  startFight(time) {
    const room = this.level.rooms[this.current];
    const cfg = CONFIG.tickets[this.current];
    room.state = 'fight';
    this.phase = 'fight';
    this.level.doors[this.current].locked = true; // Tür fällt hinter dir zu
    this.boss.spawn(cfg, room.bossSpawn);
    this.weapon.resetStats();
    this.t0 = time;
    this.h0 = Math.max(1, this.player.health);
    this.hud.showTicketCard(cfg);
    this.hud.bossShow(cfg);
    this.sfx.doorSlam();
    music.setFight(true);
  }

  onBossKilled(time) {
    const cfg = CONFIG.tickets[this.current];
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
    const cfg = CONFIG.tickets[this.current];
    this.boss.despawn();
    this.projectiles.clear();
    this.player.health = CONFIG.player.respawnHealth;
    this.sfx.breakdown();
    this.finishTicket({ cfg, points: 0, score: 0, t: time - this.t0, acc: this.weapon.accuracy, lost: true });
  }

  finishTicket(res) {
    music.setFight(false);
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
      const heal = CONFIG.player.coffeeHeal;
      this.player.health = Math.min(CONFIG.player.maxHealth, this.player.health + heal);
      this.hud.message(`☕ Kaffeepause: +${heal} Nerven`, 2.4);
    }

    this.level.doors[this.current].locked = false;
    if (this.current < 4) this.level.doors[this.current + 1].locked = false;
    this.level.rooms[this.current].state = 'done';
    this.phase = 'roam';
    this.current++;

    if (this.current === 5) {
      this.finished = true;
      setTimeout(() => this.onGameOver(this.results, this.total), 2800);
    } else if (!res.lost) {
      this.hud.message('Weiter zum nächsten Ticket →', 2.4, 2.6);
    } else {
      this.hud.message('Ticket verloren… weiter zum nächsten →', 2.6, 2.6);
    }
  }
}
