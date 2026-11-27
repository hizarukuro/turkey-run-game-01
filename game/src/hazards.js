// Hazards and pickups: everything in the world that is not the turkey or the farmer.
// Hurdles to jump (fences, ovens, rolling pumpkins), carving knives to duck, corn to
// collect (golden corn builds the combo), and the cover — hay bales and pumpkin patches —
// the turkey hides in. Also the spawner that lays patterns ahead of the runner.

import { GROUND_Y, PALETTE, TURKEY_X, VIEW_W } from './config.js';
import { farmerX } from './farmer.js';
import { roundRect, turkeyBox } from './turkey.js';

/** Item footprints by type: width and height in px, standing on the ground line. */
export const ITEM_SIZE = {
  fence: { w: 20, h: 56 },
  oven: { w: 108, h: 94 },
  pumpkin: { w: 54, h: 54 },
  hay: { w: 118, h: 66 },
  patch: { w: 138, h: 42 },
  corn: { w: 30, h: 40 },
  goldcorn: { w: 32, h: 42 },
  knife: { w: 52, h: 14 },
};

/** Make one world item; worldX is its left edge in world coordinates. */
export function makeItem(type, worldX, opts = {}) {
  return {
    type,
    worldX,
    y: opts.y ?? GROUND_Y, // baseline the item stands on (corn floats: its centre line)
    vx: opts.vx ?? 0, // extra world velocity (rolling pumpkins, flying knives)
    spin: opts.spin ?? 0,
    taken: false,
    seed: opts.seed ?? worldX * 0.137,
  };
}

/** A carving knife leaving the farmer's hand at standing-head height: duck! */
export function spawnKnife(state) {
  const fx = farmerX(state.farmer);
  return makeItem('knife', state.scrollX + fx + 30, {
    y: GROUND_Y - 118,
    vx: state.stage.speed + 430,
  });
}

/**
 * Lay the next pattern ahead of the runner. Patterns are stage-aware and always leave a
 * fair gap; cover shows up often enough that hiding is a real rhythm, not a rarity.
 */
export function spawnPattern(state) {
  const rng = state.rng;
  const at = state.nextSpawnX;
  const stage = state.stageIndex;
  const items = [];
  const roll = rng();

  const cornArc = (startX, baseY, n = 4, gap = 52) => {
    for (let i = 0; i < n; i += 1) {
      const lift = Math.sin((i / (n - 1)) * Math.PI) * 74;
      items.push(makeItem(rng() < 0.14 ? 'goldcorn' : 'corn', startX + i * gap, { y: baseY - lift }));
    }
  };

  if (roll < 0.20) {
    // A hurdle, with corn arcing over it as a hint: jump here.
    items.push(makeItem(stage >= 1 && rng() < 0.55 ? 'oven' : 'fence', at));
    cornArc(at - 30, GROUND_Y - 96);
    state.nextSpawnX = at + 430 + rng() * 200;
  } else if (roll < 0.36) {
    // Cover: a hay bale or a pumpkin patch, corn just beyond it.
    items.push(makeItem(rng() < 0.55 ? 'hay' : 'patch', at));
    cornArc(at + 210, GROUND_Y - 60, 3, 50);
    state.nextSpawnX = at + 520 + rng() * 220;
  } else if (roll < 0.50 && stage >= 1) {
    // A lit oven, and in the kitchen sometimes two in a row.
    items.push(makeItem('oven', at));
    if (stage === 2 && rng() < 0.4) items.push(makeItem('oven', at + 300));
    cornArc(at + 6, GROUND_Y - 150, 3, 48);
    state.nextSpawnX = at + 560 + rng() * 240;
  } else if (roll < 0.62) {
    // A rolling pumpkin barrelling toward the turkey.
    items.push(makeItem('pumpkin', at + 260, { vx: -150 }));
    cornArc(at - 20, GROUND_Y - 60, 3, 50);
    state.nextSpawnX = at + 480 + rng() * 200;
  } else if (roll < 0.80) {
    // Open ground with a corn trail: a breather that pays.
    cornArc(at, GROUND_Y - 70, 5, 54);
    state.nextSpawnX = at + 430 + rng() * 200;
  } else {
    // A fence pair in the farmyard style.
    items.push(makeItem('fence', at));
    items.push(makeItem('fence', at + 190));
    cornArc(at + 40, GROUND_Y - 110, 3, 52);
    state.nextSpawnX = at + 560 + rng() * 200;
  }
  return items;
}

