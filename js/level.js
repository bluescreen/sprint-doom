// Grid-basiertes Level: Intro-Raum + 5 Ticket-Räume, verbunden durch Korridore mit Schiebetüren.
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { makeWallTexture, makeFloorTexture, makeCeilingTexture, makeDoorTexture, makeBoardTexture } from './textures.js';

const T = CONFIG.tileSize;

export function buildLevel(scene) {
  const introW = 10, roomW = 12, corW = 4, ROWS = 17;
  const COLS = 1 + introW + 5 * (corW + roomW) + 1;

  // 1 = Wand, 0 = begehbar
  const grid = Array.from({ length: ROWS }, () => new Array(COLS).fill(1));
  const carve = (c0, r0, w, h) => {
    for (let r = r0; r < r0 + h; r++)
      for (let c = c0; c < c0 + w; c++) grid[r][c] = 0;
  };

  carve(1, 2, introW, 13); // Intro-Raum
  const rooms = [];
  let x = 1 + introW;
  for (let i = 0; i < 5; i++) {
    carve(x, 7, corW, 3); // Korridor (Zeilen 7–9)
    const doorCol = x + 1;
    const rx = x + corW;
    carve(rx, 2, roomW, 13); // Ticket-Raum
    rooms.push({
      index: i,
      doorCol,
      x0: rx,
      entryX: (rx + 2) * T,
      bossSpawn: { x: (rx + roomW - 2.5) * T, z: 8.5 * T },
      state: 'pending',
    });
    x = rx + roomW;
  }

  // ---------- Türen ----------
  const doorTex = makeDoorTexture();
  const doors = rooms.map((room) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, CONFIG.wallHeight, 3 * T),
      new THREE.MeshBasicMaterial({ map: doorTex })
    );
    mesh.position.set((room.doorCol + 0.5) * T, CONFIG.wallHeight / 2, 8.5 * T);
    scene.add(mesh);
    return {
      mesh, col: room.doorCol, index: room.index,
      baseY: CONFIG.wallHeight / 2,
      open: 0, target: 0, lastTarget: 0,
      locked: room.index > 0, // nur Tür zu Ticket 1 ist anfangs frei
    };
  });

  function isSolid(c, r) {
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return true;
    if (grid[r][c] === 1) return true;
    if (r >= 7 && r <= 9) {
      for (const d of doors) if (d.col === c && d.open < 0.7) return true;
    }
    return false;
  }

  // Von Möbeln belegte Zellen: blockieren Bewegung, aber nicht Schüsse/Projektile
  // (man schießt über einen Schreibtisch hinweg).
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
      const dx = playerPos.x - (d.col + 0.5) * T;
      const dz = playerPos.z - 8.5 * T;
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

  // ---------- Geometrie ----------
  const wallTex = makeWallTexture();
  let wallCount = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c] === 1) wallCount++;
  const walls = new THREE.InstancedMesh(
    new THREE.BoxGeometry(T, CONFIG.wallHeight, T),
    new THREE.MeshBasicMaterial({ map: wallTex }),
    wallCount
  );
  const m = new THREE.Matrix4();
  let idx = 0;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (grid[r][c] === 1) {
        m.setPosition((c + 0.5) * T, CONFIG.wallHeight / 2, (r + 0.5) * T);
        walls.setMatrixAt(idx++, m);
      }
  scene.add(walls);

  const floorTex = makeFloorTexture();
  floorTex.repeat.set(COLS, ROWS);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(COLS * T, ROWS * T),
    new THREE.MeshBasicMaterial({ map: floorTex })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(COLS * T / 2, 0, ROWS * T / 2);
  scene.add(floor);

  const ceilTex = makeCeilingTexture();
  ceilTex.repeat.set(COLS, ROWS);
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(COLS * T, ROWS * T),
    new THREE.MeshBasicMaterial({ map: ceilTex })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(COLS * T / 2, CONFIG.wallHeight, ROWS * T / 2);
  scene.add(ceiling);

  // Sprint-Board an der Nordwand des Intro-Raums
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 3.6),
    new THREE.MeshBasicMaterial({ map: makeBoardTexture(CONFIG.tickets) })
  );
  board.position.set(6 * T, 2.1, 2 * T + 0.06);
  scene.add(board);

  return {
    grid, cols: COLS, rows: ROWS, T,
    rooms, doors,
    playerSpawn: { x: 3.5 * T, z: 8.5 * T },
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
