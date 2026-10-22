// Spawn & Wave Progression System: Controls enemy spawns, wave escalations, and Boss encounters

import { System, World } from '../World';
import { TransformComponent, VelocityComponent, HealthComponent, ColliderComponent, RenderComponent, EnemyAIComponent } from '../Component';
import { EventBus, GameEvents } from '../../core/EventBus';
import { RunStats, EnemyType, EntityType } from '../../types';
import { ENEMY_REGISTRY } from '../../content/Enemies';

export class SpawnSystem implements System {
  private runStats: RunStats;
  private waveTimer: number = 0;
  private spawnInterval: number = 1.6;
  private spawnCooldown: number = 0;
  private isBossWaveActive: boolean = false;

  constructor(runStats: RunStats) {
    this.runStats = runStats;
  }

  public update(dt: number, world: World): void {
    const eventBus = EventBus.getInstance();
    this.waveTimer += dt;
    this.spawnCooldown += dt;

    // Escalate wave every 30 seconds
    const targetWave = Math.floor(this.waveTimer / 30) + 1;
    if (targetWave > this.runStats.wave) {
      this.runStats.wave = targetWave;
      eventBus.emit(GameEvents.WAVE_COMPLETED, { wave: this.runStats.wave });

      // Check if boss wave (every 5 waves)
      if (this.runStats.wave % 5 === 0 && !this.isBossWaveActive) {
        this.spawnBoss(world);
      }
    }

    // Dynamic spawn interval scales with wave
    const currentInterval = Math.max(0.45, this.spawnInterval - (this.runStats.wave - 1) * 0.08);

    if (this.spawnCooldown >= currentInterval) {
      this.spawnCooldown = 0;
      this.spawnWaveGroup(world);
    }
  }

  private spawnWaveGroup(world: World): void {
    const players = world.query(['PlayerControl', 'Transform']);
    if (players.length === 0) return;

    const pt = players[0].getComponent<TransformComponent>('Transform')!;

    // Don't overwhelm if max enemy cap reached
    const currentEnemies = world.query(['EnemyAI']);
    const enemyCap = 35 + this.runStats.wave * 4;
    if (currentEnemies.length >= enemyCap) return;

    // Spawn 1 to 3 enemies per burst
    const count = Math.min(3, 1 + Math.floor(this.runStats.wave / 3));
    for (let i = 0; i < count; i++) {
      const type = this.chooseEnemyType();
      this.spawnEnemyAtDistance(world, pt.x, pt.y, type);
    }
  }

  private chooseEnemyType(): EnemyType {
    const roll = Math.random();
    const wave = this.runStats.wave;

    if (wave >= 4 && roll < 0.20) return EnemyType.GLITCH_PHANTOM;
    if (wave >= 3 && roll < 0.40) return EnemyType.SNIPER_TURRET;
    if (wave >= 2 && roll < 0.65) return EnemyType.CYBER_ENFORCER;
    return EnemyType.DRONE_SWARM;
  }

  private spawnEnemyAtDistance(world: World, px: number, py: number, type: EnemyType): void {
    const def = ENEMY_REGISTRY[type];
    // Spawn in a ring outside screen (700-900px away)
    const angle = Math.random() * Math.PI * 2;
    const distance = 750 + Math.random() * 200;
    const x = px + Math.cos(angle) * distance;
    const y = py + Math.sin(angle) * distance;

    // Check elite roll
    const eliteChance = Math.min(0.35, (this.runStats.wave - 1) * 0.08);
    const isElite = this.runStats.wave >= 2 && Math.random() < eliteChance;

    const modifiers: ('shielded' | 'speed' | 'splitter' | 'volatile')[] = ['shielded', 'speed', 'splitter', 'volatile'];
    const modifier = isElite ? modifiers[Math.floor(Math.random() * modifiers.length)] : undefined;

    // Scale health with wave and elite multiplier
    const healthMultiplier = (1 + (this.runStats.wave - 1) * 0.18) * (isElite ? 2.5 : 1.0);
    const hp = Math.round(def.maxHp * healthMultiplier);
    const speed = def.speed * (modifier === 'speed' ? 1.45 : 1.0);
    const radius = def.radius * (isElite ? 1.3 : 1.0);
    const color = isElite ? '#ffe600' : def.color;
    const glow = isElite ? '#ffaa00' : def.glowColor;

    const enemy = world.createEntity();
    const aiComp = new EnemyAIComponent(
      type,
      speed,
      def.attackCooldown * (isElite ? 0.8 : 1.0),
      def.scoreValue * (isElite ? 3 : 1),
      def.xpValue * (isElite ? 3 : 1)
    );
    aiComp.isElite = isElite;
    aiComp.eliteModifier = modifier;

    enemy.addComponent(new TransformComponent(x, y, angle))
         .addComponent(new VelocityComponent(0, 0, 0.94, speed))
         .addComponent(new ColliderComponent(radius, false, 'enemy'))
         .addComponent(new HealthComponent(hp, hp))
         .addComponent(aiComp)
         .addComponent(new RenderComponent(EntityType.ENEMY, color, glow, radius, def.shape, def.points));
  }

  private spawnBoss(world: World): void {
    const players = world.query(['PlayerControl', 'Transform']);
    if (players.length === 0) return;

    const pt = players[0].getComponent<TransformComponent>('Transform')!;
    const def = ENEMY_REGISTRY[EnemyType.BOSS_MECH];
    const eventBus = EventBus.getInstance();

    this.isBossWaveActive = true;
    eventBus.emit(GameEvents.BOSS_SPAWNED, { name: def.name });

    const angle = Math.random() * Math.PI * 2;
    const distance = 650;
    const x = pt.x + Math.cos(angle) * distance;
    const y = pt.y + Math.sin(angle) * distance;

    const bossHp = Math.round(def.maxHp * (1 + (this.runStats.wave / 5 - 1) * 0.5));

    const boss = world.createEntity();
    boss.addComponent(new TransformComponent(x, y, angle))
        .addComponent(new VelocityComponent(0, 0, 0.96, def.speed))
        .addComponent(new ColliderComponent(def.radius, false, 'enemy'))
        .addComponent(new HealthComponent(bossHp, bossHp))
        .addComponent(new EnemyAIComponent(EnemyType.BOSS_MECH, def.speed, def.attackCooldown, def.scoreValue, def.xpValue))
        .addComponent(new RenderComponent(EntityType.ENEMY, def.color, def.glowColor, def.radius, def.shape, def.points));
  }

  public reset(): void {
    this.waveTimer = 0;
    this.spawnCooldown = 0;
    this.isBossWaveActive = false;
  }
}
