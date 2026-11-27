// The three menu screens: title, caught and escaped. Each is drawn by the game's own
// code over the game's own scenery, so the screenshots of them are the game itself.
// The title doubles as the feature inventory — it lists only systems that truly exist —
// and both end screens carry the final score, the distance and a RESTART button.

import { GROUND_Y, PALETTE, VIEW_W } from './config.js';
import { drawBubble } from './farmer.js';
import { fmt } from './hud.js';
import { drawBackground } from './stages.js';
import { roundRect } from './turkey.js';

/** The features the title screen promises — every one of them is in the game. */
const FEATURES = [
  'Three stages, farm to kitchen',
  'Hide in hay bales & pumpkin patches',
  'A farmer who chases & searches',
  'Ovens, fences, rolling pumpkins',
  'Duck his flying carving knives',
  'Corn combos · golden corn · 3 lives',
];

/** Title screen: the chase frozen as a poster, the inventory, the controls. */
export function drawTitle(ctx, state) {
  drawBackground(ctx, { ...state, stage: state.stages[0], scrollX: 2600, time: state.time });
  drawTitleChase(ctx, state);
  drawTitleText(ctx, state);
}

function drawTitleChase(ctx, state) {
  // The farmer, mid-chase with his arm out, well behind the turkey.
  ctx.save();
  ctx.translate(238, GROUND_Y);
  ctx.scale(1.25, 1.25);
  drawPosterFarmer(ctx, state.time);
  ctx.restore();
  drawBubble(ctx, 238, GROUND_Y - 250, '!');
  // The turkey, big and mid-stride, tail fanned.
  ctx.save();
  ctx.translate(520, GROUND_Y);
  ctx.scale(1.5, 1.5);
  drawPosterTurkey(ctx, state.time);
  ctx.restore();
  // Corn trail ahead of the turkey.
  ctx.fillStyle = '#f7b731';
  for (let i = 0; i < 4; i += 1) {
    const cx = 760 + i * 62;
    const cy = GROUND_Y - 92 - Math.sin(i * 0.9) * 30;
    roundRect(ctx, cx, cy, 15, 32, 7);
    ctx.fill();
  }
}

function drawTitleText(ctx, state) {
  ctx.textAlign = 'center';
  // TURKEY RUN in huge display type with a dark outline and a gold face.
  ctx.font = '900 118px system-ui, sans-serif';
  ctx.lineWidth = 16;
  ctx.strokeStyle = '#5d2f10';
  ctx.strokeText('TURKEY RUN', VIEW_W / 2, 168);
  const grad = ctx.createLinearGradient(0, 80, 0, 180);
  grad.addColorStop(0, '#ffe9a8');
  grad.addColorStop(0.55, '#ffc21f');
  grad.addColorStop(1, '#f08c0a');
  ctx.fillStyle = grad;
  ctx.fillText('TURKEY RUN', VIEW_W / 2, 168);
  // Subtitle ribbon.
  ctx.fillStyle = PALETTE.barnRed;
  roundRect(ctx, VIEW_W / 2 - 238, 196, 476, 46, 23);
  ctx.fill();
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '900 27px system-ui, sans-serif';
  ctx.fillText('★ THE GREAT ESCAPE ★', VIEW_W / 2, 228);

  // Feature inventory panel, right side.
  const px = 826;
  const py = 300;
  ctx.fillStyle = PALETTE.panel;
  roundRect(ctx, px, py, 428, 252, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 217, 138, 0.85)';
  ctx.lineWidth = 2;
  roundRect(ctx, px, py, 428, 252, 16);
  ctx.stroke();
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffd98a';
  ctx.font = '900 21px system-ui, sans-serif';
  ctx.fillText('IN THIS GAME', px + 26, py + 40);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '700 17.5px system-ui, sans-serif';
  FEATURES.forEach((line, i) => {
    ctx.fillText(`•  ${line}`, px + 26, py + 78 + i * 31);
  });

  // Controls and the start prompt in one panel along the bottom.
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.panel;
  roundRect(ctx, VIEW_W / 2 - 430, 686, 860, 92, 14);
  ctx.fill();
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '800 23px system-ui, sans-serif';
  ctx.fillText('SPACE / ↑ / CLICK — jump (×2 for double)      ↓ — duck & hide', VIEW_W / 2, 722);
  const pulse = 0.72 + Math.sin(state.time * 4) * 0.28;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = PALETTE.gold;
  ctx.font = '900 27px system-ui, sans-serif';
  ctx.fillText('CLICK or press SPACE to run!', VIEW_W / 2, 758);
  ctx.restore();
  ctx.textAlign = 'left';
}

