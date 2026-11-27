// The farmer: the chaser, with visible AI the screenshots can show.
// Modes: chase (turkey in sight — he closes in, faster in later stages), seek (turkey hid —
// he runs to the last-seen spot), search (standing at that spot, looking left and right
// under a big "?" while the turkey gains ground), trip (a rolling pumpkin floored him,
// "!" overhead) and the knife wind-up he telegraphs before every throw.

import { CATCH_GAP, GROUND_Y, PALETTE, TURKEY_X, WARN_GAP } from './config.js';
import { sfx } from './audio.js';
import { spawnKnife } from './hazards.js';
import { roundRect } from './turkey.js';

/** A fresh farmer, a comfortable gap behind the turkey. */
export function createFarmer() {
  return {
    gap: 430, // px behind the turkey; CATCH_GAP means his hands close
    mode: 'chase', // chase | seek | search | trip
    modeT: 0, // seconds left in search / trip
    lookDir: 1, // search gaze: flips while he looks around
    lookT: 0,
    runPhase: 0,
    throwT: 3.5, // seconds until the next knife throw (stages 2 and 3)
    windupT: 0, // >0 while he is winding up a throw
    tripCooldown: 5, // seconds before a pumpkin can floor him again
    bubble: null, // '?' while searching, '!' on wind-up and trips
    wasHidden: false, // edge detector for the alarm sting
  };
}

/** The farmer's screen x: his feet stand this far behind the turkey. */
export function farmerX(farmer) {
  return TURKEY_X - farmer.gap;
}

/**
 * Step the farmer's brain. Returns 'caught' when his hands close on a visible turkey.
 * `spawnedItems` is the list new knives are pushed onto.
 */
export function updateFarmer(state, dt, spawnedItems) {
  const farmer = state.farmer;
  const turkey = state.turkey;
  farmer.tripCooldown = Math.max(0, farmer.tripCooldown - dt);
  farmer.runPhase += dt * (state.stage.speed / 24);
  farmer.bubble = null;

  // Alarm the moment the turkey breaks cover and he sees it again.
  if (farmer.wasHidden && !turkey.hidden && farmer.mode === 'chase') sfx.alarm();
  farmer.wasHidden = turkey.hidden;

  if (farmer.mode === 'trip') {
    farmer.modeT -= dt;
    farmer.bubble = '!';
    farmer.gap += 110 * dt; // the turkey runs on while he is down
    if (farmer.modeT <= 0) farmer.mode = turkey.hidden ? 'seek' : 'chase';
    return null;
  }

  if (farmer.mode === 'search') {
    farmer.modeT -= dt;
    farmer.bubble = '?';
    farmer.gap += 60 * dt; // standing still, he loses ground fast
    farmer.lookT -= dt;
    if (farmer.lookT <= 0) {
      farmer.lookDir = farmer.lookDir > 0 ? -1 : 1;
      farmer.lookT = 0.55;
    }
    if (farmer.modeT <= 0) farmer.mode = turkey.hidden ? 'seek' : 'chase';
    return null;
  }

  if (turkey.hidden) {
    // Seek: run to where the turkey vanished, then search there.
    farmer.mode = 'seek';
    farmer.gap -= 34 * dt;
    if (farmer.gap <= 74) {
      farmer.gap = 74;
      farmer.mode = 'search';
      farmer.modeT = 2.4;
      farmer.lookT = 0;
    }
    return null;
  }

  farmer.mode = 'chase';
  // Chase: he closes steadily — faster in the barnyard, fastest in the kitchen —
  // while the turkey's clean running claws a little of it back.
  const closeRate = 11 + state.stageIndex * 8;
  farmer.gap -= closeRate * dt;
  farmer.gap += 5.5 * dt;

  // Knife throws, telegraphed: a wind-up with a "!", then the knife leaves his hand.
  if (state.stageIndex >= 1 && farmer.gap > 170 && farmer.gap < 780) {
    if (farmer.windupT > 0) {
      farmer.windupT -= dt;
      farmer.bubble = '!';
      if (farmer.windupT <= 0) {
        spawnedItems.push(spawnKnife(state));
        farmer.throwT = state.stageIndex === 2 ? 3.1 : 4.6;
      }
    } else {
      farmer.throwT -= dt;
      if (farmer.throwT <= 0) farmer.windupT = 0.45;
    }
  }

  farmer.gap = Math.max(CATCH_GAP - 6, farmer.gap);
  if (farmer.gap <= CATCH_GAP && !turkey.hidden) return 'caught';
  return null;
}

/** Trip the farmer if a rolling pumpkin is at his feet; called by main.js each frame. */
export function maybeTripFarmer(state, items) {
  const farmer = state.farmer;
  if (farmer.mode === 'trip' || farmer.mode === 'search' || farmer.tripCooldown > 0) return;
  const fx = farmerX(farmer);
  for (const item of items) {
    if (item.type !== 'pumpkin') continue;
    const ix = item.worldX - state.scrollX;
    if (ix > fx - 6 && ix < fx + 58) {
      farmer.mode = 'trip';
      farmer.modeT = 1.15;
      farmer.tripCooldown = 7;
      sfx.thud();
      return;
    }
  }
}

