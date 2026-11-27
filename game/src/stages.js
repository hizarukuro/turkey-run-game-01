// The three stages and their scenery. Each stage is a band of distance with its own
// speed and backdrop: the golden FARMYARD, the BARNYARD kitchen yard, and THE KITCHEN
// itself — where a doorway at 2,000 m opens onto the forest and freedom.
// Backgrounds are layered parallax drawn from the scroll offset: far, mid, then ground.

import { FINISH_M, GROUND_Y, PALETTE, PX_PER_M, VIEW_H, VIEW_W } from './config.js';
import { roundRect } from './turkey.js';

/** Stage table: name for the HUD and banner, the distance it runs to, scroll speed. */
export const STAGES = [
  { id: 'farmyard', name: 'STAGE 1 · THE FARMYARD', bannerSub: 'Break for the fence line — and mind the hay!', untilM: 550, speed: 335 },
  { id: 'barnyard', name: 'STAGE 2 · THE BARNYARD', bannerSub: 'The ovens are lit. The farmer is throwing things.', untilM: 1250, speed: 398 },
  { id: 'kitchen', name: 'STAGE 3 · THE KITCHEN', bannerSub: 'Knives, ovens, one door to freedom. RUN.', untilM: FINISH_M, speed: 458 },
];

/** Which stage a distance falls in (0, 1 or 2). */
export function stageIndexFor(distanceM) {
  if (distanceM < STAGES[0].untilM) return 0;
  if (distanceM < STAGES[1].untilM) return 1;
  return 2;
}

/** Draw the whole backdrop for the current stage: sky, far layer, mid layer, ground. */
export function drawBackground(ctx, state) {
  const stage = state.stage;
  if (stage.id === 'kitchen') drawKitchenSky(ctx, state);
  else drawOutdoorSky(ctx, state);

  if (stage.id === 'farmyard') drawFarmyardFar(ctx, state);
  else if (stage.id === 'barnyard') drawBarnyardFar(ctx, state);
  else drawKitchenFar(ctx, state);

  drawFallingLeaves(ctx, state);
  drawGround(ctx, state);
  if (stage.id === 'kitchen') drawFreedomDoor(ctx, state);
}

function drawOutdoorSky(ctx, state) {
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, PALETTE.skyTop);
  sky.addColorStop(0.55, PALETTE.skyMid);
  sky.addColorStop(1, PALETTE.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, GROUND_Y);
  // Low golden sun, upper right, with a soft halo.
  const sunX = 1060;
  const sunY = 118;
  const halo = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 130);
  halo.addColorStop(0, 'rgba(255, 243, 196, 0.95)');
  halo.addColorStop(0.35, 'rgba(255, 220, 140, 0.5)');
  halo.addColorStop(1, 'rgba(255, 220, 140, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(sunX - 140, sunY - 140, 280, 280);
  ctx.fillStyle = PALETTE.sun;
  ctx.beginPath();
  ctx.ellipse(sunX, sunY, 44, 44, 0, 0, Math.PI * 2);
  ctx.fill();
  // Slow clouds.
  ctx.fillStyle = 'rgba(255, 250, 235, 0.85)';
  const drift = state.scrollX * 0.05;
  for (let i = 0; i < 4; i += 1) {
    const cx = mod(i * 390 + 120 - drift, VIEW_W + 320) - 160;
    const cy = 66 + (i % 3) * 44;
    drawCloud(ctx, cx, cy, 1 + (i % 2) * 0.35);
  }
}

function drawKitchenSky(ctx, state) {
  // Interior wall: warm plaster above a wainscot line, lit by the window's sunset.
  const wall = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  wall.addColorStop(0, '#f2c184');
  wall.addColorStop(0.7, '#e2a05e');
  wall.addColorStop(1, '#cf8443');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, VIEW_W, GROUND_Y);
  ctx.fillStyle = 'rgba(122, 72, 32, 0.55)';
  ctx.fillRect(0, GROUND_Y - 150, VIEW_W, 6);
  // A window with the evening outside it, scrolling slowly.
  const wx = mod(500 - state.scrollX * 0.08, VIEW_W + 700) - 350;
  drawKitchenWindow(ctx, wx, 74);
}

