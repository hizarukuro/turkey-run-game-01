// The turkey: the player. A plump cream bird with a fanned autumn tail, drawn entirely
// with canvas paths. Handles its own physics — running, jumping, the double jump, ducking —
// and its poses: run cycle, tucked legs in the air, low duck, and the hidden peek.

import { DOUBLE_JUMP_VY, GRAVITY, GROUND_Y, JUMP_VY, PALETTE, TURKEY_X } from './config.js';
import { sfx } from './audio.js';

/** A fresh turkey standing on the ground line at the start of a run. */
export function createTurkey() {
  return {
    y: GROUND_Y, // feet height
    vy: 0,
    grounded: true,
    jumpsUsed: 0,
    ducking: false,
    hidden: false,
    invulnT: 0, // mercy invulnerability after a hit, in seconds
    runPhase: 0, // leg animation clock
    wingPhase: 0, // wing flap clock while airborne
    blinkT: 0, // hit-flash clock
  };
}

/** The turkey's collision box for a pose: ducking is much shorter, which ducks knives. */
export function turkeyBox(turkey) {
  const height = turkey.ducking ? 54 : 88;
  return { x: TURKEY_X - 30, y: turkey.y - height, w: 62, h: height };
}

/**
 * Step the turkey: gravity, the buffered jump (double jump allowed), ducking on the
 * ground, and the hidden flag, which main.js sets from cover overlap before this runs.
 */
export function updateTurkey(state, input, dt) {
  const turkey = state.turkey;
  turkey.invulnT = Math.max(0, turkey.invulnT - dt);
  turkey.blinkT = Math.max(0, turkey.blinkT - dt);

  turkey.ducking = input.duckHeld && turkey.grounded;

  if (input.consumeJump() && !turkey.ducking) {
    if (turkey.grounded) {
      turkey.vy = JUMP_VY;
      turkey.grounded = false;
      turkey.jumpsUsed = 1;
      sfx.jump();
    } else if (turkey.jumpsUsed < 2) {
      turkey.vy = DOUBLE_JUMP_VY;
      turkey.jumpsUsed = 2;
      sfx.doubleJump();
    }
  }

  if (!turkey.grounded) {
    turkey.vy += GRAVITY * dt;
    turkey.y += turkey.vy * dt;
    turkey.wingPhase += dt * 26;
    if (turkey.y >= GROUND_Y) {
      turkey.y = GROUND_Y;
      turkey.vy = 0;
      turkey.grounded = true;
      turkey.jumpsUsed = 0;
    }
  } else {
    turkey.runPhase += dt * (state.stage.speed / 26);
  }
}

/** Draw the turkey at its fixed screen x, in the pose its state calls for. */
export function drawTurkey(ctx, state) {
  const turkey = state.turkey;
  // Mercy blink: skip every other slice of the invulnerability window.
  if (turkey.invulnT > 0 && Math.floor(turkey.invulnT * 14) % 2 === 0) return;

  const x = TURKEY_X;
  const feet = turkey.y;
  ctx.save();
  ctx.translate(x, feet);

  if (turkey.ducking) drawDuckingTurkey(ctx, turkey);
  else if (!turkey.grounded) drawAirborneTurkey(ctx, turkey);
  else drawRunningTurkey(ctx, turkey, state.farmer.gap);

  ctx.restore();
}