/** Move the items that move themselves, spin the knives, cull what is far behind. */
export function updateItems(state, dt) {
  const keep = [];
  for (const item of state.items) {
    if (item.type === 'pumpkin') {
      item.worldX += item.vx * dt;
      item.spin -= dt * 5.2;
    }
    if (item.type === 'knife') {
      item.worldX += item.vx * dt;
      item.spin += dt * 17;
    }
    const screenX = item.worldX - state.scrollX;
    if (screenX < -320) continue;
    if (item.type === 'knife' && screenX > VIEW_W + 200) continue;
    keep.push(item);
  }
  state.items = keep;
}

/** True while the ducking turkey overlaps a hay bale or pumpkin patch on screen. */
export function turkeyIsHidden(state) {
  const turkey = state.turkey;
  if (!turkey.ducking || !turkey.grounded) return false;
  for (const item of state.items) {
    if (item.type !== 'hay' && item.type !== 'patch') continue;
    const sx = item.worldX - state.scrollX;
    const w = ITEM_SIZE[item.type].w;
    if (TURKEY_X > sx - 6 && TURKEY_X < sx + w + 6) return true;
  }
  return false;
}

/**
 * Test the turkey against the world. Returns { hit: item|null, collected: [items] }.
 * Cover never hits; corn is collected on overlap; hazards hit unless invulnerable.
 */
export function collideTurkey(state) {
  const box = turkeyBox(state.turkey);
  const collected = [];
  let hit = null;
  for (const item of state.items) {
    if (item.taken) continue;
    const size = ITEM_SIZE[item.type];
    const sx = item.worldX - state.scrollX;
    if (item.type === 'corn' || item.type === 'goldcorn') {
      const cx = sx + size.w / 2;
      const cy = item.y;
      if (Math.abs(cx - (box.x + box.w / 2)) < 46 && Math.abs(cy - (box.y + box.h / 2)) < 62) {
        item.taken = true;
        collected.push(item);
      }
      continue;
    }
    if (item.type === 'hay' || item.type === 'patch') continue;
    const itemBox = item.type === 'knife'
      ? { x: sx, y: item.y - 8, w: size.w, h: 16 }
      : { x: sx, y: GROUND_Y - size.h, w: size.w, h: size.h };
    const overlap = box.x < itemBox.x + itemBox.w - 6
      && box.x + box.w > itemBox.x + 6
      && box.y < itemBox.y + itemBox.h - 4
      && box.y + box.h > itemBox.y + 4;
    if (overlap && !hit) hit = item;
  }
  return { hit, collected };
}

/** Draw every world item except cover, in world order. */
export function drawItems(ctx, state) {
  for (const item of state.items) {
    if (item.taken) continue;
    const sx = item.worldX - state.scrollX;
    if (sx < -200 || sx > VIEW_W + 200) continue;
    switch (item.type) {
      case 'fence': drawFence(ctx, sx); break;
      case 'oven': drawOven(ctx, state, item, sx); break;
      case 'pumpkin': drawRollingPumpkin(ctx, item, sx); break;
      case 'knife': drawKnife(ctx, item, sx); break;
      case 'corn': drawCorn(ctx, state, item, sx, false); break;
      case 'goldcorn': drawCorn(ctx, state, item, sx, true); break;
      default: break;
    }
  }
}

/** Draw the cover objects (hay bales, pumpkin patches) behind the turkey. */
export function drawCover(ctx, state) {
  for (const item of state.items) {
    const sx = item.worldX - state.scrollX;
    if (sx < -220 || sx > VIEW_W + 220) continue;
    if (item.type === 'hay') drawHayBale(ctx, sx);
    else if (item.type === 'patch') drawPumpkinPatch(ctx, item, sx);
  }
}

