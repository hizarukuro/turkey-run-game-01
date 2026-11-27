// The HUD: everything the player (and the judge's screenshot) reads at a glance.
// Score and distance top-left, the stage pill top-centre, hearts top-right, and along
// the bottom the farmer meter — a track with the farmer at one end and the turkey at
// the other, so the gap between them is always visible. Warnings flash in plain words:
// FARMER! when he is close, HIDDEN while the turkey is tucked in cover, SEARCHING…
// while he is looking the wrong way.

import { CATCH_GAP, PALETTE, VIEW_W, WARN_GAP } from './config.js';
import { roundRect } from './turkey.js';

/** Format a score with thousands separators: 12,450. */
export function fmt(n) {
  return Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Draw the full in-play HUD over the world. */
export function drawHUD(ctx, state) {
  drawScorePanel(ctx, state);
  drawStagePill(ctx, state);
  drawHearts(ctx, state);
  drawFarmerMeter(ctx, state);
  if (state.stageBannerT > 0) drawStageBanner(ctx, state);
}

/** Top-left: SCORE in big type, distance under it, combo when it is running. */
function drawScorePanel(ctx, state) {
  ctx.fillStyle = PALETTE.panel;
  roundRect(ctx, 18, 16, 252, 92, 12);
  ctx.fill();
  ctx.fillStyle = '#ffd98a';
  ctx.font = '800 17px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SCORE', 36, 44);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '900 34px system-ui, sans-serif';
  ctx.fillText(fmt(state.score), 36, 80);
  ctx.font = '800 19px system-ui, sans-serif';
  ctx.fillStyle = '#ffd98a';
  ctx.fillText(`${fmt(state.distanceM)} m`, 168, 79);
  if (state.combo > 1) {
    ctx.fillStyle = PALETTE.gold;
    ctx.font = '900 20px system-ui, sans-serif';
    ctx.fillText(`COMBO ×${state.combo}`, 36, 102);
  }
}

/** Top-centre pill naming the stage, so a screenshot says where the run has got to. */
function drawStagePill(ctx, state) {
  const label = state.stage.name;
  ctx.font = '900 21px system-ui, sans-serif';
  const w = ctx.measureText(label).width + 44;
  const x = (VIEW_W - w) / 2;
  ctx.fillStyle = PALETTE.panel;
  roundRect(ctx, x, 16, w, 44, 22);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 217, 138, 0.8)';
  ctx.lineWidth = 2;
  roundRect(ctx, x, 16, w, 44, 22);
  ctx.stroke();
  ctx.fillStyle = PALETTE.cream;
  ctx.textAlign = 'center';
  ctx.fillText(label, VIEW_W / 2, 45);
}

/** Top-right hearts: full red for a life left, hollow for a life lost. */
function drawHearts(ctx, state) {
  for (let i = 0; i < 3; i += 1) {
    const x = VIEW_W - 52 - i * 52;
    drawHeart(ctx, x, 40, i < state.lives);
  }
}

