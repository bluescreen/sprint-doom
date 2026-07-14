// HUD: Nerven-Balken, denkwerk-Guy-Gesicht, Ticket-Anzeige, Boss-Bar, Velocity-Gauge, Screens.
import { CONFIG } from './config.js';
import { makeFaces } from './sprites.js';

const $ = (id) => document.getElementById(id);

export class Hud {
  constructor() {
    this.faces = makeFaces();
    this.faceCtx = $('face').getContext('2d');
    this.faceState = '';
    this.faceTemp = null;
    this.faceTempT = 0;
    this.msgT = 0;
    this.tickerT = 0;
    this.cardT = 0;
    this.awardT = 0;
    this.setHealth(100);
    this.setVelocity(0);
    this.drawFace('ok');
  }

  // ---------- Health ----------
  setHealth(h) {
    const f = $('hp-fill');
    f.style.width = h + '%';
    f.className = h > 55 ? '' : h > 25 ? 'mid' : 'low';
    $('hp-num').textContent = Math.ceil(h);
  }

  flashDamage() {
    const el = $('dmg-flash');
    el.style.transition = 'none';
    el.style.opacity = 0.45;
    requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.35s ease-out';
      el.style.opacity = 0;
    });
  }

  // ---------- Gesicht ----------
  drawFace(state) {
    if (state === this.faceState) return;
    this.faceState = state;
    this.faceCtx.clearRect(0, 0, 32, 32);
    this.faceCtx.drawImage(this.faces[state], 0, 0);
  }

  setFaceTemp(state, dur) {
    this.faceTemp = state;
    this.faceTempT = dur;
  }

  tick(dt, health) {
    if (this.faceTempT > 0) {
      this.faceTempT -= dt;
      this.drawFace(this.faceTemp);
    } else {
      this.drawFace(health > 70 ? 'ok' : health > 40 ? 'worried' : 'hurt');
    }
    if (this.msgT > 0) { this.msgT -= dt; if (this.msgT <= 0) $('message').classList.add('hidden'); }
    if (this.tickerT > 0) { this.tickerT -= dt; if (this.tickerT <= 0) $('ticker').classList.add('hidden'); }
    if (this.cardT > 0) { this.cardT -= dt; if (this.cardT <= 0) this.hideTicketCard(); }
    if (this.awardT > 0) { this.awardT -= dt; if (this.awardT <= 0) $('award').classList.add('hidden'); }
  }

  // ---------- Meldungen ----------
  message(text, dur, delay = 0) {
    setTimeout(() => {
      $('message').textContent = text;
      $('message').classList.remove('hidden');
      this.msgT = dur;
    }, delay * 1000);
  }

  ticker(text) {
    $('ticker').textContent = `KUNDE: „${text}“`;
    $('ticker').classList.remove('hidden');
    this.tickerT = 2.4;
  }

  // ---------- Ticket ----------
  showTicketCard(cfg) {
    $('tc-code').textContent = cfg.code + ' · NEUES TICKET';
    $('tc-title').textContent = cfg.title;
    $('tc-range').textContent = `Verhandlungsspanne: ${cfg.min}–${cfg.max} SP`;
    $('ticket-card').classList.remove('hidden');
    this.cardT = 3.2;
    $('ticket-mini').textContent = `${cfg.code} · ${cfg.min}–${cfg.max} SP`;
  }

  hideTicketCard() {
    $('ticket-card').classList.add('hidden');
    this.cardT = 0;
  }

  setTicketMini(res, idx) {
    $('ticket-mini').textContent = res.lost
      ? `${res.cfg.code} verloren (0 SP)`
      : `${res.cfg.code} → ${res.points} SP`;
  }

  // ---------- Boss ----------
  bossShow(cfg) {
    $('boss-title').textContent = `DER KUNDE — verhandelt ${cfg.code}`;
    $('boss-fill').style.width = '100%';
    $('boss-wrap').classList.remove('hidden');
  }

  bossHp(frac) {
    $('boss-fill').style.width = Math.max(0, frac * 100) + '%';
  }

  hideBoss() { $('boss-wrap').classList.add('hidden'); }

  // ---------- Punkte & Velocity ----------
  award(res) {
    const el = $('award');
    el.classList.remove('hidden');
    el.classList.toggle('bad', res.lost || res.score < 0.35);
    $('award-points').textContent = res.lost ? 'TICKET VERLOREN' : `+${res.points} STORY POINTS`;
    $('award-quip').textContent = res.lost
      ? 'Nervenzusammenbruch! Der Kunde streicht das Ticket.'
      : res.score >= 0.7 ? 'STARKE VERHANDLUNG!'
      : res.score >= 0.4 ? 'Solider Deal.'
      : 'Der Kunde hat dich runtergehandelt…';
    this.awardT = 2.6;
  }

  setVelocity(total) {
    const max = CONFIG.sprint.maxPossible;
    const f = $('velo-fill');
    f.style.width = Math.min(100, (total / max) * 100) + '%';
    f.className = total > CONFIG.sprint.max ? 'over'
      : total >= CONFIG.sprint.min ? 'good' : '';
    $('velo-num').textContent = total + ' SP';
  }

  // ---------- End-Screen ----------
  showEnd(results, total) {
    const { min, max } = CONFIG.sprint;
    const v = $('end-verdict');
    if (total >= min && total <= max) {
      v.textContent = `SPRINT ERFOLGREICH! ${total} SP — faire Punkte, zufriedenes Team, zähneknirschender Kunde. So muss das.`;
      v.className = 'win';
      $('end-title').innerHTML = 'SPRINT <span class="marker">REVIEW</span>';
    } else if (total < min) {
      v.textContent = `NUR ${total} SP — der Kunde kam zu billig davon. denkwerk zahlt drauf, das Team macht Überstunden umsonst.`;
      v.className = 'under';
      $('end-title').textContent = 'SPRINT REVIEW';
    } else {
      v.textContent = `${total} SP — überverkauft! Das Team kollabiert unter der Last, der Sprint scheitert. Weniger ist manchmal mehr.`;
      v.className = 'over';
      $('end-title').textContent = 'SPRINT REVIEW';
    }

    const rows = results.map((r) => `
      <tr>
        <td>${r.cfg.code}</td>
        <td>${r.cfg.title.replace('FINALE: ', '')}</td>
        <td class="num ${r.lost ? 'lost' : ''}">${r.lost ? '✗ 0' : r.points} SP</td>
        <td class="num">${r.t.toFixed(1)}s</td>
        <td class="num">${Math.round(r.acc * 100)}%</td>
      </tr>`).join('');
    $('end-stats').innerHTML = `
      <tr><th>Ticket</th><th></th><th class="num">Punkte</th><th class="num">Zeit</th><th class="num">Treffer</th></tr>
      ${rows}`;
    $('end-total').textContent = `VELOCITY: ${total} SP (Ziel: ${min}–${max})`;
    $('end-overlay').classList.remove('hidden');
  }
}