/** Straw and leaves drawn over a hidden turkey, so it reads as tucked inside the cover. */
export function drawCoverOverlay(ctx, state) {
  if (!state.turkey.hidden) return;
  const x = TURKEY_X;
  ctx.strokeStyle = '#d9a83f';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  for (let i = 0; i < 7; i += 1) {
    const sx = x - 44 + i * 14;
    ctx.beginPath();
    ctx.moveTo(sx, GROUND_Y - 6);
    ctx.quadraticCurveTo(sx + 6, GROUND_Y - 34, sx + (i % 2 ? 13 : -3), GROUND_Y - 52);
    ctx.stroke();
  }
  ctx.fillStyle = PALETTE.grassDark;
  ctx.beginPath();
  ctx.ellipse(x + 6, GROUND_Y - 16, 30, 10, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawFence(ctx, sx) {
  ctx.fillStyle = PALETTE.wood;
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 2;
  // Two posts and two rails: a farm hurdle.
  for (const px of [sx + 1, sx + 15]) {
    ctx.fillRect(px, GROUND_Y - 56, 5, 56);
  }
  for (const ry of [GROUND_Y - 50, GROUND_Y - 28]) {
    roundRect(ctx, sx - 3, ry, 26, 7, 3);
    ctx.fill();
    ctx.stroke();
  }
  // Weathered cap.
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(sx - 1, GROUND_Y - 58, 22, 4);
}

function drawOven(ctx, state, item, sx) {
  const t = state.time;
  const flicker = 0.82 + Math.sin(t * 11 + item.seed * 20) * 0.18;
  // Iron body.
  ctx.fillStyle = PALETTE.ironDark;
  roundRect(ctx, sx, GROUND_Y - 94, 108, 94, 8);
  ctx.fill();
  ctx.fillStyle = '#57504a';
  roundRect(ctx, sx, GROUND_Y - 94, 108, 14, 6);
  ctx.fill();
  // Glowing door: the fire inside, bars across it.
  const glow = ctx.createRadialGradient(sx + 54, GROUND_Y - 44, 6, sx + 54, GROUND_Y - 44, 44);
  glow.addColorStop(0, `rgba(255, 196, 64, ${0.95 * flicker})`);
  glow.addColorStop(0.6, `rgba(255, 122, 26, ${0.85 * flicker})`);
  glow.addColorStop(1, 'rgba(160, 52, 10, 0.9)');
  ctx.fillStyle = glow;
  roundRect(ctx, sx + 16, GROUND_Y - 72, 76, 56, 6);
  ctx.fill();
  ctx.strokeStyle = '#241f1b';
  ctx.lineWidth = 5;
  for (const bx of [sx + 35, sx + 54, sx + 73]) {
    ctx.beginPath();
    ctx.moveTo(bx, GROUND_Y - 72);
    ctx.lineTo(bx, GROUND_Y - 16);
    ctx.stroke();
  }
  // Chimney pipe and its steam puffs.
  ctx.fillStyle = '#2c2723';
  ctx.fillRect(sx + 78, GROUND_Y - 122, 14, 30);
  ctx.fillRect(sx + 74, GROUND_Y - 126, 22, 7);
  for (let k = 0; k < 3; k += 1) {
    const phase = (t * 0.55 + k / 3 + item.seed) % 1;
    const px = sx + 85 + Math.sin(phase * 5 + item.seed * 9) * 7 * phase;
    const py = GROUND_Y - 130 - phase * 52;
    ctx.fillStyle = `rgba(255, 250, 238, ${0.4 * (1 - phase)})`;
    ctx.beginPath();
    ctx.ellipse(px, py, 6 + phase * 13, 5 + phase * 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // A little warning sign: this oven is LIT.
  ctx.fillStyle = PALETTE.heartRed;
  roundRect(ctx, sx + 30, GROUND_Y - 90, 48, 13, 4);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '900 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HOT!', sx + 54, GROUND_Y - 80);
}

function drawRollingPumpkin(ctx, item, sx) {
  const cx = sx + 27;
  const cy = GROUND_Y - 27;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(item.spin);
  ctx.fillStyle = '#e07b24';
  ctx.beginPath();
  ctx.ellipse(0, 0, 27, 25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b85a12';
  ctx.lineWidth = 3;
  for (const off of [-14, 0, 14]) {
    ctx.beginPath();
    ctx.ellipse(off * 0.6, 0, Math.abs(off) === 0 ? 6 : 9, 24, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#5d7a2a';
  ctx.fillRect(-3, -30, 6, 8);
  ctx.restore();
  // Speed streaks behind it.
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(sx + 62, GROUND_Y - 38);
  ctx.lineTo(sx + 84, GROUND_Y - 38);
  ctx.moveTo(sx + 60, GROUND_Y - 20);
  ctx.lineTo(sx + 78, GROUND_Y - 20);
  ctx.stroke();
}

function drawKnife(ctx, item, sx) {
  ctx.save();
  ctx.translate(sx + 26, item.y);
  ctx.rotate(Math.sin(item.spin) * 0.22);
  // Motion streak.
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-30, 0);
  ctx.lineTo(-58, 0);
  ctx.stroke();
  // Blade: a carving knife's long silver wedge, point forward.
  const blade = ctx.createLinearGradient(0, -7, 0, 7);
  blade.addColorStop(0, '#f4f7fb');
  blade.addColorStop(0.5, '#c3ccd8');
  blade.addColorStop(1, '#8d97a5');
  ctx.fillStyle = blade;
  ctx.beginPath();
  ctx.moveTo(-14, -7);
  ctx.lineTo(16, -5);
  ctx.lineTo(30, 1);
  ctx.lineTo(16, 6);
  ctx.lineTo(-14, 6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#5d6672';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  // Handle.
  ctx.fillStyle = PALETTE.woodDark;
  roundRect(ctx, -30, -5, 17, 10, 4);
  ctx.fill();
  // Glint.
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.ellipse(8, -3, 6, 1.6, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCorn(ctx, state, item, sx, golden) {
  const bob = Math.sin(state.time * 3 + item.seed * 12) * 4;
  const cx = sx + 15;
  const cy = item.y + bob;
  ctx.save();
  ctx.translate(cx, cy);
  if (golden) {
    // Sparkle cross behind golden corn.
    ctx.strokeStyle = 'rgba(255, 220, 90, 0.95)';
    ctx.lineWidth = 3;
    const s = 24 + Math.sin(state.time * 5 + item.seed * 7) * 4;
    ctx.beginPath();
    ctx.moveTo(-s, 0);
    ctx.lineTo(s, 0);
    ctx.moveTo(0, -s);
    ctx.lineTo(0, s);
    ctx.stroke();
  }
  // Husk leaves.
  ctx.fillStyle = golden ? '#8fae3e' : PALETTE.grassDark;
  ctx.beginPath();
  ctx.moveTo(-6, 16);
  ctx.quadraticCurveTo(-16, 4, -11, -8);
  ctx.quadraticCurveTo(-4, 6, -2, 16);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(6, 16);
  ctx.quadraticCurveTo(16, 4, 11, -8);
  ctx.quadraticCurveTo(4, 6, 2, 16);
  ctx.closePath();
  ctx.fill();
  // Cob.
  ctx.fillStyle = golden ? '#ffd83d' : '#f7b731';
  roundRect(ctx, -8, -19, 16, 36, 7);
  ctx.fill();
  // Kernels.
  ctx.fillStyle = golden ? '#e8a90c' : '#d98e12';
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      ctx.beginPath();
      ctx.ellipse(-4.5 + col * 4.5, -12 + row * 8, 1.7, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawHayBale(ctx, sx) {
  // A round-ended bale lying on the ground, banded with twine.
  ctx.fillStyle = '#dcb34a';
  roundRect(ctx, sx, GROUND_Y - 62, 118, 62, 26);
  ctx.fill();
  ctx.strokeStyle = '#b98f2a';
  ctx.lineWidth = 3;
  roundRect(ctx, sx, GROUND_Y - 62, 118, 62, 26);
  ctx.stroke();
  for (const bx of [sx + 28, sx + 59, sx + 90]) {
    ctx.strokeStyle = '#a87f22';
    ctx.beginPath();
    ctx.moveTo(bx, GROUND_Y - 60);
    ctx.lineTo(bx, GROUND_Y - 2);
    ctx.stroke();
  }
  // Loose straw strokes on top.
  ctx.strokeStyle = '#eed27a';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i += 1) {
    const lx = sx + 12 + i * 17;
    ctx.beginPath();
    ctx.moveTo(lx, GROUND_Y - 60);
    ctx.quadraticCurveTo(lx + 5, GROUND_Y - 74, lx + 11, GROUND_Y - 70);
    ctx.stroke();
  }
}

function drawPumpkinPatch(ctx, item, sx) {
  // Leafy mound with pumpkins: low, wide cover.
  ctx.fillStyle = '#6d8a2f';
  ctx.beginPath();
  ctx.ellipse(sx + 69, GROUND_Y - 12, 72, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7d9c38';
  for (let i = 0; i < 7; i += 1) {
    const lx = sx + 14 + i * 18 + (item.seed * 10 + i * 7) % 6;
    ctx.beginPath();
    ctx.ellipse(lx, GROUND_Y - 24 - (i % 3) * 5, 11, 6, (i % 2 ? 0.5 : -0.4), 0, Math.PI * 2);
    ctx.fill();
  }
  for (const [px, pr] of [[sx + 30, 15], [sx + 66, 19], [sx + 104, 14]]) {
    ctx.fillStyle = '#e07b24';
    ctx.beginPath();
    ctx.ellipse(px, GROUND_Y - pr + 4, pr, pr - 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b85a12';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(px, GROUND_Y - pr + 4, pr * 0.45, pr - 3, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#5d7a2a';
    ctx.fillRect(px - 2, GROUND_Y - pr * 2 + 3, 4, 6);
  }
}