function drawKitchenWindow(ctx, x, y) {
  ctx.fillStyle = '#7a4a20';
  roundRect(ctx, x - 8, y - 8, 196, 196, 8);
  ctx.fill();
  const sky = ctx.createLinearGradient(0, y, 0, y + 180);
  sky.addColorStop(0, '#ffd98a');
  sky.addColorStop(1, '#ff8f52');
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, 180, 180);
  // Distant tree line in the window: where the turkey is headed.
  ctx.fillStyle = '#5d7a2a';
  ctx.beginPath();
  ctx.moveTo(x, y + 150);
  for (let i = 0; i <= 6; i += 1) {
    ctx.lineTo(x + i * 30, y + 150 - ((i * 37) % 26));
    ctx.lineTo(x + i * 30 + 15, y + 150);
  }
  ctx.lineTo(x + 180, y + 180);
  ctx.lineTo(x, y + 180);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#7a4a20';
  ctx.lineWidth = 7;
  ctx.strokeRect(x + 88, y, 4, 180);
  ctx.strokeRect(x, y + 88, 180, 4);
}

function drawFarmyardFar(ctx, state) {
  // Rolling hills.
  ctx.fillStyle = PALETTE.hillFar;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  for (let x = 0; x <= VIEW_W; x += 80) {
    const wx = x + state.scrollX * 0.12;
    ctx.lineTo(x, GROUND_Y - 120 - Math.sin(wx * 0.004) * 42 - Math.sin(wx * 0.0013) * 30);
  }
  ctx.lineTo(VIEW_W, GROUND_Y);
  ctx.closePath();
  ctx.fill();
  // The big red barn, parallax-slow, with a silo.
  const barnX = mod(700 - state.scrollX * 0.22, VIEW_W + 900) - 450;
  drawBarn(ctx, barnX, GROUND_Y - 118);
  // Fence line running the whole stage.
  drawFenceLine(ctx, state.scrollX * 0.55, GROUND_Y - 66);
  // Scarecrow on a mid hill.
  const scX = mod(880 - state.scrollX * 0.3, VIEW_W + 700) - 350;
  drawScarecrow(ctx, scX, GROUND_Y - 96);
}

function drawBarnyardFar(ctx, state) {
  ctx.fillStyle = PALETTE.hillFar;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  for (let x = 0; x <= VIEW_W; x += 80) {
    const wx = x + state.scrollX * 0.12;
    ctx.lineTo(x, GROUND_Y - 96 - Math.sin(wx * 0.004 + 2) * 30);
  }
  ctx.lineTo(VIEW_W, GROUND_Y);
  ctx.closePath();
  ctx.fill();
  // The farmhouse with a smoking chimney — dinner is being prepared in there.
  const houseX = mod(120 - state.scrollX * 0.2, VIEW_W + 1000) - 500;
  drawFarmhouse(ctx, houseX, GROUND_Y - 104, state.time);
  // Crates, barrels and a laden harvest table in the mid layer.
  const mid = state.scrollX * 0.55;
  for (let i = 0; i < 3; i += 1) {
    const cx = mod(i * 520 + 300 - mid, VIEW_W + 420) - 210;
    if (i === 1) drawHarvestTable(ctx, cx, GROUND_Y - 62);
    else drawCrates(ctx, cx, GROUND_Y - 62);
  }
  drawFenceLine(ctx, mid, GROUND_Y - 60);
}

function drawKitchenFar(ctx, state) {
  const mid = state.scrollX * 0.35;
  // Shelf with jars and plates.
  const shelfX = mod(160 - mid, VIEW_W + 760) - 380;
  drawShelf(ctx, shelfX, 208);
  // Hanging pans and ladles from a rail.
  const railX = mod(760 - mid, VIEW_W + 760) - 380;
  drawHangingPans(ctx, railX, 120);
  // A counter with a great pot, mid layer.
  const counterX = mod(420 - state.scrollX * 0.55, VIEW_W + 700) - 350;
  drawCounter(ctx, counterX, GROUND_Y - 88, state.time);
}