/** Caught: the farmer holds the turkey up by its feet. Dinner is back on. */
export function drawCaught(ctx, state) {
  drawBackground(ctx, state);
  ctx.fillStyle = 'rgba(40, 16, 8, 0.45)';
  ctx.fillRect(0, 0, VIEW_W, 800);
  drawCaughtScene(ctx, state);
  drawEndPanel(ctx, state, {
    heading: 'CAUGHT!',
    headingColour: '#ff6b57',
    line: 'The farmer got his Thanksgiving dinner after all…',
  });
}

function drawCaughtScene(ctx, state) {
  // Farmer standing proud at centre, turkey dangling upside down from his hand.
  ctx.save();
  ctx.translate(430, GROUND_Y);
  ctx.scale(1.35, 1.35);
  drawPosterFarmer(ctx, state.time, true);
  ctx.restore();
  ctx.save();
  ctx.translate(505, GROUND_Y - 208);
  ctx.rotate(Math.PI * 0.94 + Math.sin(state.time * 2) * 0.05);
  ctx.scale(0.95, 0.95);
  drawPosterTurkey(ctx, state.time, true);
  ctx.restore();
  drawBubble(ctx, 430, GROUND_Y - 268, '!');
}

/** Escaped: the turkey at the forest edge at sunset, wings up, free. */
export function drawEscaped(ctx, state) {
  drawForestSunset(ctx);
  drawEscapedTurkey(ctx, state);
  drawEndPanel(ctx, state, {
    heading: 'ESCAPED!',
    headingColour: PALETTE.gold,
    line: 'Free at last — no dinner tonight. The forest keeps its turkey.',
  });
}

