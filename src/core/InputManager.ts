import { Vector2D } from '../types';

export enum InputAction {
  MOVE_UP = 'MOVE_UP',
  MOVE_DOWN = 'MOVE_DOWN',
  MOVE_LEFT = 'MOVE_LEFT',
  MOVE_RIGHT = 'MOVE_RIGHT',
  AIM_UP = 'AIM_UP',
  AIM_DOWN = 'AIM_DOWN',
  AIM_LEFT = 'AIM_LEFT',
  AIM_RIGHT = 'AIM_RIGHT',
  PRIMARY_ATTACK = 'PRIMARY_ATTACK',
  DASH = 'DASH',
  OVERDRIVE = 'OVERDRIVE',
  CHRONO = 'CHRONO',
  INTERACT = 'INTERACT',
  PAUSE = 'PAUSE',
  CONFIRM = 'CONFIRM',
  CANCEL = 'CANCEL',
  SELECT_1 = 'SELECT_1',
  SELECT_2 = 'SELECT_2',
  SELECT_3 = 'SELECT_3',
  SELECT_4 = 'SELECT_4',
  OPEN_CODEX = 'OPEN_CODEX',
  SWITCH_WEAPON = 'SWITCH_WEAPON',
  MUTE = 'MUTE'
}

export class InputManager {
  private static instance: InputManager;
  private keyState: Map<string, boolean> = new Map();
  private prevKeyState: Map<string, boolean> = new Map();
  private justPressedKeys: Set<string> = new Set();
  private justReleasedKeys: Set<string> = new Set();

  private keyBindings: Map<InputAction, string[]> = new Map([
    [InputAction.MOVE_UP, ['KeyW', 'ArrowUp']],
    [InputAction.MOVE_DOWN, ['KeyS', 'ArrowDown']],
    [InputAction.MOVE_LEFT, ['KeyA', 'ArrowLeft']],
    [InputAction.MOVE_RIGHT, ['KeyD', 'ArrowRight']],
    [InputAction.AIM_UP, ['KeyI']],
    [InputAction.AIM_DOWN, ['KeyK']],
    [InputAction.AIM_LEFT, ['KeyJ']],
    [InputAction.AIM_RIGHT, ['KeyL']],
    [InputAction.PRIMARY_ATTACK, ['Space', 'KeyJ', 'Enter']],
    [InputAction.DASH, ['ShiftLeft', 'ShiftRight', 'KeyK', 'KeyZ']],
    [InputAction.OVERDRIVE, ['KeyE', 'KeyX']],
    [InputAction.CHRONO, ['KeyQ', 'KeyC']],
    [InputAction.INTERACT, ['KeyF', 'KeyE']],
    [InputAction.PAUSE, ['Escape', 'KeyP']],
    [InputAction.CONFIRM, ['Enter', 'Space']],
    [InputAction.CANCEL, ['Escape', 'Backspace']],
    [InputAction.SELECT_1, ['Digit1', 'Numpad1']],
    [InputAction.SELECT_2, ['Digit2', 'Numpad2']],
    [InputAction.SELECT_3, ['Digit3', 'Numpad3']],
    [InputAction.SELECT_4, ['Digit4', 'Numpad4']],
    [InputAction.OPEN_CODEX, ['KeyC']],
    [InputAction.SWITCH_WEAPON, ['KeyQ', 'Tab']],
    [InputAction.MUTE, ['KeyM']]
  ]);

  private lastMoveVector: Vector2D = { x: 0, y: -1 }; // default facing up

  private constructor() {
    this.initListeners();
  }

  public static getInstance(): InputManager {
    if (!InputManager.instance) {
      InputManager.instance = new InputManager();
    }
    return InputManager.instance;
  }

  private initListeners(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      // Prevent browser default scroll for game controls
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) {
        e.preventDefault();
      }

      if (!this.keyState.get(e.code)) {
        this.justPressedKeys.add(e.code);
      }
      this.keyState.set(e.code, true);
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      this.keyState.set(e.code, false);
      this.justReleasedKeys.add(e.code);
    });

    // Reset when focus is lost
    window.addEventListener('blur', () => {
      this.keyState.clear();
      this.justPressedKeys.clear();
      this.justReleasedKeys.clear();
    });
  }

  public update(): void {
    // Clear transient single-frame press/release buffers
    this.justPressedKeys.clear();
    this.justReleasedKeys.clear();

    // Check Gamepad if connected
    this.pollGamepad();
  }

  private pollGamepad(): void {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    if (!gamepads || !gamepads[0]) return;

    const pad = gamepads[0];
    if (!pad) return;

    // Gamepad button mappings
    const threshold = 0.25;
    if (pad.axes[0] < -threshold) this.keyState.set('PadLeft', true);
    if (pad.axes[0] > threshold) this.keyState.set('PadRight', true);
    if (pad.axes[1] < -threshold) this.keyState.set('PadUp', true);
    if (pad.axes[1] > threshold) this.keyState.set('PadDown', true);

    // Buttons: 0=A (confirm/attack), 1=B (dash), 2=X (overdrive), 3=Y (chrono), 9=Start (pause)
    if (pad.buttons[0]?.pressed) this.keyState.set('PadA', true);
    if (pad.buttons[1]?.pressed) this.keyState.set('PadB', true);
    if (pad.buttons[2]?.pressed) this.keyState.set('PadX', true);
    if (pad.buttons[9]?.pressed) this.justPressedKeys.add('Escape');
  }

  public isDown(action: InputAction): boolean {
    const keys = this.keyBindings.get(action);
    if (!keys) return false;
    return keys.some(k => this.keyState.get(k) === true);
  }

  public isJustPressed(action: InputAction): boolean {
    const keys = this.keyBindings.get(action);
    if (!keys) return false;
    return keys.some(k => this.justPressedKeys.has(k));
  }

  public isJustReleased(action: InputAction): boolean {
    const keys = this.keyBindings.get(action);
    if (!keys) return false;
    return keys.some(k => this.justReleasedKeys.has(k));
  }

  public getMovementVector(): Vector2D {
    let dx = 0;
    let dy = 0;

    if (this.isDown(InputAction.MOVE_UP)) dy -= 1;
    if (this.isDown(InputAction.MOVE_DOWN)) dy += 1;
    if (this.isDown(InputAction.MOVE_LEFT)) dx -= 1;
    if (this.isDown(InputAction.MOVE_RIGHT)) dx += 1;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const invLen = 1 / Math.SQRT2;
      dx *= invLen;
      dy *= invLen;
    }

    if (dx !== 0 || dy !== 0) {
      this.lastMoveVector = { x: dx, y: dy };
    }

    return { x: dx, y: dy };
  }

  public getFacingVector(): Vector2D {
    // Check direct aim keys first (I/J/K/L)
    let ax = 0;
    let ay = 0;
    if (this.isDown(InputAction.AIM_UP)) ay -= 1;
    if (this.isDown(InputAction.AIM_DOWN)) ay += 1;
    if (this.isDown(InputAction.AIM_LEFT)) ax -= 1;
    if (this.isDown(InputAction.AIM_RIGHT)) ax += 1;

    if (ax !== 0 || ay !== 0) {
      const len = Math.hypot(ax, ay);
      return { x: ax / len, y: ay / len };
    }

    // Fallback to last movement direction
    return { ...this.lastMoveVector };
  }

  public setBinding(action: InputAction, keys: string[]): void {
    this.keyBindings.set(action, keys);
  }

  public getBindings(): Map<InputAction, string[]> {
    return new Map(this.keyBindings);
  }
}
