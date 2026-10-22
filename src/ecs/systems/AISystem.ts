// AI System: Enemy behaviors, telegraphing, and multi-phase Boss mechanics

import { System, World } from '../World';
import { TransformComponent, VelocityComponent, EnemyAIComponent, HealthComponent, ProjectileComponent, ColliderComponent, RenderComponent, LifetimeComponent } from '../Component';
import { EnemyType, EntityType } from '../../types';

export class AISystem implements System {
  public update(dt: number, world: World): void {
    const players = world.query(['PlayerControl', 'Transform', 'Health']);
    if (players.length === 0) return;

    const playerTransform = players[0].getComponent<TransformComponent>('Transform')!;
    const px = playerTransform.x;
    const py = playerTransform.y;

    const enemies = world.query(['EnemyAI', 'Transform', 'Velocity', 'Health']);

    for (const enemy of enemies) {
      const ai = enemy.getComponent<EnemyAIComponent>('EnemyAI')!;
      const t = enemy.getComponent<TransformComponent>('Transform')!;
      const v = enemy.getComponent<VelocityComponent>('Velocity')!;
      const h = enemy.getComponent<HealthComponent>('Health')!;

      ai.attackTimer += dt;
      ai.stateTimer += dt;

      const dx = px - t.x;
      const dy = py - t.y;
      const dist = Math.hypot(dx, dy);
      const angleToPlayer = Math.atan2(dy, dx);

      // Rotate towards player
      t.rotation = angleToPlayer;

      switch (ai.enemyType) {
        case EnemyType.DRONE_SWARM:
          this.updateDroneAI(dt, t, v, ai, dx, dy, dist, angleToPlayer);
          break;
        case EnemyType.CYBER_ENFORCER:
          this.updateEnforcerAI(dt, world, t, v, ai, dist, angleToPlayer);
          break;
        case EnemyType.SNIPER_TURRET:
          this.updateSniperAI(dt, world, t, v, ai, dist, angleToPlayer);
          break;
        case EnemyType.GLITCH_PHANTOM:
          this.updateGlitchAI(dt, t, v, ai, px, py, dist, angleToPlayer);
          break;
        case EnemyType.BOSS_MECH:
          this.updateBossAI(dt, world, t, v, ai, h, dist, angleToPlayer, px, py);
          break;
      }
    }
  }

  private updateDroneAI(dt: number, t: TransformComponent, v: VelocityComponent, ai: EnemyAIComponent, dx: number, dy: number, dist: number, angle: number): void {
    // Weave towards player with slight sine wobble
    ai.customAngle += dt * 5;
    const wobbleAngle = angle + Math.sin(ai.customAngle) * 0.4;
    v.vx = Math.cos(wobbleAngle) * ai.speed;
    v.vy = Math.sin(wobbleAngle) * ai.speed;
  }

  private updateEnforcerAI(dt: number, world: World, t: TransformComponent, v: VelocityComponent, ai: EnemyAIComponent, dist: number, angle: number): void {
    // Keep 260px distance and strafe
    const idealDist = 260;
    if (dist > idealDist + 40) {
      v.vx = Math.cos(angle) * ai.speed;
      v.vy = Math.sin(angle) * ai.speed;
    } else if (dist < idealDist - 40) {
      v.vx = -Math.cos(angle) * ai.speed;
      v.vy = -Math.sin(angle) * ai.speed;
    } else {
      // Strafe perpendicular
      const strafeAngle = angle + Math.PI / 2;
      v.vx = Math.cos(strafeAngle) * (ai.speed * 0.7);
      v.vy = Math.sin(strafeAngle) * (ai.speed * 0.7);
    }

    // Fire 3-burst red laser
    if (ai.attackTimer >= ai.attackCooldown && dist < 450) {
      ai.attackTimer = 0;
      this.fireEnemyBullet(world, t.x, t.y, angle, 380, 14, '#ff0055', 4.5);
    }
  }

  private updateSniperAI(dt: number, world: World, t: TransformComponent, v: VelocityComponent, ai: EnemyAIComponent, dist: number, angle: number): void {
    // Back away if too close
    if (dist < 400) {
      v.vx = -Math.cos(angle) * ai.speed;
      v.vy = -Math.sin(angle) * ai.speed;
    } else {
      v.vx = 0;
      v.vy = 0;
    }

    // Sniper telegraph and fire
    if (ai.attackTimer >= ai.attackCooldown) {
      ai.attackTimer = 0;
      // High speed beam
      this.fireEnemyBullet(world, t.x, t.y, angle, 950, 32, '#bf00ff', 6, 2.5);
    }
  }

  private updateGlitchAI(dt: number, t: TransformComponent, v: VelocityComponent, ai: EnemyAIComponent, px: number, py: number, dist: number, angle: number): void {
    if (dist < 180 && ai.attackTimer > 3.0) {
      // Glitch teleport behind player!
      ai.attackTimer = 0;
      t.x = px - Math.cos(angle) * 120;
      t.y = py - Math.sin(angle) * 120;
    } else {
      v.vx = Math.cos(angle) * ai.speed;
      v.vy = Math.sin(angle) * ai.speed;
    }
  }

  private updateBossAI(dt: number, world: World, t: TransformComponent, v: VelocityComponent, ai: EnemyAIComponent, h: HealthComponent, dist: number, angle: number, px: number, py: number): void {
    const hpRatio = h.current / h.max;

    // Movement: slow menacing advance towards center/player
    v.vx = Math.cos(angle) * (ai.speed * (hpRatio < 0.4 ? 1.5 : 1.0));
    v.vy = Math.sin(angle) * (ai.speed * (hpRatio < 0.4 ? 1.5 : 1.0));

    // Attack state machine
    if (ai.attackTimer >= (hpRatio < 0.5 ? 0.9 : 1.5)) {
      ai.attackTimer = 0;
      ai.customAngle += 0.4;

      // Phase 1: Spiral Bullet Hell
      const bullets = hpRatio < 0.35 ? 16 : 8;
      for (let i = 0; i < bullets; i++) {
        const spiralAngle = ai.customAngle + (i * Math.PI * 2) / bullets;
        this.fireEnemyBullet(world, t.x, t.y, spiralAngle, 260, 18, '#ff0033', 5.5);
      }

      // Phase 2 (< 66% HP): Targeted shotgun bursts towards player
      if (hpRatio < 0.66) {
        for (let i = -1; i <= 1; i++) {
          const aimAngle = angle + i * 0.22;
          this.fireEnemyBullet(world, t.x, t.y, aimAngle, 450, 24, '#ffaa00', 6.0);
        }
      }
    }
  }

  private fireEnemyBullet(world: World, x: number, y: number, angle: number, speed: number, damage: number, color: string, radius: number, life: number = 3.5): void {
    const proj = world.createEntity();
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    proj.addComponent(new TransformComponent(x + Math.cos(angle) * 20, y + Math.sin(angle) * 20, angle))
        .addComponent(new VelocityComponent(vx, vy, 1.0, 1500))
        .addComponent(new ColliderComponent(radius, true, 'enemy_projectile'))
        .addComponent(new ProjectileComponent(damage, 'enemy'))
        .addComponent(new RenderComponent(EntityType.PROJECTILE, color, color, radius, 'bullet'))
        .addComponent(new LifetimeComponent(life));
  }
}