/** Shared body parts, drawn around the hip point at (0, -bodyH). */
function drawTailFan(ctx, spread = 1) {
  const angles = [-0.95, -0.5, -0.12, 0.28, 0.62];
  const colours = [PALETTE.tailC, PALETTE.tailA, PALETTE.tailB, PALETTE.tailA, PALETTE.tailC];
  angles.forEach((angle, i) => {
    ctx.save();
    ctx.translate(-26, -52);
    ctx.rotate(angle * spread - 0.35);
    ctx.fillStyle = colours[i];
    roundRect(ctx, -7, -52, 15, 56, 8);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 220, 150, 0.85)';
    ctx.beginPath();
    ctx.ellipse(0, -44, 4.5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawBody(ctx, squash = 1) {
  ctx.fillStyle = PALETTE.feather;
  ctx.beginPath();
  ctx.ellipse(0, -46 * squash, 40, 34 * squash, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.featherShade;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Wing: a shaded teardrop on the body's side.
  ctx.fillStyle = PALETTE.featherShade;
  ctx.beginPath();
  ctx.ellipse(-2, -44 * squash, 22, 15 * squash, 0.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawHead(ctx, headX, headY, panic = false) {
  // Neck.
  ctx.strokeStyle = PALETTE.feather;
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.moveTo(headX - 12, headY + 16);
  ctx.quadraticCurveTo(headX - 2, headY + 6, headX, headY);
  ctx.stroke();
  // Head.
  ctx.fillStyle = PALETTE.feather;
  ctx.beginPath();
  ctx.ellipse(headX, headY, 16, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  // Beak.
  ctx.fillStyle = PALETTE.beak;
  ctx.beginPath();
  ctx.moveTo(headX + 12, headY - 3);
  ctx.lineTo(headX + 30, headY + 2);
  ctx.lineTo(headX + 12, headY + 7);
  ctx.closePath();
  ctx.fill();
  // Wattle: the red dangler under the beak.
  ctx.fillStyle = PALETTE.wattle;
  ctx.beginPath();
  ctx.ellipse(headX + 13, headY + 12, 5, 9, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Eye: wide with panic, calm otherwise.
  ctx.fillStyle = PALETTE.ink;
  ctx.beginPath();
  ctx.ellipse(headX + 5, headY - 3, panic ? 4.4 : 3.4, panic ? 5 : 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(headX + 6.5, headY - 5, 1.4, 1.4, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawLegs(ctx, phase, tucked = false) {
  ctx.strokeStyle = PALETTE.beak;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  for (let leg = 0; leg < 2; leg += 1) {
    const swing = tucked ? -0.5 + leg * 0.35 : Math.sin(phase + leg * Math.PI) * 0.85;
    const hipX = -8 + leg * 16;
    const kneeX = hipX + Math.sin(swing) * 14;
    const kneeY = -22;
    const footX = kneeX + Math.sin(swing + 0.7) * 13;
    const footY = tucked ? -8 : -1;
    ctx.beginPath();
    ctx.moveTo(hipX, -26);
    ctx.lineTo(kneeX, kneeY);
    ctx.lineTo(footX, footY);
    ctx.stroke();
    // Three-toed foot.
    ctx.beginPath();
    ctx.moveTo(footX, footY);
    ctx.lineTo(footX + 7, footY);
    ctx.moveTo(footX, footY);
    ctx.lineTo(footX + 3, footY - (tucked ? 2 : 0));
    ctx.stroke();
  }
}

function drawRunningTurkey(ctx, turkey, farmerGap) {
  const panic = farmerGap < 190;
  drawLegs(ctx, turkey.runPhase);
  drawTailFan(ctx);
  drawBody(ctx);
  drawHead(ctx, 34, -86, panic);
  if (panic) {
    // A flying sweat drop: the farmer is RIGHT THERE.
    ctx.fillStyle = '#7ec8e3';
    ctx.beginPath();
    ctx.ellipse(52, -104 - Math.sin(turkey.runPhase * 0.5) * 3, 4, 6, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawAirborneTurkey(ctx, turkey) {
  drawLegs(ctx, 0, true);
  drawTailFan(ctx, 1.15);
  // Flapping wing, raised above the body.
  const flap = Math.sin(turkey.wingPhase) * 0.5;
  ctx.save();
  ctx.translate(-4, -52);
  ctx.rotate(-0.7 - flap);
  ctx.fillStyle = PALETTE.featherShade;
  ctx.beginPath();
  ctx.ellipse(-16, 0, 24, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  drawBody(ctx);
  drawHead(ctx, 36, -88, true);
}

function drawDuckingTurkey(ctx, turkey) {
  drawTailFan(ctx, 0.8);
  drawBody(ctx, 0.72);
  drawHead(ctx, 40, -52, false);
  // Tucked legs under the low body.
  ctx.strokeStyle = PALETTE.beak;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-10, -8);
  ctx.lineTo(16, -2);
  ctx.stroke();
}

/** A rounded rectangle path (not filled) — shared by this module's shapes. */
export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
