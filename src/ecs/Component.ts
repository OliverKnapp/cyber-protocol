// ECS Component Definitions

import { EntityType, EnemyType, WeaponId, Vector2D } from '../types';

export interface Component {
  _type: string;
}

export class TransformComponent implements Component {
  readonly _type = 'Transform';
  constructor(
    public x: number,
    public y: number,
    public rotation: number = 0,
    public scale: number = 1
  ) {}
}

export class VelocityComponent implements Component {
  readonly _type = 'Velocity';
  constructor(
    public vx: number = 0,
    public vy: number = 0,
    public friction: number = 0.92,
    public maxSpeed: number = 400
  ) {}
}

export class RenderComponent implements Component {
  readonly _type = 'Render';
  constructor(
    public entityType: EntityType,
    public color: string = '#00f3ff',
    public glowColor: string = '#00f3ff',
    public radius: number = 16,
    public shape: 'circle' | 'polygon' | 'slash' | 'bullet' | 'boss' = 'circle',
    public points: number = 4, // polygon sides
    public alpha: number = 1
  ) {}
}

export class HealthComponent implements Component {
  readonly _type = 'Health';
  public invulnerableTimer: number = 0;
  constructor(
    public current: number,
    public max: number,
    public invulnerableDuration: number = 0.4
  ) {}
}

export class ColliderComponent implements Component {
  readonly _type = 'Collider';
  constructor(
    public radius: number = 16,
    public isTrigger: boolean = false,
    public collisionLayer: 'player' | 'enemy' | 'player_projectile' | 'enemy_projectile' | 'pickup' = 'player'
  ) {}
}

export class PlayerControlComponent implements Component {
  readonly _type = 'PlayerControl';
  public isAttacking: boolean = false;
  public attackTimer: number = 0;
}

export class EnemyAIComponent implements Component {
  readonly _type = 'EnemyAI';
  public attackTimer: number = 0;
  public stateTimer: number = 0;
  public state: 'chase' | 'orbit' | 'telegraph' | 'dash' | 'special' = 'chase';
  public customAngle: number = 0;

  constructor(
    public enemyType: EnemyType,
    public speed: number = 120,
    public attackCooldown: number = 2.0,
    public scoreValue: number = 100,
    public xpValue: number = 1
  ) {}
}

export class ProjectileComponent implements Component {
  readonly _type = 'Projectile';
  constructor(
    public damage: number,
    public source: 'player' | 'enemy',
    public pierce: number = 0,
    public knockback: number = 100,
    public isCrit: boolean = false,
    public statusEffect?: 'burn' | 'freeze' | 'shock'
  ) {}
}

export class LifetimeComponent implements Component {
  readonly _type = 'Lifetime';
  constructor(public remaining: number) {}
}

export class ParticleComponent implements Component {
  readonly _type = 'Particle';
  constructor(
    public decayRate: number = 2.0,
    public shrinkRate: number = 10.0,
    public glow: boolean = true
  ) {}
}

export class XpDropComponent implements Component {
  readonly _type = 'XpDrop';
  public isCollected: boolean = false;
  constructor(
    public value: number = 1,
    public magnetRange: number = 180,
    public flySpeed: number = 600
  ) {}
}