function drawForestSunset(ctx) {
  const sky = ctx.createLinearGradient(0, 0, 0, 800);
  sky.addColorStop(0, '#ff9d5c');
  sky.addColorStop(0.5, '#ffb347');
  sky.addColorStop(1, '#ffd98a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, 800);
  // The low sun, dead centre, huge.
  const halo = ctx.createRadialGradient(640, 470, 20, 640, 470, 320);
  halo.addColorStop(0, 'rgba(255, 243, 196, 0.95)');
  halo.addColorStop(0.4, 'rgba(255, 220, 140, 0.45)');
  halo.addColorStop(1, 'rgba(255, 220, 140, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(320, 150, 640, 640);
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.ellipse(640, 470, 92, 92, 0, 0, Math.PI * 2);
  ctx.fill();
  // Tree silhouettes framing both sides.
  ctx.fillStyle = '#3d5a1e';
  for (const [tx, th, tw] of [[30, 470, 90], [110, 400, 70], [1010, 440, 84], [1120, 490, 96], [180, 350, 56], [940, 360, 60]]) {
    ctx.beginPath();
    ctx.moveTo(tx, GROUND_Y + 60);
    ctx.lineTo(tx + tw / 2, GROUND_Y + 60 - th);
    ctx.lineTo(tx + tw, GROUND_Y + 60);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(tx + tw / 2 - 6, GROUND_Y + 40, 12, 40);
  }
  // Meadow.
  ctx.fillStyle = '#7d9c38';
  ctx.fillRect(0, GROUND_Y, VIEW_W, 800 - GROUND_Y);
  ctx.fillStyle = '#6d8a2f';
  ctx.fillRect(0, GROUND_Y, VIEW_W, 10);
  // Wildflowers.
  for (let i = 0; i < 26; i += 1) {
    const fx = (i * 173) % VIEW_W;
    const fy = GROUND_Y + 26 + ((i * 41) % 70);
    ctx.fillStyle = ['#ffd83d', '#ff8fab', '#fff6e3'][i % 3];
    ctx.beginPath();
    ctx.ellipse(fx, fy, 4, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEscapedTurkey(ctx, state) {
  ctx.save();
  ctx.translate(640, GROUND_Y + 6);
  ctx.scale(1.7, 1.7);
  // Wings raised in triumph.
  ctx.fillStyle = PALETTE.featherShade;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 26, -56);
    ctx.rotate(side * -0.9);
    ctx.beginPath();
    ctx.ellipse(side * 14, 0, 26, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  drawPosterTurkey(ctx, state.time, false, true);
  ctx.restore();
  // Sparkles of freedom.
  ctx.fillStyle = '#fff3c4';
  for (let i = 0; i < 8; i += 1) {
    const a = state.time * 0.9 + (i * Math.PI * 2) / 8;
    const sx = 640 + Math.cos(a) * 150;
    const sy = GROUND_Y - 120 + Math.sin(a) * 66;
    ctx.beginPath();
    ctx.ellipse(sx, sy, 4.5, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Shared end-screen panel: heading, story line, stats, and the RESTART button. */
function drawEndPanel(ctx, state, { heading, headingColour, line }) {
  ctx.textAlign = 'center';
  ctx.font = '900 96px system-ui, sans-serif';
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#5d2f10';
  ctx.strokeText(heading, VIEW_W / 2, 150);
  ctx.fillStyle = headingColour;
  ctx.fillText(heading, VIEW_W / 2, 150);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '800 25px system-ui, sans-serif';
  ctx.save();
  ctx.shadowColor = 'rgba(60, 30, 8, 0.8)';
  ctx.shadowBlur = 8;
  ctx.fillText(line, VIEW_W / 2, 196);
  ctx.restore();

  // Stats panel, up in the sky so it never covers the scene below.
  const px = VIEW_W / 2 - 235;
  const py = 246;
  ctx.fillStyle = PALETTE.panel;
  roundRect(ctx, px, py, 470, 84, 14);
  ctx.fill();
  ctx.fillStyle = '#ffd98a';
  ctx.font = '800 19px system-ui, sans-serif';
  ctx.fillText('FINAL SCORE', px + 118, py + 32);
  ctx.fillText('DISTANCE', px + 352, py + 32);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '900 32px system-ui, sans-serif';
  ctx.fillText(fmt(state.score), px + 118, py + 68);
  ctx.fillText(`${fmt(state.distanceM)} m`, px + 352, py + 68);

  // RESTART button; main.js hit-tests clicks against this same rectangle.
  const btn = restartRect();
  const hover = state.time % 1.4 < 0.9;
  ctx.fillStyle = hover ? '#e0392c' : '#c22e21';
  roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 14);
  ctx.fill();
  ctx.strokeStyle = PALETTE.cream;
  ctx.lineWidth = 3;
  roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 14);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = '900 30px system-ui, sans-serif';
  ctx.fillText('↻  RESTART', VIEW_W / 2, btn.y + 41);
  ctx.font = '700 17px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255, 246, 227, 0.85)';
  ctx.fillText('or press SPACE', VIEW_W / 2, btn.y + btn.h + 26);
  ctx.textAlign = 'left';
}

/** The RESTART button's rectangle, shared by the drawing and the click test. */
export function restartRect() {
  return { x: VIEW_W / 2 - 130, y: 668, w: 260, h: 58 };
}

/** A poster-sized farmer for the menu screens (chasing pose or proud pose). */
export function drawPosterFarmer(ctx, time, proud = false) {
  // Legs.
  ctx.strokeStyle = '#3f5a8a';
  ctx.lineWidth = 15;
  ctx.lineCap = 'round';
  if (proud) {
    ctx.beginPath();
    ctx.moveTo(-4, -62);
    ctx.lineTo(-10, -2);
    ctx.moveTo(10, -62);
    ctx.lineTo(18, -2);
    ctx.stroke();
  } else {
    const phase = time * 11;
    for (let leg = 0; leg < 2; leg += 1) {
      const swing = Math.sin(phase + leg * Math.PI) * 0.8;
      ctx.beginPath();
      ctx.moveTo(-6 + leg * 13, -62);
      ctx.lineTo(-6 + leg * 13 + Math.sin(swing) * 17, -32);
      ctx.lineTo(-6 + leg * 13 + Math.sin(swing + 0.6) * 20, -2);
      ctx.stroke();
    }
  }
  // Torso: shirt + overalls.
  ctx.fillStyle = '#c94f38';
  roundRect(ctx, -23, -122, 48, 32, 8);
  ctx.fill();
  ctx.fillStyle = '#3f5a8a';
  roundRect(ctx, -20, -96, 42, 40, 6);
  ctx.fill();
  ctx.fillStyle = '#46679c';
  roundRect(ctx, -13, -118, 28, 26, 4);
  ctx.fill();
  // Arm: reaching forward, or raised holding the prize.
  ctx.strokeStyle = '#c94f38';
  ctx.lineWidth = 13;
  ctx.beginPath();
  if (proud) {
    ctx.moveTo(16, -108);
    ctx.quadraticCurveTo(44, -128, 52, -168);
  } else {
    ctx.moveTo(16, -108);
    ctx.quadraticCurveTo(44, -102, 62, -94);
  }
  ctx.stroke();
  ctx.fillStyle = '#f0b98a';
  ctx.beginPath();
  ctx.ellipse(proud ? 54 : 66, proud ? -172 : -93, 8, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Head + hat.
  ctx.fillStyle = '#f0b98a';
  ctx.beginPath();
  ctx.ellipse(4, -140, 17, 19, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8a5a33';
  ctx.beginPath();
  ctx.ellipse(6, -129, 13, 9, 0, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = PALETTE.ink;
  ctx.beginPath();
  ctx.ellipse(10, -143, 2.6, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8c96a';
  ctx.beginPath();
  ctx.ellipse(4, -158, 27, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(4, -164, 15, 10, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.barnRed;
  ctx.fillRect(-11, -160, 30, 5);
}

/** A poster-sized turkey for the menu screens (running, dangling or proud). */
export function drawPosterTurkey(ctx, time, dangling = false, proud = false) {
  const phase = time * 12;
  // Legs: scissoring, dangling limp, or planted proud.
  ctx.strokeStyle = PALETTE.beak;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  for (let leg = 0; leg < 2; leg += 1) {
    const hipX = -8 + leg * 16;
    if (dangling) {
      ctx.beginPath();
      ctx.moveTo(hipX, -24);
      ctx.lineTo(hipX + (leg ? 5 : -3), 6);
      ctx.stroke();
    } else if (proud) {
      ctx.beginPath();
      ctx.moveTo(hipX, -26);
      ctx.lineTo(hipX, -1);
      ctx.stroke();
    } else {
      const swing = Math.sin(phase + leg * Math.PI) * 0.85;
      ctx.beginPath();
      ctx.moveTo(hipX, -26);
      ctx.lineTo(hipX + Math.sin(swing) * 14, -14);
      ctx.lineTo(hipX + Math.sin(swing + 0.7) * 16, -1);
      ctx.stroke();
    }
  }
  // Tail fan.
  const angles = [-0.95, -0.5, -0.12, 0.28, 0.62];
  const colours = [PALETTE.tailC, PALETTE.tailA, PALETTE.tailB, PALETTE.tailA, PALETTE.tailC];
  angles.forEach((angle, i) => {
    ctx.save();
    ctx.translate(-26, -52);
    ctx.rotate(angle - 0.35);
    ctx.fillStyle = colours[i];
    roundRect(ctx, -7, -52, 15, 56, 8);
    ctx.fill();
    ctx.restore();
  });
  // Body and wing.
  ctx.fillStyle = PALETTE.feather;
  ctx.beginPath();
  ctx.ellipse(0, -46, 40, 34, -0.08, 0, Math.PI * 2);
  ctx.fill();
  if (!proud) {
    ctx.fillStyle = PALETTE.featherShade;
    ctx.beginPath();
    ctx.ellipse(-2, -44, 22, 15, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Head: X eyes when dangling, bright when proud.
  ctx.strokeStyle = PALETTE.feather;
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.moveTo(22, -62);
  ctx.quadraticCurveTo(30, -72, 34, -80);
  ctx.stroke();
  ctx.fillStyle = PALETTE.feather;
  ctx.beginPath();
  ctx.ellipse(36, -84, 16, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.beak;
  ctx.beginPath();
  ctx.moveTo(48, -87);
  ctx.lineTo(66, -82);
  ctx.lineTo(48, -77);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.wattle;
  ctx.beginPath();
  ctx.ellipse(49, -72, 5, 9, 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  if (dangling) {
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(37, -90);
    ctx.lineTo(45, -82);
    ctx.moveTo(45, -90);
    ctx.lineTo(37, -82);
    ctx.stroke();
  } else {
    ctx.fillStyle = PALETTE.ink;
    ctx.beginPath();
    ctx.ellipse(41, -87, 3.4, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
