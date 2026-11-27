// TURKEY RUN: The Great Escape — the game loop and the state that ties the modules
// together. Owns the run's score, lives, distance and stage; steps the turkey, the
// farmer and the world each frame; and stages the deterministic ?shot= scenes the
// screenshots are taken from, so a screenshot is always the real game, framed.

import { FINISH_M, GROUND_Y, PX_PER_M, START_LIVES, TURKEY_X, VIEW_H, VIEW_W } from './config.js';
import { sfx } from './audio.js';
import { Input } from './input.js';
import { createTurkey, drawTurkey, updateTurkey } from './turkey.js';
import { createFarmer, drawFarmer, farmerX, maybeTripFarmer, updateFarmer } from './farmer.js';
import {
  collideTurkey, drawCover, drawCoverOverlay, drawItems, makeItem, spawnPattern,
  turkeyIsHidden, updateItems,
} from './hazards.js';
import { STAGES, drawBackground, stageIndexFor } from './stages.js';
import { drawHUD } from './hud.js';
import { drawCaught, drawEscaped, drawTitle, restartRect } from './screens.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
const input = new Input(canvas);
const params = new URLSearchParams(window.location.search);

/** Deterministic RNG (mulberry32): the same seed lays the same world, every run. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A whole fresh run: title first, everything else at its starting value. */
function createGame(seed) {
  const state = {
    screen: 'title', // title | play | caught | escaped
    screenT: 0,
    time: 0,
    rng: mulberry32(seed),
    scrollX: 0,
    distanceM: 0,
    score: 0,
    lives: START_LIVES,
    combo: 1,
    comboT: 0,
    stageIndex: 0,
    stage: STAGES[0],
    stages: STAGES,
    stageBannerT: 0,
    turkey: createTurkey(),
    farmer: createFarmer(),
    items: [],
    nextSpawnX: 1500,
    hitFlashT: 0,
    pointerGame: null,
  };
  return state;
}

/** Reset a run back to the farmyard gate and start playing at once. */
function startRun(state) {
  const fresh = createGame(state.seed ?? 1);
  Object.assign(state, fresh, { screen: 'play', stageBannerT: 2.4 });
  announce(state);
}

/** Keep the screen-reader status line honest about which screen is up. */
function announce(state) {
  const text = {
    title: 'Turkey Run: The Great Escape. Press space or click to start.',
    play: `Running. Stage ${state.stageIndex + 1}, ${Math.floor(state.distanceM)} metres, ${state.lives} lives.`,
    caught: `Caught! Final score ${Math.floor(state.score)}. Press space to restart.`,
    escaped: `Escaped! Final score ${Math.floor(state.score)}. Press space to restart.`,
  }[state.screen];
  if (status) status.textContent = text;
}

/** One frame of the run: scroll, actors, world, consequences. */
function updatePlay(state, dt) {
  const stage = state.stage;
  state.scrollX += stage.speed * dt;
  state.distanceM = state.scrollX / PX_PER_M;
  state.score += (stage.speed * dt) / PX_PER_M * 5;

  // Stage changes announce themselves.
  const nextStage = stageIndexFor(state.distanceM);
  if (nextStage !== state.stageIndex) {
    state.stageIndex = nextStage;
    state.stage = STAGES[nextStage];
    state.stageBannerT = 2.4;
    sfx.gobble();
  }
  state.stageBannerT = Math.max(0, state.stageBannerT - dt);
  state.hitFlashT = Math.max(0, state.hitFlashT - dt);
  state.comboT = Math.max(0, state.comboT - dt);
  if (state.comboT <= 0) state.combo = 1;

  // The finish line: the forest door ends the run in freedom.
  if (state.distanceM >= FINISH_M) {
    state.screen = 'escaped';
    state.screenT = 0;
    sfx.win();
    announce(state);
    return;
  }

  // Lay patterns ahead; step the world.
  while (state.nextSpawnX < state.scrollX + VIEW_W + 500) {
    state.items.push(...spawnPattern(state));
  }
  updateItems(state, dt);

  // Hiding is decided by cover overlap before either actor moves.
  state.turkey.hidden = turkeyIsHidden(state);
  updateTurkey(state, input, dt);
  state.turkey.hidden = turkeyIsHidden(state);

  // The farmer thinks, throws, trips — and may end the run.
  const spawned = [];
  const verdict = updateFarmer(state, dt, spawned);
  state.items.push(...spawned);
  maybeTripFarmer(state, state.items);
  if (verdict === 'caught') {
    endCaught(state);
    return;
  }

  // Corn and consequences.
  const { hit, collected } = collideTurkey(state);
  for (const corn of collected) {
    if (corn.type === 'goldcorn') {
      state.combo = Math.min(5, state.combo + 1);
      state.score += 150 * state.combo;
    } else {
      state.score += 50 * state.combo;
    }
    state.comboT = 4;
    sfx.pickup(state.combo);
  }
  if (hit && state.turkey.invulnT <= 0) {
    state.lives -= 1;
    state.turkey.invulnT = 1.6;
    state.turkey.blinkT = 0.3;
    state.hitFlashT = 0.35;
    state.combo = 1;
    state.farmer.gap = Math.max(120, state.farmer.gap - 85); // he gains ground
    sfx.squawk();
    if (state.lives <= 0) {
      endCaught(state);
    }
  }
}

function endCaught(state) {
  state.screen = 'caught';
  state.screenT = 0;
  sfx.lose();
  announce(state);
}

