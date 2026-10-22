// Input System: Pure Keyboard Navigation & Combat Control

import { System, World } from '../World';
import { TransformComponent, VelocityComponent, HealthComponent, ProjectileComponent, ColliderComponent, RenderComponent, ParticleComponent, LifetimeComponent } from '../Component';
import { InputManager, InputAction } from '../../core/InputManager';
import { SoundSynth } from '../../audio/SoundSynth';
import { EventBus, GameEvents } from '../../core/EventBus';
import { PlayerStats, EntityType, WeaponId } from '../../types';
import { WEAPON_REGISTRY } from '../../content/Weapons';

export class InputSystem implements System {
  private playerStats: PlayerStats;
  private weaponFireTimer: number = 0;
  private arenaWidth: number = 2400;
  private arenaHeight: number = 2400;

  constructor(playerStats: PlayerStats) {
    this.playerStats = playerStats;
  }

  public update(dt: number, world: World): void {
    const input = InputManager.getInstance();
    const synth = SoundSynth.getInstance();
    const eventBus = EventBus.getInstance();

    const players = world.query(['PlayerControl', 'Transform', 'Velocity', 'Health']);
    if (players.length === 0) return;

    const playerEntity = players[0];
    const transform = playerEntity.getComponent<TransformComponent>('Transform')!;
    const velocity = playerEntity.getComponent<VelocityComponent>('Velocity')!;
    const health = playerEntity.getComponent<HealthComponent>('Health')!;

    // 1. Dash Cooldown & Execution
    if (this.playerStats.dashTimer > 0) {
      this.playerStats.dashTimer -= dt;
      if (this.playerStats.dashTimer <= 0) {
        this.playerStats.isDashing = false;
      } else {
        // Spawn dash after-image ghosts
        this.spawnDashGhost(world, transform.x, transform.y, transform.rotation);
      }
    }

    if (this.playerStats.dashCooldown > 0) {
      this.playerStats.dashCooldown -= dt;
    }

    // Dash input
    if (input.isJustPressed(InputAction.DASH) && this.playerStats.dashCooldown <= 0 && !this.playerStats.isDashing) {
      this.playerStats.isDashing = true;
      this.playerStats.dashTimer = this.playerStats.dashDuration;
      this.playerStats.dashCooldown = 1.1; // reset cooldown base
      health.invulnerableTimer = this.playerStats.dashDuration + 0.05;

      const move = input.getMovementVector();
      const dirX = move.x !== 0 || move.y !== 0 ? move.x : Math.cos(transform.rotation);
      const dirY = move.x !== 0 || move.y !== 0 ? move.y : Math.sin(transform.rotation);

      velocity.vx = dirX * this.playerStats.dashSpeed;
      velocity.vy = dirY * this.playerStats.dashSpeed;

      synth.playDash();
      eventBus.emit(GameEvents.PLAYER_DASHED);
    }

    // 2. Normal Movement
    if (!this.playerStats.isDashing) {
      const move = input.getMovementVector();
      const accel = 2400;

      if (move.x !== 0 || move.y !== 0) {
        velocity.vx += move.x * accel * dt;
        velocity.vy += move.y * accel * dt;

        // Cap speed
        const currentSpeed = Math.hypot(velocity.vx, velocity.vy);
        if (currentSpeed > this.playerStats.speed) {
          const ratio = this.playerStats.speed / currentSpeed;
          velocity.vx *= ratio;
          velocity.vy *= ratio;
        }

        // Update ship rotation towards moving direction
        transform.rotation = Math.atan2(move.y, move.x);
      }
    }

    // 3. Aiming & Primary Weapon Fire
    const facing = input.getFacingVector();
    if (facing.x !== 0 || facing.y !== 0) {
      transform.rotation = Math.atan2(facing.y, facing.x);
    }

    // Weapon firing
    this.weaponFireTimer += dt;
    const currentWeaponDef = WEAPON_REGISTRY[this.playerStats.currentWeapon];
    const fireInterval = 1 / (currentWeaponDef.fireRate * this.playerStats.attackSpeedMultiplier);

    if (input.isDown(InputAction.PRIMARY_ATTACK) && this.weaponFireTimer >= fireInterval) {
      this.weaponFireTimer = 0;
      this.fireWeapon(world, transform.x, transform.y, transform.rotation, currentWeaponDef);
    }

    // 4. Weapon Switching (Tab / Q)
    if (input.isJustPressed(InputAction.SWITCH_WEAPON)) {
      if (this.playerStats.secondaryWeapon) {
        const temp = this.playerStats.currentWeapon;
        this.playerStats.currentWeapon = this.playerStats.secondaryWeapon;
        this.playerStats.secondaryWeapon = temp;
        synth.playMenuBeep(true);
      } else {
        // Cycle available weapons
        const weapons = [
          WeaponId.PLASMA_BLASTER,
          WeaponId.KINETIC_BLADE,
          WeaponId.RAILGUN,
          WeaponId.SCATTER_CANNON,
          WeaponId.SINGULARITY_LAUNCHER
        ];
        const curIdx = weapons.indexOf(this.playerStats.currentWeapon);
        this.playerStats.currentWeapon = weapons[(curIdx + 1) % weapons.length];
        synth.playMenuBeep(true);
      }
    }

    // 5. Overdrive Activation (EMP Wave)
    if (input.isJustPressed(InputAction.OVERDRIVE) && this.playerStats.overdriveCharge >= this.playerStats.maxOverdrive) {
      this.triggerOverdrive(world, transform.x, transform.y);
    }

    // Keep player within bounds
    const halfW = this.arenaWidth / 2;
    const halfH = this.arenaHeight / 2;
    transform.x = Math.max(-halfW, Math.min(halfW, transform.x));
    transform.y = Math.max(-halfH, Math.min(halfH, transform.y));
  }

