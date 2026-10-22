// Combat System: Handles entity deaths, XP drops, particle bursts, and scoring

import { System, World } from '../World';
import { TransformComponent, HealthComponent, EnemyAIComponent, XpDropComponent, ColliderComponent, RenderComponent, ParticleComponent, LifetimeComponent, VelocityComponent } from '../Component';
import { EventBus, GameEvents } from '../../core/EventBus';
import { SoundSynth } from '../../audio/SoundSynth';
import { RunStats, EntityType, EnemyType } from '../../types';

export class CombatSystem implements System {
  private runStats: RunStats;

  constructor(runStats: RunStats) {
    this.runStats = runStats;
  }

  public update(_dt: number, world: World): void {
    const eventBus = EventBus.getInstance();
    const synth = SoundSynth.getInstance();

    const enemies = world.query(['EnemyAI', 'Health', 'Transform']);

    for (const enemy of enemies) {
      const h = enemy.getComponent<HealthComponent>('Health')!;
      const t = enemy.getComponent<TransformComponent>('Transform')!;
      const ai = enemy.getComponent<EnemyAIComponent>('EnemyAI')!;

      if (h.current <= 0 && enemy.alive) {
        enemy.alive = false;

        // 1. Scoring & Stats
        this.runStats.score += ai.scoreValue;
        this.runStats.enemiesKilled++;

        // 2. Play explosion SFX
        const isBoss = ai.enemyType === EnemyType.BOSS_MECH;
        synth.playExplosion(isBoss ? 2.5 : 1.0);
        eventBus.emit(GameEvents.SCREEN_SHAKE, isBoss ? 22 : 5);

        // 3. Spawn XP Gem drop
        this.spawnXpGem(world, t.x, t.y, ai.xpValue);

        // 4. Spawn Explosion Sparks
        this.spawnExplosionParticles(world, t.x, t.y, isBoss ? 45 : 14, isBoss ? '#ff0055' : '#00ffff');

        // 5. Emit event
        eventBus.emit(GameEvents.ENEMY_DIED, {
          enemyType: ai.enemyType,
          x: t.x,
          y: t.y,
          score: ai.scoreValue
        });

        if (isBoss) {
          eventBus.emit(GameEvents.BOSS_DEFEATED);
        }

        enemy.destroy();
      }
    }
  }

  private spawnXpGem(world: World, x: number, y: number, value: number): void {
    const gem = world.createEntity();
    gem.addComponent(new TransformComponent(x, y, 0))
       .addComponent(new ColliderComponent(10, true, 'pickup'))
       .addComponent(new XpDropComponent(value, 200, 650))
       .addComponent(new RenderComponent(EntityType.XP_GEM, '#00ffcc', '#00ffaa', 7, 'polygon', 4));
  }

  private spawnExplosionParticles(world: World, x: number, y: number, count: number, color: string): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 280;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const life = 0.3 + Math.random() * 0.45;

      const p = world.createEntity();
      p.addComponent(new TransformComponent(x, y, angle))
       .addComponent(new VelocityComponent(vx, vy, 0.90, 400))
       .addComponent(new RenderComponent(EntityType.PARTICLE, color, color, 3 + Math.random() * 4, 'circle'))
       .addComponent(new ParticleComponent(2.0, 6.0, true))
       .addComponent(new LifetimeComponent(life));
    }
  }
}
