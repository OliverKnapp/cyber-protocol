// Movement System: Applies velocity, damping, bounds, and lifetime

import { System, World } from '../World';
import { TransformComponent, VelocityComponent, LifetimeComponent } from '../Component';

export class MovementSystem implements System {
  public update(dt: number, world: World): void {
    // 1. Process lifetimes
    const withLifetime = world.query(['Lifetime']);
    for (const e of withLifetime) {
      const life = e.getComponent<LifetimeComponent>('Lifetime')!;
      life.remaining -= dt;
      if (life.remaining <= 0) {
        e.destroy();
      }
    }

    // 2. Process movement physics
    const movers = world.query(['Transform', 'Velocity']);
    for (const e of movers) {
      const t = e.getComponent<TransformComponent>('Transform')!;
      const v = e.getComponent<VelocityComponent>('Velocity')!;

      // Position update
      t.x += v.vx * dt;
      t.y += v.vy * dt;

      // Friction damping
      if (v.friction < 1.0) {
        v.vx *= Math.pow(v.friction, dt * 60);
        v.vy *= Math.pow(v.friction, dt * 60);
      }
    }
  }
}