function drawHeart(ctx, x, y, full) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, 14);
  ctx.bezierCurveTo(-22, -2, -14, -20, 0, -10);
  ctx.bezierCurveTo(14, -20, 22, -2, 0, 14);
  ctx.closePath();
  if (full) {
    ctx.fillStyle = PALETTE.heartRed;
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(-6, -8, 4.5, 3, -0.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = 'rgba(255, 246, 227, 0.75)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Bottom-left farmer meter: the track maps gap 40..780 px onto its length.
 * The farmer's hat sits at his end, the turkey feather at the finish end, and the
 * fill turns red as he closes. Status words sit above the track.
 */
function drawFarmerMeter(ctx, state) {
  const farmer = state.farmer;
  const x = 18;
  const y = 742;
  const w = 470;
  const frac = Math.min(1, Math.max(0, (farmer.gap - CATCH_GAP) / 730));

  // A backing plate so the status word, track and labels read on any ground.
  ctx.fillStyle = 'rgba(40, 24, 12, 0.55)';
  roundRect(ctx, x - 8, y - 44, w + 16, 86, 12);
  ctx.fill();

  // Status word above the meter.
  ctx.textAlign = 'left';
  if (state.turkey.hidden) {
    ctx.fillStyle = '#a8e063';
    ctx.font = '900 24px system-ui, sans-serif';
    ctx.fillText('HIDDEN — he can\'t see you!', x + 2, y - 14);
  } else if (farmer.mode === 'search' || farmer.mode === 'seek') {
    ctx.fillStyle = '#ffd98a';
    ctx.font = '900 24px system-ui, sans-serif';
    ctx.fillText('SEARCHING… run!', x + 2, y - 14);
  } else if (farmer.gap < WARN_GAP && Math.floor(state.time * 5) % 2 === 0) {
    ctx.fillStyle = PALETTE.heartRed;
    ctx.font = '900 30px system-ui, sans-serif';
    ctx.fillText('FARMER!', x + 2, y - 14);
  } else if (farmer.gap < WARN_GAP) {
    ctx.fillStyle = PALETTE.cream;
    ctx.font = '900 30px system-ui, sans-serif';
    ctx.fillText('FARMER!', x + 2, y - 14);
  }

  // Track.
  ctx.fillStyle = PALETTE.panel;
  roundRect(ctx, x, y, w, 26, 13);
  ctx.fill();
  const fillW = Math.max(20, w * frac);
  const grad = ctx.createLinearGradient(x, 0, x + w, 0);
  grad.addColorStop(0, '#e0392c');
  grad.addColorStop(0.45, '#f59e0b');
  grad.addColorStop(1, '#a8b545');
  ctx.fillStyle = grad;
  roundRect(ctx, x, y, fillW, 26, 13);
  ctx.fill();

  // Farmer hat at his end of the fill, turkey feather at the safe end.
  drawMiniHat(ctx, x + fillW, y + 13);
  drawMiniFeather(ctx, x + w - 8, y + 13);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '800 15px system-ui, sans-serif';
  ctx.fillText('FARMER', x + 4, y + 46);
  ctx.textAlign = 'right';
  ctx.fillText('TURKEY', x + w - 4, y + 46);
  ctx.textAlign = 'left';
}

function drawMiniHat(ctx, x, y) {
  ctx.fillStyle = '#e8c96a';
  ctx.beginPath();
  ctx.ellipse(x, y + 3, 15, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x, y - 1, 8.5, 6, 0, Math.PI, Math.PI * 2);
  ctx.fill();
}

function drawMiniFeather(ctx, x, y) {
  ctx.fillStyle = PALETTE.tailB;
  ctx.beginPath();
  ctx.ellipse(x, y, 5, 11, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.tailC;
  ctx.beginPath();
  ctx.ellipse(x - 7, y + 2, 4, 8, -0.4, 0, Math.PI * 2);
  ctx.fill();
}

/** The stage announcement: big stage name and its warning line, fading over 2.4 s. */
function drawStageBanner(ctx, state) {
  const t = state.stageBannerT; // counts down from 2.4
  const alpha = Math.min(1, t / 0.5, (2.4 - t) / 0.4 + 0.2);
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  const y = 218;
  ctx.fillStyle = PALETTE.panel;
  const w = 720;
  roundRect(ctx, (VIEW_W - w) / 2, y - 58, w, 116, 18);
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 3;
  roundRect(ctx, (VIEW_W - w) / 2, y - 58, w, 116, 18);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '900 40px system-ui, sans-serif';
  ctx.fillText(state.stage.name, VIEW_W / 2, y + 2);
  ctx.fillStyle = '#ffd98a';
  ctx.font = '700 20px system-ui, sans-serif';
  ctx.fillText(state.stage.bannerSub, VIEW_W / 2, y + 36);
  ctx.restore();
  ctx.textAlign = 'left';
}