function drawGround(ctx, state) {
  if (state.stage.id === 'kitchen') {
    // Checkered kitchen floor with a worn runner rug.
    const tile = 64;
    const off = mod(-state.scrollX, tile * 2);
    for (let row = 0; row < 2; row += 1) {
      for (let col = -1; col < VIEW_W / tile + 1; col += 1) {
        const x = col * tile + off;
        const y = GROUND_Y + row * tile;
        ctx.fillStyle = (col + row) % 2 === 0 ? '#e8d3ac' : '#b3541e';
        ctx.fillRect(x, y, tile, tile);
      }
    }
    ctx.fillStyle = 'rgba(120, 40, 30, 0.85)';
    ctx.fillRect(0, GROUND_Y + 34, VIEW_W, 30);
    ctx.fillStyle = 'rgba(255, 220, 150, 0.5)';
    ctx.fillRect(0, GROUND_Y + 34, VIEW_W, 3);
    ctx.fillRect(0, GROUND_Y + 61, VIEW_W, 3);
  } else {
    // Grass strip, then the dirt track the chase runs on.
    ctx.fillStyle = PALETTE.grass;
    ctx.fillRect(0, GROUND_Y, VIEW_W, 18);
    ctx.fillStyle = PALETTE.grassDark;
    for (let x = -20; x < VIEW_W; x += 46) {
      const gx = x + mod(-state.scrollX, 46);
      ctx.fillRect(gx, GROUND_Y + 2, 18, 4);
    }
    const dirt = ctx.createLinearGradient(0, GROUND_Y + 18, 0, VIEW_H);
    dirt.addColorStop(0, PALETTE.dirt);
    dirt.addColorStop(1, PALETTE.dirtDark);
    ctx.fillStyle = dirt;
    ctx.fillRect(0, GROUND_Y + 18, VIEW_W, VIEW_H - GROUND_Y - 18);
    // Track dashes scrolling at full speed sell the run.
    ctx.fillStyle = 'rgba(90, 52, 22, 0.5)';
    for (let x = -40; x < VIEW_W; x += 90) {
      const dx = x + mod(-state.scrollX, 90);
      roundRect(ctx, dx, GROUND_Y + 56, 44, 7, 3);
      ctx.fill();
      roundRect(ctx, dx + 30, GROUND_Y + 92, 30, 6, 3);
      ctx.fill();
    }
  }
  // The ground line itself.
  ctx.fillStyle = 'rgba(60, 34, 14, 0.65)';
  ctx.fillRect(0, GROUND_Y - 2, VIEW_W, 4);
}

