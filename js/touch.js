// Touch-Steuerung: virtueller Stick links, Blick-Drag rechts, Buttons für
// Feuer/Sprung/Waffenwechsel/Pause. Wird nur auf Coarse-Pointer-Geräten gebaut.
export const isTouchDevice = () =>
  'ontouchstart' in window || window.matchMedia('(pointer: coarse)').matches;

export class TouchControls {
  constructor({ player, keys, onFire, onCycleWeapon, onPause }) {
    this.player = player;
    this.keys = keys;
    this.move = { x: 0, y: 0 }; // analoger Bewegungsvektor für player.update
    document.body.classList.add('touch');
    this.build(onFire, onCycleWeapon, onPause);
  }

  build(onFire, onCycleWeapon, onPause) {
    const mk = (id, text, parent = document.body) => {
      const el = document.createElement('div');
      el.id = id;
      el.textContent = text;
      parent.appendChild(el);
      return el;
    };

    // Blick: Drag auf der rechten Bildschirmhälfte
    const look = mk('tc-look', '');
    let lx = 0, ly = 0;
    look.addEventListener('touchstart', (e) => {
      const t = e.changedTouches[0];
      lx = t.clientX; ly = t.clientY;
    }, { passive: true });
    look.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      this.player.onMouseMove((t.clientX - lx) * 2.2, (t.clientY - ly) * 2.2);
      lx = t.clientX; ly = t.clientY;
    }, { passive: false });

    // Bewegungs-Stick links unten
    const stick = mk('tc-stick', '');
    const knob = mk('tc-knob', '', stick);
    const setMove = (e) => {
      e.preventDefault();
      const r = stick.getBoundingClientRect();
      const t = e.changedTouches[0];
      let x = (t.clientX - (r.left + r.width / 2)) / (r.width / 2);
      let y = (t.clientY - (r.top + r.height / 2)) / (r.height / 2);
      const l = Math.hypot(x, y);
      if (l > 1) { x /= l; y /= l; }
      this.move.x = x;
      this.move.y = -y; // Bildschirm-Y nach unten = rückwärts
      knob.style.transform = `translate(${x * 34}px, ${y * 34}px)`;
    };
    stick.addEventListener('touchstart', setMove, { passive: false });
    stick.addEventListener('touchmove', setMove, { passive: false });
    stick.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.move.x = 0; this.move.y = 0;
      knob.style.transform = '';
    }, { passive: false });

    const btn = (id, label, down, up) => {
      const el = mk(id, label);
      el.classList.add('tc-btn');
      el.addEventListener('touchstart', (e) => { e.preventDefault(); down(); }, { passive: false });
      if (up) el.addEventListener('touchend', (e) => { e.preventDefault(); up(); }, { passive: false });
      return el;
    };
    btn('tc-fire', '⊕', () => onFire(true), () => onFire(false));
    btn('tc-jump', '▲', () => this.keys.add('Space'), () => this.keys.delete('Space'));
    btn('tc-weapon', '⇄', onCycleWeapon);
    btn('tc-pause', 'II', onPause);
  }
}
