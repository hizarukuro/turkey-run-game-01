// Shared numbers for TURKEY RUN: The Great Escape — the canvas size, the ground line,
// the turkey's physics and the autumn palette every other module paints with.
// One place for the tuning, so turkey.js, farmer.js, hazards.js and stages.js agree.

/** Canvas pixels: the game renders at exactly this size and CSS scales it to the window. */
export const VIEW_W = 1280;
export const VIEW_H = 800;

/** The y of the ground surface: feet, wheels and oven bottoms all stand on this line. */
export const GROUND_Y = 676;

/** The turkey's fixed screen x: the world scrolls past it, the farmer closes in behind. */
export const TURKEY_X = 430;

/** How many scrolled pixels make one metre of the distance readout. */
export const PX_PER_M = 45;

/** The distance, in metres, at which the forest edge ends the run: ESCAPED. */
export const FINISH_M = 2000;

/** Gravity in px/s^2, and the two jump impulses (the second is the double jump). */
export const GRAVITY = 2650;
export const JUMP_VY = -1090;
export const DOUBLE_JUMP_VY = -960;

/** The turkey's hearts: one hazard hit costs one, the farmer's hands end the run. */
export const START_LIVES = 3;

/** Farmer gap (px behind the turkey) at which his hands close: caught. */
export const CATCH_GAP = 50;

/** Farmer gap at or below which the HUD flashes its FARMER! warning. */
export const WARN_GAP = 200;

/** Warm autumn palette: golden sky, pumpkin orange, barn red, cream and bark brown. */
export const PALETTE = {
  skyTop: '#ffe3a1',
  skyMid: '#ffc46b',
  skyLow: '#ff9d5c',
  sun: '#fff3c4',
  hillFar: '#e8a558',
  hillNear: '#cf7f3a',
  grass: '#a8b545',
  grassDark: '#7d8f31',
  dirt: '#b0713a',
  dirtDark: '#8a5427',
  cream: '#fff6e3',
  feather: '#fdf3da',
  featherShade: '#e8d3ac',
  tailA: '#b3541e',
  tailB: '#d97b2f',
  tailC: '#8a3b12',
  beak: '#f59e0b',
  wattle: '#d43a2f',
  barnRed: '#b23a2e',
  barnDark: '#8c2a20',
  wood: '#9a6a3b',
  woodDark: '#6f4a26',
  ironDark: '#3c3630',
  ovenGlow: '#ff7a1a',
  gold: '#ffc21f',
  heartRed: '#e0392c',
  ink: '#33241a',
  panel: 'rgba(46, 28, 16, 0.78)',
};
