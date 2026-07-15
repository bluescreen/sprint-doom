// Grid-Level nach dem 3.BA-Grundriss der denkwerk-Etage (399 m²):
// KONFIZONE als zentraler Korridor, die Meetingräume (= Ticket-Räume) im Süden
// mit Schiebetüren + Glaswänden, Technik/Kicker/Archiv/Lager/Küche im Norden.
import * as THREE from 'three';
import { CONFIG } from './config.js';
import {
  makeWallTexture, makeFloorTexture, makeCeilingTexture, makeDoorTexture,
  makeGlassDoorTexture, makeBoardTexture, makeWindowTexture, makeGlassTexture,
  makeSignTexture, makeVaultTexture, makeWoodDoorTexture, makeDarkWallTexture,
  makePlasterCeilingTexture,
} from './textures.js';

const T = CONFIG.tileSize;

// Legende: '#' Wand · '.' frei · 'W' Außenfenster · 'G' Glaswand · 'M' schwarzer
// Mural-Block (Workshopraum-Front) · '1'–'5' Schiebetür Ticket-Raum.
// Front nach den Fotos/dem Video: überwiegend weiße Wand, je ein Glasfeld neben
// der Tür — nur der Workshopraum hat Glasfront + schwarzen Block.
const MAP = [
  '##################################################',
  '#......#.....#.....#.....#...#.............#.....#',
  '#......#.....#.....#.....#...#...................#',
  '#......#.....#.....#.....#...#.............#.....#',
  '#......#.....#.....#.....#...#.............#.....#',
  '#......#.....#.....#.....#...#.............#.....#',
  '#......#.....#.....#.....#...#.............#.....#',
  '#####.####.#####.#####.####.##.............#######',
  '#................................................#',
  '###G11G######G22G##G33G##MMM44GGGG###G55G#####.###',
  '#...........#.....#.....#.........#.........#....#',
  '#...........#.....#.....#.........#.........#....W',
  '#...........#.....#.....#.........#.........#....W',
  '#...........#.....#.....#.........#.........#....W',
  '#...........#.....#.....#.........#.........#....W',
  '#...........#.....#.....#.........#.........#....#',
  '#...........#.....#.....#.........#.........#....#',
  '#...........#.....#.....#.........#.........#....#',
  '#...........#.....#.....#.........#.........#....#',
  '##WWWWWWWWWW##WWW###WWW###WWWWWWW###WWWWWWW#######',
];

const DOOR_ROW = 9;

// Ticket-Räume = die 5 Meetingräume südlich der Konfizone (Spaltenbereiche in Tiles).
const ROOM_DEFS = [
  { name: 'Konferenzraum 1', x0: 1, x1: 11 },
  { name: 'Besprechungsraum 1', x0: 13, x1: 17 },
  { name: 'Besprechungsraum 2', x0: 19, x1: 23 },
  { name: 'Workshopraum', x0: 25, x1: 33 },
  { name: 'Konferenzraum 2', x0: 35, x1: 43 },
];