/** The forest doorway at the finish, drawn when it scrolls into view. */
function drawFreedomDoor(ctx, state) {
  const doorWorldX = FINISH_M * PX_PER_M;
  const sx = doorWorldX - state.scrollX;
  if (sx < -200 || sx > VIEW_W + 100) return;
  // Forest through the doorway: layered tree silhouettes against sunset gold.
  ctx.save();
  ctx.beginPath();
  ctx.rect(sx, GROUND_Y - 300, 190, 300);
  ctx.clip();
  const sky = ctx.createLinearGradient(0, GROUND_Y - 300, 0, GROUND_Y);
  sky.addColorStop(0, '#ffd98a');
  sky.addColorStop(1, '#ff9d5c');
  ctx.fillStyle = sky;
  ctx.fillRect(sx, GROUND_Y - 300, 190, 300);
  ctx.fillStyle = '#4a6b24';
  for (let i = 0; i < 5; i += 1) {
    const tx = sx + 8 + i * 38;
    const th = 150 + ((i * 53) % 70);
    ctx.beginPath();
    ctx.moveTo(tx, GROUND_Y);
    ctx.lineTo(tx + 17, GROUND_Y - th);
    ctx.lineTo(tx + 34, GROUND_Y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#6d8a2f';
  ctx.fillRect(sx, GROUND_Y - 16, 190, 16);
  ctx.restore();
  // The door frame and its sign.
  ctx.strokeStyle = '#5d3a1a';
  ctx.lineWidth = 12;
  ctx.strokeRect(sx - 4, GROUND_Y - 304, 198, 304);
  ctx.fillStyle = PALETTE.wood;
  roundRect(ctx, sx + 18, GROUND_Y - 348, 154, 36, 6);
  ctx.fill();
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 2.5;
  roundRect(ctx, sx + 18, GROUND_Y - 348, 154, 36, 6);
  ctx.stroke();
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '900 21px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FREEDOM →', sx + 95, GROUND_Y - 324);
}

/** Falling autumn leaves, deterministic from time and scroll so frames are stable. */
function drawFallingLeaves(ctx, state) {
  const t = state.time;
  for (let i = 0; i < 13; i += 1) {
    const speed = 26 + (i % 4) * 9;
    const x = mod(i * 211 + 60 - state.scrollX * 0.7 - t * speed, VIEW_W + 90) - 45;
    const y = mod(i * 97 + t * (34 + (i % 3) * 13), GROUND_Y - 60);
    const rot = t * (1 + (i % 3) * 0.6) + i;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = ['#d97b2f', '#b3541e', '#e8a83f', '#a8b545'][i % 4];
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawCloud(ctx, x, y, s) {
  ctx.beginPath();
  ctx.ellipse(x, y, 52 * s, 20 * s, 0, 0, Math.PI * 2);
  ctx.ellipse(x - 34 * s, y + 5 * s, 32 * s, 14 * s, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 36 * s, y + 4 * s, 36 * s, 16 * s, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawBarn(ctx, x, baseY) {
  ctx.fillStyle = PALETTE.barnRed;
  ctx.fillRect(x, baseY - 120, 190, 120);
  // Gambrel roof.
  ctx.fillStyle = PALETTE.barnDark;
  ctx.beginPath();
  ctx.moveTo(x - 14, baseY - 118);
  ctx.lineTo(x + 30, baseY - 168);
  ctx.lineTo(x + 62, baseY - 190);
  ctx.lineTo(x + 128, baseY - 190);
  ctx.lineTo(x + 160, baseY - 168);
  ctx.lineTo(x + 204, baseY - 118);
  ctx.closePath();
  ctx.fill();
  // Door with the X brace, and a hayloft window.
  ctx.fillStyle = '#7c241a';
  ctx.fillRect(x + 62, baseY - 82, 66, 82);
  ctx.strokeStyle = PALETTE.cream;
  ctx.lineWidth = 5;
  ctx.strokeRect(x + 62, baseY - 82, 66, 82);
  ctx.beginPath();
  ctx.moveTo(x + 62, baseY - 82);
  ctx.lineTo(x + 128, baseY);
  ctx.moveTo(x + 128, baseY - 82);
  ctx.lineTo(x + 62, baseY);
  ctx.stroke();
  ctx.fillStyle = PALETTE.cream;
  ctx.fillRect(x + 82, baseY - 152, 26, 26);
  ctx.strokeStyle = PALETTE.barnDark;
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 82, baseY - 152, 26, 26);
  // Silo.
  ctx.fillStyle = '#cbb9a0';
  ctx.fillRect(x + 206, baseY - 168, 44, 168);
  ctx.fillStyle = '#a08b6d';
  ctx.beginPath();
  ctx.ellipse(x + 228, baseY - 168, 22, 12, 0, Math.PI, Math.PI * 2);
  ctx.fill();
}

function drawScarecrow(ctx, x, baseY) {
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.lineTo(x, baseY - 86);
  ctx.moveTo(x - 34, baseY - 62);
  ctx.lineTo(x + 34, baseY - 70);
  ctx.stroke();
  ctx.fillStyle = '#7a9cc4';
  ctx.fillRect(x - 15, baseY - 62, 30, 34);
  ctx.fillStyle = '#e8c96a';
  ctx.beginPath();
  ctx.ellipse(x, baseY - 92, 13, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 22, baseY - 100, 44, 6);
}

function drawFarmhouse(ctx, x, baseY, t) {
  ctx.fillStyle = '#f3e3c2';
  ctx.fillRect(x, baseY - 108, 210, 108);
  ctx.fillStyle = '#8c5a2e';
  ctx.beginPath();
  ctx.moveTo(x - 12, baseY - 106);
  ctx.lineTo(x + 105, baseY - 162);
  ctx.lineTo(x + 222, baseY - 106);
  ctx.closePath();
  ctx.fill();
  // Chimney with dinner smoke.
  ctx.fillStyle = '#9a8a7a';
  ctx.fillRect(x + 158, baseY - 168, 24, 44);
  for (let k = 0; k < 3; k += 1) {
    const phase = (t * 0.4 + k / 3) % 1;
    ctx.fillStyle = `rgba(240, 238, 230, ${0.5 * (1 - phase)})`;
    ctx.beginPath();
    ctx.ellipse(x + 170 + phase * 16, baseY - 176 - phase * 44, 7 + phase * 12, 6 + phase * 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Lit windows: someone is cooking.
  ctx.fillStyle = '#ffca6a';
  ctx.fillRect(x + 26, baseY - 84, 34, 38);
  ctx.fillRect(x + 146, baseY - 84, 34, 38);
  ctx.strokeStyle = '#8c5a2e';
  ctx.lineWidth = 4;
  ctx.strokeRect(x + 26, baseY - 84, 34, 38);
  ctx.strokeRect(x + 146, baseY - 84, 34, 38);
  ctx.fillStyle = '#7c4a22';
  ctx.fillRect(x + 88, baseY - 66, 34, 66);
}

function drawCrates(ctx, x, baseY) {
  ctx.fillStyle = PALETTE.wood;
  ctx.fillRect(x, baseY - 44, 46, 44);
  ctx.fillRect(x + 8, baseY - 82, 40, 38);
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, baseY - 44, 46, 44);
  ctx.strokeRect(x + 8, baseY - 82, 40, 38);
  // Pumpkins on top.
  ctx.fillStyle = '#e07b24';
  ctx.beginPath();
  ctx.ellipse(x + 62, baseY - 52, 15, 12, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 30, baseY - 92, 12, 10, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawHarvestTable(ctx, x, baseY) {
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(x - 6, baseY - 46, 150, 9);
  ctx.fillRect(x + 2, baseY - 37, 8, 37);
  ctx.fillRect(x + 128, baseY - 37, 8, 37);
  // The feast that must not include our hero: pies, corn, a great empty platter.
  ctx.fillStyle = '#c94f38';
  ctx.beginPath();
  ctx.ellipse(x + 24, baseY - 52, 17, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f7b731';
  roundRect(ctx, x + 52, baseY - 60, 10, 18, 4);
  ctx.fill();
  roundRect(ctx, x + 66, baseY - 60, 10, 18, 4);
  ctx.fill();
  ctx.fillStyle = '#e8e2d2';
  ctx.beginPath();
  ctx.ellipse(x + 112, baseY - 50, 24, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b9b09a';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawShelf(ctx, x, y) {
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(x - 10, y + 44, 320, 10);
  ctx.fillRect(x - 10, y + 118, 320, 10);
  const jarColours = ['#c94f38', '#e8a83f', '#7d9c38', '#b3541e', '#e8d3ac', '#a85b8a'];
  for (let i = 0; i < 6; i += 1) {
    const jx = x + i * 52;
    ctx.fillStyle = jarColours[i];
    roundRect(ctx, jx, y + 12, 30, 32, 6);
    ctx.fill();
    ctx.fillStyle = '#5d3a1a';
    ctx.fillRect(jx + 4, y + 6, 22, 7);
    ctx.fillStyle = jarColours[(i + 3) % 6];
    roundRect(ctx, jx + 4, y + 86, 26, 32, 12);
    ctx.fill();
  }
}

function drawHangingPans(ctx, x, y) {
  ctx.fillStyle = '#5d3a1a';
  ctx.fillRect(x - 10, y, 330, 8);
  const pans = [
    { dx: 20, r: 30, drop: 66 },
    { dx: 96, r: 22, drop: 88 },
    { dx: 160, r: 36, drop: 58 },
    { dx: 244, r: 24, drop: 82 },
    { dx: 300, r: 18, drop: 64 },
  ];
  for (const pan of pans) {
    ctx.strokeStyle = '#5d3a1a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + pan.dx, y + 6);
    ctx.lineTo(x + pan.dx, y + pan.drop);
    ctx.stroke();
    ctx.fillStyle = '#6b6560';
    ctx.beginPath();
    ctx.ellipse(x + pan.dx, y + pan.drop + pan.r, pan.r, pan.r * 0.92, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8d8680';
    ctx.beginPath();
    ctx.ellipse(x + pan.dx, y + pan.drop + pan.r, pan.r * 0.62, pan.r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCounter(ctx, x, baseY, t) {
  ctx.fillStyle = '#8a5a30';
  ctx.fillRect(x, baseY - 30, 240, 30);
  ctx.fillStyle = '#6f4520';
  ctx.fillRect(x, baseY - 38, 240, 10);
  // The great pot, steaming, with a ladle.
  ctx.fillStyle = '#4a4440';
  roundRect(ctx, x + 70, baseY - 92, 96, 56, 10);
  ctx.fill();
  ctx.fillStyle = '#6b6560';
  ctx.fillRect(x + 62, baseY - 98, 112, 10);
  for (let k = 0; k < 3; k += 1) {
    const phase = (t * 0.5 + k / 3) % 1;
    ctx.fillStyle = `rgba(255, 250, 238, ${0.45 * (1 - phase)})`;
    ctx.beginPath();
    ctx.ellipse(x + 118 + Math.sin(phase * 6) * 8, baseY - 108 - phase * 40, 7 + phase * 11, 6 + phase * 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#2c2723';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x + 150, baseY - 96);
  ctx.lineTo(x + 172, baseY - 128);
  ctx.stroke();
  // Carving board with a waiting knife rest — empty, for now.
  ctx.fillStyle = PALETTE.wood;
  roundRect(ctx, x + 182, baseY - 52, 52, 12, 4);
  ctx.fill();
}

function drawFenceLine(ctx, offset, y) {
  ctx.fillStyle = 'rgba(122, 79, 38, 0.9)';
  const spacing = 74;
  const off = mod(-offset, spacing);
  for (let x = -spacing; x < VIEW_W + spacing; x += spacing) {
    ctx.fillRect(x + off, y, 7, 66);
  }
  ctx.fillRect(0, y + 12, VIEW_W, 6);
  ctx.fillRect(0, y + 38, VIEW_W, 6);
}

/** Positive modulo for wrapping parallax motifs. */
export function mod(a, n) {
  return ((a % n) + n) % n;
}
