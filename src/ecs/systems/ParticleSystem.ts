// Particle System: Decays alpha, shrinks radii, updates trails

import { System, World } from '../World';
import { ParticleComponent, RenderComponent } from '../Component';

export class ParticleSystem implements System {
  public update(dt: number, world: World): void {
    const particles = world.query(['Particle', 'Render']);

    for (const p of particles) {
      const part = p.getComponent<ParticleComponent>('Particle')!;
      const rend = p.getComponent<RenderComponent>('Render')!;

      // Fade alpha
      rend.alpha = Math.max(0, rend.alpha - part.decayRate * dt);

      // Shrink size
      rend.radius = Math.max(0.5, rend.radius - part.shrinkRate * dt);
    }
  }
}
