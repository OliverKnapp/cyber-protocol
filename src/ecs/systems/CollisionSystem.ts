// Collision System: Rapid spatial query resolution for projectiles, enemies, and XP cores

import { System, World } from '../World';
import { Entity } from '../Entity';
import { TransformComponent, ColliderComponent, HealthComponent, ProjectileComponent, XpDropComponent, VelocityComponent } from '../Component';
import { EventBus, GameEvents } from '../../core/EventBus';
import { SoundSynth } from '../../audio/SoundSynth';
import { PlayerStats, RunStats } from '../../types';

export class CollisionSystem implements System {
  private playerStats: PlayerStats;
  private runStats: RunStats;

  constructor(playerStats: PlayerStats, runStats: RunStats) {
    this.playerStats = playerStats;
    this.runStats = runStats;
  }

  public update(dt: number, world: World): void {
    const eventBus = EventBus.getInstance();
    const synth = SoundSynth.getInstance();

    const players = world.query(['PlayerControl', 'Transform', 'Collider', 'Health']);
    if (players.length === 0) return;

    const player = players[0];
    const pt = player.getComponent<TransformComponent>('Transform')!;
    const pc = player.getComponent<ColliderComponent>('Collider')!;
    const ph = player.getComponent<HealthComponent>('Health')!;

    // Decrement player invulnerability timer
    if (ph.invulnerableTimer > 0) {
      ph.invulnerableTimer -= dt;
    }

    // 1. Process XP Gem Magnet Attraction & Collection
    const xpGems = world.query(['XpDrop', 'Transform']);
    for (const gem of xpGems) {
      const gt = gem.getComponent<TransformComponent>('Transform')!;
      const drop = gem.getComponent<XpDropComponent>('XpDrop')!;

      const dx = pt.x - gt.x;
      const dy = pt.y - gt.y;
      const dist = Math.hypot(dx, dy);

      // Vacuum magnet range
      if (dist < this.playerStats.pickupRadius) {
        const pullSpeed = drop.flySpeed * dt;
        gt.x += (dx / dist) * pullSpeed;
        gt.y += (dy / dist) * pullSpeed;

        // Collection radius
        if (dist < pc.radius + 14) {
          synth.playXpChime();
          const xpGained = Math.round(drop.value * this.playerStats.xpMultiplier);
          this.runStats.currentXp += xpGained;
          this.playerStats.overdriveCharge = Math.min(
            this.playerStats.maxOverdrive,
            this.playerStats.overdriveCharge + drop.value * 2
          );

          eventBus.emit(GameEvents.XP_GAINED, { xp: xpGained, total: this.runStats.currentXp });
          gem.destroy();
        }
      }
    }

    // 2. Player Projectiles vs Enemies
    const playerProjectiles = world.query(['Projectile', 'Transform', 'Collider']);
    for (const proj of playerProjectiles) {
      const pComp = proj.getComponent<ProjectileComponent>('Projectile')!;
      if (pComp.source !== 'player') continue;

      const pTrans = proj.getComponent<TransformComponent>('Transform')!;
      const pColl = proj.getComponent<ColliderComponent>('Collider')!;

      // Query nearby enemies via spatial grid
      const potentialEnemies = world.getPotentialColliders(pTrans.x, pTrans.y, pColl.radius + 50);

      for (const enemy of potentialEnemies) {
        if (!enemy.alive || !enemy.hasComponents(['EnemyAI', 'Health', 'Transform', 'Collider'])) continue;

        const eTrans = enemy.getComponent<TransformComponent>('Transform')!;
        const eColl = enemy.getComponent<ColliderComponent>('Collider')!;
        const eHealth = enemy.getComponent<HealthComponent>('Health')!;

        const d = Math.hypot(pTrans.x - eTrans.x, pTrans.y - eTrans.y);
        if (d < pColl.radius + eColl.radius) {
          // Hit detected!
          eHealth.current -= pComp.damage;
          this.runStats.damageDealt += pComp.damage;

          // Knockback
          if (enemy.hasComponent('Velocity') && pComp.knockback > 0) {
            const ev = enemy.getComponent<VelocityComponent>('Velocity')!;
            const knockAngle = Math.atan2(eTrans.y - pTrans.y, eTrans.x - pTrans.x);
            ev.vx += Math.cos(knockAngle) * pComp.knockback;
            ev.vy += Math.sin(knockAngle) * pComp.knockback;
          }

          eventBus.emit(GameEvents.ENEMY_DAMAGED, {
            enemy,
            damage: pComp.damage,
            isCrit: pComp.isCrit,
            x: eTrans.x,
            y: eTrans.y
          });

          // Pierce logic
          if (pComp.pierce > 0) {
            pComp.pierce--;
          } else {
            proj.destroy();
            break;
          }
        }
      }
    }

    // 3. Enemy Projectiles vs Player
    if (ph.invulnerableTimer <= 0) {
      for (const proj of playerProjectiles) {
        const pComp = proj.getComponent<ProjectileComponent>('Projectile')!;
        if (pComp.source !== 'enemy') continue;

        const pTrans = proj.getComponent<TransformComponent>('Transform')!;
        const pColl = proj.getComponent<ColliderComponent>('Collider')!;

        const dist = Math.hypot(pTrans.x - pt.x, pTrans.y - pt.y);
        if (dist < pColl.radius + pc.radius) {
          this.damagePlayer(pComp.damage, player, eventBus, synth);
          proj.destroy();
        }
      }

      // 4. Enemy Body Contact vs Player
      const nearbyEnemies = world.getPotentialColliders(pt.x, pt.y, pc.radius + 50);
      for (const enemy of nearbyEnemies) {
        if (!enemy.alive || !enemy.hasComponents(['EnemyAI', 'Transform', 'Collider'])) continue;

        const eTrans = enemy.getComponent<TransformComponent>('Transform')!;
        const eColl = enemy.getComponent<ColliderComponent>('Collider')!;

        const dist = Math.hypot(pt.x - eTrans.x, pt.y - eTrans.y);
        if (dist < pc.radius + eColl.radius) {
          this.damagePlayer(15, player, eventBus, synth);
          break;
        }
      }
    }
  }

  private damagePlayer(rawDamage: number, player: Entity, eventBus: EventBus, synth: SoundSynth): void {
    const ph = player.getComponent<HealthComponent>('Health')!;
    const mitigated = Math.max(1, rawDamage - this.playerStats.armor);

    this.playerStats.hp = Math.max(0, this.playerStats.hp - mitigated);
    ph.current = this.playerStats.hp;
    ph.invulnerableTimer = 0.55; // i-frames

    synth.playHit();
    eventBus.emit(GameEvents.SCREEN_SHAKE, 8);
    eventBus.emit(GameEvents.PLAYER_DAMAGED, { damage: mitigated, hp: this.playerStats.hp });

    if (this.playerStats.hp <= 0) {
      eventBus.emit(GameEvents.PLAYER_DIED);
    }
  }
}
