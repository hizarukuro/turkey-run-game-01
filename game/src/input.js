// Keyboard and mouse input for TURKEY RUN.
// Space / ArrowUp / W / click = jump (and the "action" that starts and restarts the game);
// ArrowDown / S held = duck, which is also how the turkey hides in hay and pumpkin patches.
// Jump presses are buffered briefly so a press just before landing still jumps.

export class Input {
  constructor(canvas) {
    this.duckHeld = false;
    this.jumpBufferT = 0;
    this.actionT = 0; // time since the last start/restart press, for menu screens
    this.keys = new Set();

    window.addEventListener('keydown', (event) => {
      if (event.repeat) return;
      const code = event.code;
      if (code === 'Space' || code === 'ArrowUp' || code === 'ArrowDown') event.preventDefault();
      this.keys.add(code);
      if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') {
        this.jumpBufferT = 0.12;
        this.actionT = 0;
      }
      if (code === 'ArrowDown' || code === 'KeyS') this.duckHeld = true;
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
      if (event.code === 'ArrowDown' || event.code === 'KeyS') {
        this.duckHeld = this.keys.has('ArrowDown') || this.keys.has('KeyS');
      }
    });
    canvas.addEventListener('pointerdown', (event) => {
      this.jumpBufferT = 0.12;
      this.actionT = 0;
      this.lastPointer = { x: event.clientX, y: event.clientY };
    });
  }

  /** Age the buffers; called once per frame by the game loop. */
  update(dt) {
    if (this.jumpBufferT > 0) this.jumpBufferT -= dt;
    this.actionT += dt;
  }

  /** True once per buffered jump press; consumes it. */
  consumeJump() {
    if (this.jumpBufferT > 0) {
      this.jumpBufferT = 0;
      return true;
    }
    return false;
  }

  /** True while a start/restart press is fresh (menu screens poll this). */
  get actionPressed() {
    return this.actionT < 0.25;
  }
}