export function buildLevel(scene) {
  const ROWS = MAP.length, COLS = MAP[0].length;

  // 0 = begehbar, 1 = Wand, 2 = Fenster, 3 = Glaswand, 4 = schwarzer Mural-Block
  const grid = MAP.map((row) => [...row].map((ch) =>
    ch === '#' ? 1 : ch === 'W' ? 2 : ch === 'G' ? 3 : ch === 'M' ? 4 : 0));

  const rooms = ROOM_DEFS.map((def, i) => ({
    index: i,
    name: def.name,
    x0: def.x0, x1: def.x1,
    bossSpawn: { x: ((def.x0 + def.x1 + 1) / 2) * T, z: 17 * T },
    inside: (x, z) => z > 10.5 * T && x > def.x0 * T && x < (def.x1 + 1) * T,
    state: 'pending',
  }));

  // ---------- Türen (Schiebetüren in der Südwand der Konfizone) ----------
  const doorCols = [[], [], [], [], []];
  [...MAP[DOOR_ROW]].forEach((ch, c) => {
    if (ch >= '1' && ch <= '5') doorCols[+ch - 1].push(c);
  });

  // Alle Meetingräume haben Glasschiebetüren (Fotos/Video); die Ahorn-Schiebetüren
  // gehören zu den Nordräumen — siehe unten.
  const glassDoorTex = makeGlassDoorTexture();
  const doors = doorCols.map((cols, i) => {
    const c0 = cols[0], c1 = cols[cols.length - 1];
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry((c1 - c0 + 1) * T, CONFIG.wallHeight, 0.7),
      new THREE.MeshBasicMaterial({ map: glassDoorTex, transparent: true })
    );
    mesh.position.set(((c0 + c1 + 1) / 2) * T, CONFIG.wallHeight / 2, (DOOR_ROW + 0.5) * T);
    scene.add(mesh);
    return {
      mesh, c0, c1, index: i,
      baseY: CONFIG.wallHeight / 2,
      open: 0, target: 0, lastTarget: 0,
      locked: i > 0, // nur Konferenzraum 1 ist anfangs frei
    };
  });

  // Ahorn-Schiebetüren der Nordräume (Video/Foto IMG…080554): Scheunentor-Panels
  // auf Laufschiene, aufgeschoben neben der Öffnung — rein dekorativ.
  const woodDoorTex = makeWoodDoorTexture();
  const woodDoorMat = new THREE.MeshBasicMaterial({ map: woodDoorTex });
  const railMat = new THREE.MeshBasicMaterial({ color: 0x2a2d34 });
  const NORTH_WALL_ROW = 7;
  for (const c of [5, 10, 16, 22, 27]) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.5, 0.14), woodDoorMat);
    panel.position.set((c + 1.5) * T, 1.8, (NORTH_WALL_ROW + 1) * T + 0.14);
    scene.add(panel);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(2 * T, 0.09, 0.06), railMat);
    rail.position.set((c + 1) * T, 3.62, (NORTH_WALL_ROW + 1) * T + 0.24);
    scene.add(rail);
  }

  function isSolid(c, r) {
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return true;
    if (grid[r][c] >= 1) return true;
    if (r === DOOR_ROW) {
      for (const d of doors) if (c >= d.c0 && c <= d.c1 && d.open < 0.7) return true;
    }
    return false;
  }

  // Von Möbeln belegte Zellen: blockieren Bewegung, aber nicht Schüsse/Projektile
  // (man schießt über einen Konferenztisch hinweg).
  const blocked = new Set();
  const block = (c, r) => blocked.add(c + ',' + r);
  function isSolidMove(c, r) {
    return isSolid(c, r) || blocked.has(c + ',' + r);
  }

  function isSolidWorld(wx, wz) {
    return isSolid(Math.floor(wx / T), Math.floor(wz / T));
  }

  // 2D-DDA: Distanz bis zur ersten Wand entlang (dx,dz) (normalisiert)
  function raycastWall(ox, oz, dx, dz, maxDist) {
    let cx = Math.floor(ox / T), cz = Math.floor(oz / T);
    const stepX = dx > 0 ? 1 : -1, stepZ = dz > 0 ? 1 : -1;
    const tDeltaX = dx !== 0 ? Math.abs(T / dx) : Infinity;
    const tDeltaZ = dz !== 0 ? Math.abs(T / dz) : Infinity;
    let tMaxX = dx !== 0 ? (dx > 0 ? (cx + 1) * T - ox : ox - cx * T) / Math.abs(dx) : Infinity;
    let tMaxZ = dz !== 0 ? (dz > 0 ? (cz + 1) * T - oz : oz - cz * T) / Math.abs(dz) : Infinity;
    let t = 0;
    for (let i = 0; i < 256; i++) {
      if (tMaxX < tMaxZ) { t = tMaxX; tMaxX += tDeltaX; cx += stepX; }
      else { t = tMaxZ; tMaxZ += tDeltaZ; cz += stepZ; }
      if (t > maxDist) return maxDist;
      if (isSolid(cx, cz)) return t;
    }
    return maxDist;
  }

  let onDoorMove = null;

  function updateDoors(dt, playerPos) {
    for (const d of doors) {
      const dx = playerPos.x - ((d.c0 + d.c1 + 1) / 2) * T;
      const dz = playerPos.z - (DOOR_ROW + 0.5) * T;
      const near = Math.hypot(dx, dz) < 9;
      d.target = (!d.locked && near) ? 1 : 0;
      if (d.target !== d.lastTarget) {
        d.lastTarget = d.target;
        if (onDoorMove) onDoorMove(d);
      }
      const diff = d.target - d.open;
      if (diff !== 0) {
        d.open += Math.sign(diff) * 2.2 * dt;
        d.open = Math.max(0, Math.min(1, d.open));
        d.mesh.position.y = d.baseY + d.open * (CONFIG.wallHeight + 0.4);
      }
    }
  }

  // ---------- Geometrie: Wände, Fenster, Glaswände als InstancedMeshes ----------
  // Glas (Typ 3) rendert mit echter Transparenz; depthWrite aus, damit
  // Sprites (Kunde, Ausreden) dahinter korrekt durchscheinen.
  const typeTex = {
    1: makeWallTexture(), 2: makeWindowTexture(), 3: makeGlassTexture(),
    4: makeDarkWallTexture(),
  };
  const m = new THREE.Matrix4();
  for (const type of [1, 2, 3, 4]) {
    let count = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c] === type) count++;
    const im = new THREE.InstancedMesh(
      // Glas ist eine dünne Scheibe in Flucht mit den Schiebetüren, kein voller Block
      type === 3
        ? new THREE.BoxGeometry(T, CONFIG.wallHeight, 0.35)
        : new THREE.BoxGeometry(T, CONFIG.wallHeight, T),
      new THREE.MeshBasicMaterial(
        type === 3 ? { map: typeTex[3], transparent: true, depthWrite: false } : { map: typeTex[type] }
      ),
      count
    );
    let idx = 0;
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (grid[r][c] === type) {
          m.setPosition((c + 0.5) * T, CONFIG.wallHeight / 2, (r + 0.5) * T);
          im.setMatrixAt(idx++, m);
        }
    scene.add(im);
  }

  const floorTex = makeFloorTexture();
  floorTex.repeat.set(COLS / 2, ROWS / 2); // 2×2 Kacheln pro Textur — weniger sichtbare Wiederholung
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(COLS * T, ROWS * T),
    new THREE.MeshBasicMaterial({ map: floorTex })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(COLS * T / 2, 0, ROWS * T / 2);
  scene.add(floor);

  // Flache Decken über den Räumen; die Konfizone (Zeilen 7–10) bleibt frei für das
  // Tonnengewölbe. Norden: Sichtbeton mit Technik — Süden (Meetingräume): weißer Putz
  // mit Spots, wie auf den Raum-Fotos.
  const flatCeiling = (r0, r1, tex) => {
    tex.repeat.set(COLS, r1 - r0);
    const p = new THREE.Mesh(
      new THREE.PlaneGeometry(COLS * T, (r1 - r0) * T),
      new THREE.MeshBasicMaterial({ map: tex })
    );
    p.rotation.x = Math.PI / 2;
    p.position.set(COLS * T / 2, CONFIG.wallHeight, ((r0 + r1) / 2) * T);
    scene.add(p);
  };
  flatCeiling(0, 8, makeCeilingTexture());
  flatCeiling(9, ROWS, makePlasterCeilingTexture());

  // Tonnengewölbe über der schmalen Konfizone — der Bogen aus dem Flur-Foto (bow.png)
  const vaultTex = makeVaultTexture();
  vaultTex.repeat.set(1, 48);
  const vaultGeo = new THREE.CylinderGeometry(T / 2, T / 2, 48 * T, 16, 1, true, 0, Math.PI);
  vaultGeo.rotateZ(Math.PI / 2);
  const vault = new THREE.Mesh(
    vaultGeo,
    new THREE.MeshBasicMaterial({ map: vaultTex, side: THREE.BackSide })
  );
  vault.position.set(25 * T, CONFIG.wallHeight, 8.5 * T);
  vault.scale.y = 0.7;
  scene.add(vault);

  const capMat = new THREE.MeshBasicMaterial({ color: 0xddd9d2 });
  const capGeo = new THREE.CircleGeometry(T / 2, 16, 0, Math.PI);
  for (const [cx, ry] of [[T + 0.05, Math.PI / 2], [49 * T - 0.05, -Math.PI / 2]]) {
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(cx, CONFIG.wallHeight, 8.5 * T);
    cap.scale.y = 0.7;
    cap.rotation.y = ry;
    scene.add(cap);
  }

  // Warme Wandleuchten an der Nordwand — die Lichterreihe aus bow.png
  const sconceBar = new THREE.MeshBasicMaterial({ color: 0xffd9a0 });
  const sconceBack = new THREE.MeshBasicMaterial({ color: 0x3a3d45 });
  for (const x of [18, 38, 52, 68, 87, 102, 178, 190]) {
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.18, 0.06), sconceBack);
    back.position.set(x, 3.3, 8 * T + 0.05);
    scene.add(back);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.1, 0.08), sconceBar);
    bar.position.set(x, 3.3, 8 * T + 0.09);
    scene.add(bar);
  }

  // ---------- Beschilderung ----------
  const sign = (text, x, y, z, ry = 0, w = 4.4, h = 0.66, opts) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: makeSignTexture(text, opts) })
    );
    mesh.position.set(x, y, z);
    mesh.rotation.y = ry;
    scene.add(mesh);
  };

  // Türschilder der Meetingräume, zur Konfizone gerichtet
  doors.forEach((d, i) => {
    sign(rooms[i].name.toUpperCase(), ((d.c0 + d.c1 + 1) / 2) * T, 3.5, DOOR_ROW * T - 0.06, Math.PI);
  });
  sign('FLÜGELRAUM', 46.5 * T, 3.5, DOOR_ROW * T - 0.06, Math.PI, 3.6, 0.56);

  // Nordräume: Schilder über den Türöffnungen (Südseite der Wand in Zeile 6)
  const northSigns = [
    ['TECHNIKRAUM', 5], ['KICKERRAUM', 10], ['ARCHIV FIBU', 16],
    ['OFFICELAGER 1', 22], ['KÜCHE 2', 27],
  ];
  for (const [name, c] of northSigns) sign(name, (c + 0.5) * T, 3.5, 8 * T + 0.06, 0, 3.6, 0.56);
  sign('WC', 43.5 * T, 3.0, 2.5 * T, -Math.PI / 2, 1.4, 0.56);

  // Konfizone-Schriftzug + Fluchtweg + Brandschutztür (T30RS) am Westende
  sign('KONFIZONE', 19.5 * T, 3.3, 8 * T + 0.06, 0, 14, 1.5, { bg: '#ffe449', fg: '#000000', accent: '#000000' });
  sign('→ EXIT / TREPPENHAUS', (COLS - 1) * T - 0.06, 3.2, 8.5 * T, -Math.PI / 2, 5, 0.8, { bg: '#0a7a3a', fg: '#ffffff', accent: '#ffffff' });
  const fireDoor = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 3.8),
    new THREE.MeshBasicMaterial({ map: makeDoorTexture() })
  );
  fireDoor.position.set(T + 0.06, 1.9, 8.5 * T);
  fireDoor.rotation.y = Math.PI / 2;
  scene.add(fireDoor);
  sign('T30RS — BRANDSCHUTZTÜR', T + 0.06, 3.6, 8.5 * T, Math.PI / 2, 3.4, 0.5);

  // Sprint-Board an der Nordwand der Konfizone, nahe Spawn
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 3.6),
    new THREE.MeshBasicMaterial({ map: makeBoardTexture(CONFIG.tickets) })
  );
  board.position.set(7.5 * T, 2.1, 8 * T + 0.06);
  scene.add(board);

  return {
    grid, cols: COLS, rows: ROWS, T,
    rooms, doors,
    playerSpawn: { x: 2.5 * T, z: 8.5 * T },
    isSolid, isSolidMove, isSolidWorld, raycastWall, updateDoors, block,
    set onDoorMove(fn) { onDoorMove = fn; },
  };
}

// Achsengetrennte Kreis-Kollision gegen das Grid + Möbel (Wall-Sliding).
export function collideMove(level, pos, dx, dz, radius) {
  const hit = (x, z) => {
    const c0 = Math.floor((x - radius) / T), c1 = Math.floor((x + radius) / T);
    const r0 = Math.floor((z - radius) / T), r1 = Math.floor((z + radius) / T);
    for (let r = r0; r <= r1; r++)
      for (let c = c0; c <= c1; c++)
        if (level.isSolidMove(c, r)) return true;
    return false;
  };
  if (!hit(pos.x + dx, pos.z)) pos.x += dx;
  if (!hit(pos.x, pos.z + dz)) pos.z += dz;
}