/** Draw the current screen. */
function render(state) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (state.screen === 'title') {
    drawTitle(ctx, state);
    return;
  }
  if (state.screen === 'caught') {
    drawCaught(ctx, state);
    return;
  }
  if (state.screen === 'escaped') {
    drawEscaped(ctx, state);
    return;
  }
  drawBackground(ctx, state);
  drawCover(ctx, state);
  drawItems(ctx, state);
  drawFarmer(ctx, state);
  drawTurkey(ctx, state);
  drawCoverOverlay(ctx, state);
  if (state.hitFlashT > 0) {
    ctx.fillStyle = `rgba(224, 57, 44, ${state.hitFlashT * 0.7})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  drawHUD(ctx, state);
}

// ---------------------------------------------------------------------------
// Screenshot scenes: ?shot=kitchen|title|farmyard|escaped builds one exact
// frame of the real game, deterministically, for the maker's screenshots.
// ---------------------------------------------------------------------------

function stageShot(name, state) {
  state.time = 1.35;
  if (name === 'title') {
    state.screen = 'title';
    return;
  }
  if (name === 'escaped') {
    state.screen = 'escaped';
    state.score = 18750;
    state.distanceM = FINISH_M;
    return;
  }
  state.screen = 'play';
  if (name === 'farmyard') {
    // Stage 1: the turkey tucked into a hay bale while the farmer searches.
    state.stageIndex = 0;
    state.stage = STAGES[0];
    state.distanceM = 212;
    state.scrollX = state.distanceM * PX_PER_M;
    state.score = 3150;
    state.lives = 3;
    const at = (screenX) => state.scrollX + screenX;
    state.items = [
      makeItem('hay', at(372)),
      makeItem('fence', at(706)),
      makeItem('corn', at(792), { y: GROUND_Y - 84 }),
      makeItem('corn', at(846), { y: GROUND_Y - 118 }),
      makeItem('goldcorn', at(900), { y: GROUND_Y - 84 }),
      makeItem('patch', at(1010)),
      makeItem('pumpkin', at(1150), { vx: -150 }),
    ];
    state.turkey.ducking = true;
    state.turkey.hidden = true;
    state.farmer.gap = 238;
    state.farmer.mode = 'search';
    state.farmer.lookDir = 1;
    state.farmer.bubble = '?'; // updateFarmer sets this live; the staged frame sets it here
    return;
  }
  // kitchen (the cover): stage 3 at full stretch — leap, knife, farmer, corn.
  state.stageIndex = 2;
  state.stage = STAGES[2];
  state.distanceM = 1542;
  state.scrollX = state.distanceM * PX_PER_M;
  state.score = 12450;
  state.lives = 3;
  state.combo = 3;
  state.comboT = 2;
  const at = (screenX) => state.scrollX + screenX;
  state.items = [
    makeItem('oven', at(368)),
    makeItem('knife', at(596), { y: GROUND_Y - 158, vx: 888 }),
    makeItem('corn', at(724), { y: GROUND_Y - 208 }),
    makeItem('corn', at(782), { y: GROUND_Y - 238 }),
    makeItem('goldcorn', at(840), { y: GROUND_Y - 208 }),
    makeItem('pumpkin', at(972), { vx: -150 }),
    makeItem('oven', at(1120)),
  ];
  state.turkey.y = GROUND_Y - 148;
  state.turkey.grounded = false;
  state.turkey.jumpsUsed = 1;
  state.turkey.wingPhase = 2.4;
  state.farmer.gap = 128;
  state.farmer.mode = 'chase';
  state.farmer.runPhase = 3.2;
}

// ---------------------------------------------------------------------------
// Boot and the frame loop.
// ---------------------------------------------------------------------------

const seed = Number(params.get('seed') ?? 1) || 1;
let state = createGame(seed);
state.seed = seed;
const shot = params.get('shot');
if (shot) stageShot(shot, state);
announce(state);
window.__turkeyRun = { get state() { return state; } };

canvas.addEventListener('pointerdown', (event) => {
  const rect = canvas.getBoundingClientRect();
  state.pointerGame = {
    x: ((event.clientX - rect.left) / rect.width) * VIEW_W,
    y: ((event.clientY - rect.top) / rect.height) * VIEW_H,
  };
  sfx.unlock();
});
window.addEventListener('keydown', () => sfx.unlock());

function frame(nowMs) {
  requestAnimationFrame(frame);
  const now = nowMs / 1000;
  const dt = Math.min(0.033, Math.max(0.0005, now - (frame.last ?? now)));
  frame.last = now;
  input.update(dt);

  if (shot) {
    render(state); // frozen staged frame, re-rendered so fonts settle
    window.__shotReady = true;
    return;
  }

  state.time += dt;
  state.screenT += dt;

  if (state.screen === 'title') {
    if (input.actionPressed && state.screenT > 0.3) {
      sfx.unlock();
      sfx.gobble();
      startRun(state);
    }
  } else if (state.screen === 'play') {
    updatePlay(state, dt);
  } else if (state.screenT > 0.6) {
    // End screens: SPACE, a click anywhere, or the RESTART button itself.
    const btn = restartRect();
    const p = state.pointerGame;
    const clickedButton = p && p.x >= btn.x && p.x <= btn.x + btn.w && p.y >= btn.y && p.y <= btn.y + btn.h;
    if (input.actionPressed || clickedButton) {
      state.pointerGame = null;
      startRun(state);
    }
  }
  render(state);
}
requestAnimationFrame(frame);

// Keep the farmer's screen position honest for anything that asks (farmer.js draws it).
export { farmerX, TURKEY_X };
