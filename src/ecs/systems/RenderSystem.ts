// High-performance procedural Cyberpunk Vector Neon Renderer

import { System, World } from '../World';
import { TransformComponent, RenderComponent, HealthComponent, EnemyAIComponent } from '../Component';
import { Camera } from '../../core/Camera';
import { EntityType, EnemyType } from '../../types';

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  size: number;
  vy: number;
}

export class RenderSystem implements System {
  private ctx: CanvasRenderingContext2D;
  private camera: Camera;
  private floatingTexts: FloatingText[] = [];
  private gridOffset: number = 0;
  private arenaSize: number = 2400;

  constructor(ctx: CanvasRenderingContext2D, camera: Camera) {
    this.ctx = ctx;
    this.camera = camera;
  }

  public addFloatingText(x: number, y: number, text: string, color: string, isCrit: boolean = false): void {
    this.floatingTexts.push({
      x,
      y: y - 10,
      text,
      color,
      alpha: 1.0,
      size: isCrit ? 22 : 14,
      vy: isCrit ? -70 : -45
    });
  }

  public update(dt: number, world: World): void {
    const ctx = this.ctx;
    this.gridOffset = (this.gridOffset + dt * 20) % 80;

    // 1. Clear background
    ctx.fillStyle = '#06070d';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // 2. Camera Transform into World Space
    this.camera.applyTransform(ctx);

    // 3. Render Cyber-Grid & Arena Perimeter
    this.renderArenaGrid(ctx);

    // 4. Render All World Entities
    const renderables = world.query(['Transform', 'Render']);

    // Sort renderables by layer: Particles & XP Gems -> Enemies -> Player -> Projectiles -> Boss
    renderables.sort((a, b) => {
      const typeA = a.getComponent<RenderComponent>('Render')!.entityType;
      const typeB = b.getComponent<RenderComponent>('Render')!.entityType;
      return this.getRenderOrder(typeA) - this.getRenderOrder(typeB);
    });

    for (const entity of renderables) {
      const t = entity.getComponent<TransformComponent>('Transform')!;
      const r = entity.getComponent<RenderComponent>('Render')!;
      const h = entity.getComponent<HealthComponent>('Health');

      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.rotation);
      ctx.globalAlpha = r.alpha;

      // Glow setting
      ctx.shadowColor = r.glowColor;
      ctx.shadowBlur = r.entityType === EntityType.PLAYER ? 18 : 12;

      switch (r.entityType) {
        case EntityType.PLAYER:
          this.renderPlayer(ctx, r, h);
          break;
        case EntityType.ENEMY: {
          const ai = entity.getComponent<EnemyAIComponent>('EnemyAI');
          this.renderEnemy(ctx, r, h, ai);
          break;
        }
        case EntityType.PROJECTILE:
          this.renderProjectile(ctx, r);
          break;
        case EntityType.XP_GEM:
          this.renderXpGem(ctx, r);
          break;
        case EntityType.PARTICLE:
          this.renderParticle(ctx, r);
          break;
        case EntityType.SHOCKWAVE:
          this.renderShockwave(ctx, r);
          break;
      }

      ctx.restore();

      // Render Enemy / Boss Health Bar in world space
      if (h && r.entityType === EntityType.ENEMY && h.current < h.max) {
        this.renderHealthBar(ctx, t.x, t.y - r.radius - 12, h.current, h.max, r.radius * 2, r.shape === 'boss');
      }
    }

    // 5. Render Floating Combat Damage Text
    this.renderFloatingText(ctx, dt);