  private fireWeapon(world: World, x: number, y: number, angle: number, weapon: typeof WEAPON_REGISTRY[WeaponId]): void {
    const synth = SoundSynth.getInstance();
    const eventBus = EventBus.getInstance();

    const count = weapon.projectileCount;
    const baseAngle = angle;
    const spread = weapon.spreadAngle;
    const totalSpread = (count - 1) * spread;
    const startAngle = baseAngle - totalSpread / 2;

    const damage = Math.round(weapon.damage * this.playerStats.damageMultiplier);
    const isCrit = Math.random() < this.playerStats.critChance;
    const finalDamage = isCrit ? Math.round(damage * (1 + this.playerStats.critDamage)) : damage;

    for (let i = 0; i < count; i++) {
      const projAngle = count === 1 ? baseAngle : startAngle + i * spread;
      const vx = Math.cos(projAngle) * weapon.projectileSpeed * this.playerStats.projectileSpeedMultiplier;
      const vy = Math.sin(projAngle) * weapon.projectileSpeed * this.playerStats.projectileSpeedMultiplier;

      const proj = world.createEntity();
      proj.addComponent(new TransformComponent(x + Math.cos(projAngle) * 20, y + Math.sin(projAngle) * 20, projAngle))
          .addComponent(new VelocityComponent(vx, vy, 1.0, 2000))
          .addComponent(new ColliderComponent(weapon.projectileRadius, true, 'player_projectile'))
          .addComponent(new ProjectileComponent(finalDamage, 'player', weapon.pierce, weapon.knockback, isCrit))
          .addComponent(new RenderComponent(EntityType.PROJECTILE, weapon.color, weapon.glowColor, weapon.projectileRadius, weapon.soundType === 'blade' ? 'slash' : 'bullet'))
          .addComponent(new LifetimeComponent(weapon.soundType === 'blade' ? 0.22 : 1.8));
    }

    if (weapon.soundType === 'blade') {
      synth.playBladeSlash();
    } else {
      synth.playLaser(isCrit ? 950 : 750);
    }

    // Small recoil shake on crits
    if (isCrit) {
      eventBus.emit(GameEvents.SCREEN_SHAKE, 4);
    }
  }

  private triggerOverdrive(world: World, x: number, y: number): void {
    const synth = SoundSynth.getInstance();
    const eventBus = EventBus.getInstance();

    this.playerStats.overdriveCharge = 0;
    this.playerStats.isOverdriveActive = true;
    this.playerStats.overdriveTimer = 5.0; // 5 seconds of empowered state

    synth.playOverdrive();
    eventBus.emit(GameEvents.SCREEN_SHAKE, 14);

    // Spawn massive EMP Shockwave entity that destroys enemy bullets and damages all nearby enemies
    const shockwave = world.createEntity();
    shockwave.addComponent(new TransformComponent(x, y, 0))
             .addComponent(new VelocityComponent(0, 0, 1.0))
             .addComponent(new ColliderComponent(350, true, 'player_projectile'))
             .addComponent(new ProjectileComponent(180, 'player', 999, 300, true))
             .addComponent(new RenderComponent(EntityType.SHOCKWAVE, '#00ffff', '#0099ff', 350, 'circle', 0, 0.9))
             .addComponent(new LifetimeComponent(0.45));

    // Clear all enemy projectiles in radius
    const projectiles = world.query(['Projectile', 'Transform']);
    for (const p of projectiles) {
      const comp = p.getComponent<ProjectileComponent>('Projectile')!;
      if (comp.source === 'enemy') {
        p.destroy();
      }
    }
  }

  private spawnDashGhost(world: World, x: number, y: number, rotation: number): void {
    const ghost = world.createEntity();
    ghost.addComponent(new TransformComponent(x, y, rotation))
         .addComponent(new RenderComponent(EntityType.PARTICLE, '#00ffff', '#00f3ff', 16, 'polygon', 3, 0.45))
         .addComponent(new ParticleComponent(3.5, 8.0, true))
         .addComponent(new LifetimeComponent(0.18));
  }
}