/** Draw the farmer at his gap behind the turkey, in the pose his mode calls for. */
export function drawFarmer(ctx, state) {
  const farmer = state.farmer;
  const x = farmerX(farmer);
  ctx.save();
  ctx.translate(x, GROUND_Y);

  if (farmer.mode === 'trip') drawTrippedFarmer(ctx, farmer);
  else if (farmer.mode === 'search') drawSearchingFarmer(ctx, farmer);
  else drawChasingFarmer(ctx, state);

  ctx.restore();

  if (farmer.bubble) drawBubble(ctx, x, GROUND_Y - 196, farmer.bubble);
  // Exclamation of effort when he is close enough to matter.
  if (farmer.mode === 'chase' && farmer.gap < WARN_GAP && !farmer.bubble) {
    drawBubble(ctx, x, GROUND_Y - 196, '!');
  }
}

function drawChasingFarmer(ctx, state) {
  const farmer = state.farmer;
  const reach = farmer.gap < 230 ? 1 : 0.45; // arms stretch out as he closes in
  drawRunLegs(ctx, farmer.runPhase);
  drawFarmerBody(ctx, 0);
  // Reaching arm, thrown forward toward the turkey.
  ctx.strokeStyle = '#c94f38'; // plaid-shirt sleeve
  ctx.lineWidth = 13;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(16, -108);
  ctx.quadraticCurveTo(38, -104, 34 + reach * 30, -96 - reach * 6);
  ctx.stroke();
  drawHand(ctx, 38 + reach * 30, -95 - reach * 6);
  // Back arm pumping.
  ctx.beginPath();
  ctx.moveTo(10, -106);
  ctx.quadraticCurveTo(-16, -96, -22, -76 + Math.sin(farmer.runPhase) * 8);
  ctx.stroke();
  drawFarmerHead(ctx, farmer.mode === 'chase' ? 'angry' : 'calm', 1);
  if (farmer.windupT > 0) {
    // The telegraphed throw: free arm cocked back, knife in hand.
    ctx.strokeStyle = '#c94f38';
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.moveTo(12, -108);
    ctx.lineTo(-30, -138);
    ctx.stroke();
    ctx.save();
    ctx.translate(-34, -142);
    ctx.rotate(-0.7);
    ctx.fillStyle = '#d9dee6';
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(26, 0);
    ctx.lineTo(0, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawSearchingFarmer(ctx, farmer) {
  drawStillLegs(ctx);
  drawFarmerBody(ctx, 0);
  // Hand shading his eyes, head turned the way he is looking.
  ctx.strokeStyle = '#c94f38';
  ctx.lineWidth = 13;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(16, -110);
  ctx.quadraticCurveTo(36, -128, 32 + farmer.lookDir * 8, -148);
  ctx.stroke();
  ctx.fillStyle = '#f0b98a';
  ctx.beginPath();
  ctx.ellipse(34 + farmer.lookDir * 8, -150, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  drawFarmerHead(ctx, 'puzzled', farmer.lookDir);
  // Other hand on hip.
  ctx.beginPath();
  ctx.moveTo(8, -104);
  ctx.quadraticCurveTo(-14, -92, -10, -72);
  ctx.stroke();
}

function drawTrippedFarmer(ctx, farmer) {
  ctx.save();
  ctx.rotate(-0.12);
  ctx.translate(0, -6);
  // Legs in the air, boots up.
  ctx.strokeStyle = '#3f5a8a';
  ctx.lineWidth = 15;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, -34);
  ctx.lineTo(-30, -66);
  ctx.moveTo(8, -32);
  ctx.lineTo(22, -70);
  ctx.stroke();
  drawFarmerBody(ctx, -34);
  drawFarmerHead(ctx, 'dizzy', 1);
  ctx.restore();
  // Circling stars of comic dizziness.
  ctx.fillStyle = PALETTE.gold;
  for (let i = 0; i < 3; i += 1) {
    const a = state_time(farmer) * 2.4 + (i * Math.PI * 2) / 3;
    const sx = 6 + Math.cos(a) * 30;
    const sy = -168 + Math.sin(a) * 8;
    drawStar(ctx, sx, sy, 6);
  }
}

function state_time(farmer) {
  return farmer.runPhase * 0.12;
}

function drawRunLegs(ctx, phase) {
  ctx.strokeStyle = '#3f5a8a'; // denim overalls legs
  ctx.lineWidth = 15;
  ctx.lineCap = 'round';
  for (let leg = 0; leg < 2; leg += 1) {
    const swing = Math.sin(phase + leg * Math.PI) * 0.8;
    const hipX = -6 + leg * 13;
    ctx.beginPath();
    ctx.moveTo(hipX, -62);
    ctx.lineTo(hipX + Math.sin(swing) * 17, -32);
    ctx.lineTo(hipX + Math.sin(swing + 0.6) * 20, -2);
    ctx.stroke();
    // Boot.
    ctx.fillStyle = PALETTE.woodDark;
    roundRect(ctx, hipX + Math.sin(swing + 0.6) * 20 - 4, -8, 20, 8, 3);
    ctx.fill();
  }
}

function drawStillLegs(ctx) {
  ctx.strokeStyle = '#3f5a8a';
  ctx.lineWidth = 15;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-4, -62);
  ctx.lineTo(-8, -2);
  ctx.moveTo(10, -62);
  ctx.lineTo(16, -2);
  ctx.stroke();
  ctx.fillStyle = PALETTE.woodDark;
  roundRect(ctx, -14, -8, 20, 8, 3);
  ctx.fill();
  roundRect(ctx, 12, -8, 20, 8, 3);
  ctx.fill();
}

/** Torso: plaid shirt under denim overalls, drawn around the hip line y=0. */
function drawFarmerBody(ctx, lift = 0) {
  // Overalls.
  ctx.fillStyle = '#3f5a8a';
  roundRect(ctx, -20, -96 + lift, 42, 40, 6);
  ctx.fill();
  // Shirt at the shoulders and chest sides.
  ctx.fillStyle = '#c94f38';
  roundRect(ctx, -23, -122 + lift, 48, 32, 8);
  ctx.fill();
  // Overall bib over the shirt.
  ctx.fillStyle = '#46679c';
  roundRect(ctx, -13, -118 + lift, 28, 26, 4);
  ctx.fill();
  // Straps and buttons.
  ctx.fillStyle = '#3f5a8a';
  ctx.fillRect(-19, -122 + lift, 7, 16);
  ctx.fillRect(14, -122 + lift, 7, 16);
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.ellipse(-11, -104 + lift, 3, 3, 0, 0, Math.PI * 2);
  ctx.ellipse(16, -104 + lift, 3, 3, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** Head with straw hat; expression: angry | puzzled | dizzy | calm. Facing +x * lookDir. */
function drawFarmerHead(ctx, expression, lookDir) {
  ctx.save();
  ctx.translate(4, -140);
  ctx.scale(lookDir, 1);
  // Face.
  ctx.fillStyle = '#f0b98a';
  ctx.beginPath();
  ctx.ellipse(0, 0, 17, 19, 0, 0, Math.PI * 2);
  ctx.fill();
  // Beard.
  ctx.fillStyle = '#8a5a33';
  ctx.beginPath();
  ctx.ellipse(2, 11, 13, 9, 0, 0, Math.PI);
  ctx.fill();
  // Nose.
  ctx.fillStyle = '#e09a63';
  ctx.beginPath();
  ctx.ellipse(13, 2, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Eye(s): X for dizzy, raised brow for puzzled, angled brow for angry.
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.4;
  if (expression === 'dizzy') {
    ctx.beginPath();
    ctx.moveTo(2, -8);
    ctx.lineTo(10, 0);
    ctx.moveTo(10, -8);
    ctx.lineTo(2, 0);
    ctx.stroke();
  } else {
    ctx.fillStyle = PALETTE.ink;
    ctx.beginPath();
    ctx.ellipse(6, -3, 2.6, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    if (expression === 'angry') {
      ctx.moveTo(0, -11);
      ctx.lineTo(12, -7);
    } else if (expression === 'puzzled') {
      ctx.moveTo(0, -10);
      ctx.quadraticCurveTo(6, -14, 12, -10);
    } else {
      ctx.moveTo(0, -9);
      ctx.lineTo(12, -9);
    }
    ctx.stroke();
  }
  // Mouth: gritted for angry, small o for puzzled.
  ctx.beginPath();
  if (expression === 'puzzled') {
    ctx.ellipse(8, 8, 3.4, 4.2, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (expression !== 'dizzy') {
    ctx.moveTo(3, 9);
    ctx.lineTo(13, 9);
    ctx.stroke();
  }
  ctx.restore();
  // Straw hat, unflipped by the gaze direction.
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

function drawHand(ctx, x, y) {
  ctx.fillStyle = '#f0b98a';
  ctx.beginPath();
  ctx.ellipse(x, y, 8, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Grabby fingers.
  ctx.strokeStyle = '#f0b98a';
  ctx.lineWidth = 3.4;
  ctx.lineCap = 'round';
  for (let f = -1; f <= 1; f += 1) {
    ctx.beginPath();
    ctx.moveTo(x + 5, y + f * 4);
    ctx.lineTo(x + 12, y + f * 5);
    ctx.stroke();
  }
}

/** A speech bubble with one big glyph: '?' for searching, '!' for alarms and trips. */
export function drawBubble(ctx, x, y, glyph) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#fffdf4';
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3;
  roundRect(ctx, -19, -24, 38, 40, 11);
  ctx.fill();
  ctx.stroke();
  // Bubble tail.
  ctx.beginPath();
  ctx.moveTo(-5, 15);
  ctx.lineTo(3, 28);
  ctx.lineTo(10, 15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = glyph === '?' ? '#b3541e' : PALETTE.heartRed;
  ctx.font = '900 30px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(glyph, 0, 0);
  ctx.restore();
}

function drawStar(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const px = x + Math.cos(a) * rad;
    const py = y + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}
