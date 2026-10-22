import { Vector2D } from '../types';

export class Camera {
  public x: number = 0;
  public y: number = 0;
  public viewportWidth: number = 1280;
  public viewportHeight: number = 720;
  public zoom: number = 1.0;

  private shakeIntensity: number = 0;
  private shakeDecay: number = 0.9;
  private shakeOffsetX: number = 0;
  private shakeOffsetY: number = 0;

  constructor(width: number, height: number) {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  public resize(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  public follow(targetX: number, targetY: number, lerpFactor: number = 0.1): void {
    // Smooth lerp to center target in viewport
    const desiredX = targetX - this.viewportWidth / (2 * this.zoom);
    const desiredY = targetY - this.viewportHeight / (2 * this.zoom);

    this.x += (desiredX - this.x) * lerpFactor;
    this.y += (desiredY - this.y) * lerpFactor;
  }

  public addShake(amount: number): void {
    this.shakeIntensity = Math.min(this.shakeIntensity + amount, 35);
  }

  public update(): void {
    if (this.shakeIntensity > 0.1) {
      this.shakeOffsetX = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.shakeOffsetY = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.shakeIntensity *= this.shakeDecay;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
      this.shakeIntensity = 0;
    }
  }

  public applyTransform(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(
      -this.x + this.shakeOffsetX,
      -this.y + this.shakeOffsetY
    );
    ctx.scale(this.zoom, this.zoom);
  }

  public restoreTransform(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }

  public worldToScreen(wx: number, wy: number): Vector2D {
    return {
      x: (wx - this.x + this.shakeOffsetX) * this.zoom,
      y: (wy - this.y + this.shakeOffsetY) * this.zoom
    };
  }

  public screenToWorld(sx: number, sy: number): Vector2D {
    return {
      x: sx / this.zoom + this.x - this.shakeOffsetX,
      y: sy / this.zoom + this.y - this.shakeOffsetY
    };
  }
}