    // Restore Camera Transform
    this.camera.restoreTransform(ctx);
  }

  private getRenderOrder(type: EntityType): number {
    switch (type) {
      case EntityType.SHOCKWAVE: return 1;
      case EntityType.PARTICLE: return 2;
      case EntityType.XP_GEM: return 3;
      case EntityType.ENEMY: return 4;
      case EntityType.PLAYER: return 5;
      case EntityType.PROJECTILE: return 6;
      default: return 0;
    }
  }

  private renderArenaGrid(ctx: CanvasRenderingContext2D): void {
    const half = this.arenaSize / 2;
    const step = 80;

    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.07)';

    ctx.beginPath();
    for (let x = -half; x <= half; x += step) {
      ctx.moveTo(x, -half);
      ctx.lineTo(x, half);
    }
    for (let y = -half; y <= half; y += step) {
      ctx.moveTo(-half, y);
      ctx.lineTo(half, y);
    }
    ctx.stroke();

    // Arena Perimeter Laser Barrier
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#00f3ff';
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 25;
    ctx.strokeRect(-half, -half, this.arenaSize, this.arenaSize);

    // Corner Accents
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#ff0055';
    ctx.shadowColor = '#ff0055';
    const cLen = 120;

    // Top-left
    ctx.beginPath();
    ctx.moveTo(-half, -half + cLen);
    ctx.lineTo(-half, -half);
    ctx.lineTo(-half + cLen, -half);
    // Top-right
    ctx.moveTo(half - cLen, -half);
    ctx.lineTo(half, -half);
    ctx.lineTo(half, -half + cLen);
    // Bottom-left
    ctx.moveTo(-half, half - cLen);
    ctx.lineTo(-half, half);
    ctx.lineTo(-half + cLen, half);
    // Bottom-right
    ctx.moveTo(half - cLen, half);
    ctx.lineTo(half, half);
    ctx.lineTo(half, half - cLen);
    ctx.stroke();

    ctx.restore();
  }

  private renderPlayer(ctx: CanvasRenderingContext2D, r: RenderComponent, h?: HealthComponent): void {
    const isInvuln = h && h.invulnerableTimer > 0;

    // Thruster exhaust flame
    ctx.fillStyle = '#00f3ff';
    ctx.beginPath();
    ctx.moveTo(-16, -6);
    ctx.lineTo(-24 - Math.random() * 10, 0);
    ctx.lineTo(-16, 6);
    ctx.closePath();
    ctx.fill();

    // Player Cyber Interceptor Chassis
    ctx.fillStyle = isInvuln && Math.floor(Date.now() / 60) % 2 === 0 ? '#ffffff' : '#0e1526';
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(18, 0);       // Nose cone
    ctx.lineTo(-14, -14);    // Left wingtip
    ctx.lineTo(-8, -4);      // Left engine notch
    ctx.lineTo(-12, 0);      // Center engine
    ctx.lineTo(-8, 4);       // Right engine notch
    ctx.lineTo(-14, 14);     // Right wingtip
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing cockpit core
    ctx.fillStyle = '#ff0077';
    ctx.shadowColor = '#ff0077';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(2, 0, 5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Invulnerability shield ring
    if (isInvuln) {
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  private renderEnemy(ctx: CanvasRenderingContext2D, r: RenderComponent, h?: HealthComponent, ai?: EnemyAIComponent): void {
    const pts = r.points || 3;
    const rad = r.radius;

    ctx.fillStyle = '#150a17';
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 2;

    // Render Elite Crown / Aura
    if (ai?.isElite) {
      ctx.save();
      ctx.strokeStyle = '#ffe600';
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 18;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI * 2) / 6;
        const ex = Math.cos(a) * (rad + 8);
        const ey = Math.sin(a) * (rad + 8);
        if (i === 0) ctx.moveTo(ex, ey);
        else ctx.lineTo(ex, ey);
      }
      ctx.closePath();
      ctx.stroke();

      // Frontal shield barrier if shielded modifier
      if (ai.eliteModifier === 'shielded') {
        ctx.strokeStyle = '#00f3ff';
        ctx.shadowColor = '#00f3ff';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, 0, rad + 14, -0.7, 0.7);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (r.shape === 'boss') {
      // Boss Nexus Mech
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI * 2) / 8;
        const outer = i % 2 === 0 ? rad : rad * 0.75;
        const px = Math.cos(a) * outer;
        const py = Math.sin(a) * outer;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Pulsing central boss eye
      ctx.fillStyle = '#ff0033';
      ctx.shadowColor = '#ff0077';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(0, 0, rad * 0.35, 0, Math.PI * 2);
      ctx.fill();

      // Orbital shield rings
      ctx.strokeStyle = 'rgba(255, 0, 85, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, rad + 12, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Standard enemy polygon (triangle drone, hex enforcer, diamond sniper)
      ctx.beginPath();
      for (let i = 0; i < pts; i++) {
        const a = (i * Math.PI * 2) / pts;
        const px = Math.cos(a) * rad;
        const py = Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Core eye
      ctx.fillStyle = r.color;
      ctx.beginPath();
      ctx.arc(0, 0, rad * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderProjectile(ctx: CanvasRenderingContext2D, r: RenderComponent): void {
    if (r.shape === 'slash') {
      // Blade energy wave arc
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, r.radius, -0.6, 0.6);
      ctx.stroke();
    } else {
      // Energy bullet capsule
      ctx.fillStyle = r.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, r.radius * 1.8, r.radius, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderXpGem(ctx: CanvasRenderingContext2D, r: RenderComponent): void {
    // Rotating diamond octahedron
    const rad = r.radius;
    ctx.fillStyle = '#00ffcc';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(0, -rad);
    ctx.lineTo(rad * 0.8, 0);
    ctx.lineTo(0, rad);
    ctx.lineTo(-rad * 0.8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  private renderParticle(ctx: CanvasRenderingContext2D, r: RenderComponent): void {
    ctx.fillStyle = r.color;
    ctx.beginPath();
    ctx.arc(0, 0, r.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderShockwave(ctx: CanvasRenderingContext2D, r: RenderComponent): void {
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, r.radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  private renderHealthBar(ctx: CanvasRenderingContext2D, x: number, y: number, current: number, max: number, width: number, isBoss: boolean): void {
    const h = isBoss ? 8 : 4;
    const w = Math.max(width, 28);
    const ratio = Math.max(0, Math.min(1, current / max));

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x - w / 2, y, w, h);

    ctx.fillStyle = isBoss ? '#ff0033' : '#ff0055';
    ctx.fillRect(x - w / 2, y, w * ratio, h);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - w / 2, y, w, h);
    ctx.restore();
  }

  private renderFloatingText(ctx: CanvasRenderingContext2D, dt: number): void {
    ctx.save();
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.alpha -= dt * 1.6;

      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }

      ctx.font = `900 ${ft.size}px 'Orbitron', monospace`;
      ctx.textAlign = 'center';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.restore();
  }
}
