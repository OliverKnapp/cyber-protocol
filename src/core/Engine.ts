// Core Game Engine & State Orchestrator

import { GameState, PlayerStats, RunStats, WeaponId, EntityType, Perk } from '../types';
import { World } from '../ecs/World';
import { Camera } from './Camera';
import { InputManager, InputAction } from './InputManager';
import { EventBus, GameEvents } from './EventBus';
import { SoundSynth } from '../audio/SoundSynth';
import { MusicTracker } from '../audio/MusicTracker';
import { SaveManager } from '../storage/SaveManager';
import { getRandomPerks } from '../content/Perks';

// ECS Components
import { TransformComponent, VelocityComponent, HealthComponent, ColliderComponent, RenderComponent, PlayerControlComponent } from '../ecs/Component';

// ECS Systems
import { InputSystem } from '../ecs/systems/InputSystem';
import { MovementSystem } from '../ecs/systems/MovementSystem';
import { AISystem } from '../ecs/systems/AISystem';
import { CollisionSystem } from '../ecs/systems/CollisionSystem';
import { CombatSystem } from '../ecs/systems/CombatSystem';
import { ParticleSystem } from '../ecs/systems/ParticleSystem';
import { RenderSystem } from '../ecs/systems/RenderSystem';
import { SpawnSystem } from '../ecs/systems/SpawnSystem';

// UI
import { HUD } from '../ui/HUD';
import { TitleMainframe } from '../ui/TitleMainframe';
import { UpgradeOverlay } from '../ui/UpgradeOverlay';
import { PauseOverlay } from '../ui/PauseOverlay';
import { GameOverOverlay } from '../ui/GameOverOverlay';
import { CodexOverlay } from '../ui/CodexOverlay';

export class Engine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private camera: Camera;
  private world: World;
  private state: GameState = GameState.TITLE;

  // Run State & Stats
  private playerStats: PlayerStats;
  private runStats: RunStats;
  private activePerks: Map<string, Perk> = new Map();

  // Systems
  private renderSystem!: RenderSystem;
  private spawnSystem!: SpawnSystem;

  // UI Components
  private hud!: HUD;
  private titleScreen!: TitleMainframe;
  private upgradeOverlay!: UpgradeOverlay;
  private pauseOverlay!: PauseOverlay;
  private gameOverOverlay!: GameOverOverlay;
  private codexOverlay!: CodexOverlay;

  // Timing
  private lastTime: number = 0;
  private isRunning: boolean = false;

  constructor(canvas: HTMLCanvasElement, uiContainer: HTMLElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.camera = new Camera(canvas.width, canvas.height);
    this.world = new World();

    this.playerStats = this.createInitialPlayerStats(WeaponId.PLASMA_BLASTER);
    this.runStats = this.createInitialRunStats();

    this.initUI(uiContainer);
    this.initSystems();
    this.initEventListeners();
    this.resize();

    window.addEventListener('resize', () => this.resize());
  }

  private createInitialPlayerStats(weapon: WeaponId): PlayerStats {
    const save = SaveManager.getInstance();
    const up = save.getData().permanentUpgrades;

    const baseHp = 100 + up.maxHpLevel * 10;
    const baseDamage = 1.0 + up.damageLevel * 0.05;
    const baseSpeed = 260 * (1 + up.speedLevel * 0.04);
    const baseMagnet = 180 + up.magnetLevel * 20;

    return {
      maxHp: baseHp,
      hp: baseHp,
      speed: baseSpeed,
      dashSpeed: 820,
      dashCooldown: 0,
      dashDuration: 0.18,
      dashTimer: 0,
      isDashing: false,
      damageMultiplier: baseDamage,
      attackSpeedMultiplier: 1.0,
      projectileSpeedMultiplier: 1.0,
      critChance: 0.10,
      critDamage: 0.50,
      pickupRadius: baseMagnet,
      armor: 0,
      xpMultiplier: 1.0,
      currentWeapon: weapon,
      overdriveCharge: 0,
      maxOverdrive: 100,
      isOverdriveActive: false,
      overdriveTimer: 0
    };
  }

  private createInitialRunStats(): RunStats {
    return {
      score: 0,
      enemiesKilled: 0,
      damageDealt: 0,
      timeSurvivedSeconds: 0,
      level: 1,
      currentXp: 0,
      nextLevelXp: 10,
      cyberCoresEarned: 0,
      wave: 1
    };
  }

  private initUI(uiContainer: HTMLElement): void {
    this.hud = new HUD(uiContainer);
    this.hud.hide();

    this.titleScreen = new TitleMainframe(
      uiContainer,
      (selectedWeapon) => this.startRun(selectedWeapon),
      () => this.openCodex()
    );

    this.upgradeOverlay = new UpgradeOverlay(uiContainer);

    this.pauseOverlay = new PauseOverlay(
      uiContainer,
      () => this.resumeGame(),
      () => this.openCodex(),
      () => this.restartRun(),
      () => this.returnToTitle()
    );

    this.gameOverOverlay = new GameOverOverlay(
      uiContainer,
      () => this.restartRun(),
      () => this.openCodex(),
      () => this.returnToTitle()
    );

    this.codexOverlay = new CodexOverlay(uiContainer, () => {
      // Restore previous state
      if (this.state === GameState.CODEX) {
        this.state = this.hudIsVisible() ? GameState.PAUSED : GameState.TITLE;
      }
    });
  }

  private initSystems(): void {
    this.renderSystem = new RenderSystem(this.ctx, this.camera);
    this.spawnSystem = new SpawnSystem(this.runStats);

    this.world.addSystem(new InputSystem(this.playerStats))
              .addSystem(new MovementSystem())
              .addSystem(new AISystem())
              .addSystem(new CollisionSystem(this.playerStats, this.runStats))
              .addSystem(new CombatSystem(this.runStats))
              .addSystem(new ParticleSystem())
              .addSystem(this.spawnSystem);
  }

  private initEventListeners(): void {
    const bus = EventBus.getInstance();

    bus.on(GameEvents.SCREEN_SHAKE, (intensity: number) => {
      this.camera.addShake(intensity);
    });

    bus.on(GameEvents.ENEMY_DAMAGED, ({ damage, isCrit, x, y }) => {
      const color = isCrit ? '#ffe600' : '#ffffff';
      this.renderSystem.addFloatingText(x, y, (isCrit ? 'CRIT ' : '') + damage.toString(), color, isCrit);
    });

    bus.on(GameEvents.XP_GAINED, () => {
      this.checkLevelUp();
    });

    bus.on(GameEvents.PLAYER_DIED, () => {
      this.triggerGameOver();
    });

    bus.on(GameEvents.BOSS_DEFEATED, () => {
      this.camera.addShake(30);
      SoundSynth.getInstance().playLevelUp();
    });
  }

  private resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.camera.resize(this.canvas.width, this.canvas.height);
  }

  public start(): void {
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  private loop(currentTime: number): void {
    if (!this.isRunning) return;

    let dt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Clamp dt to avoid spiral of death
    dt = Math.min(dt, 0.08);

    // Global keyboard shortcuts (Mute, Codex, Pause)
    const input = InputManager.getInstance();

    if (input.isJustPressed(InputAction.MUTE)) {
      SoundSynth.getInstance().toggleMute();
    }

    if (input.isJustPressed(InputAction.OPEN_CODEX) && this.state !== GameState.LEVEL_UP) {
      if (this.state === GameState.CODEX) {
        this.codexOverlay.hide();
        this.state = this.hudIsVisible() ? GameState.PLAYING : GameState.TITLE;
      } else {
        this.openCodex();
      }
    }

    // State routing
    switch (this.state) {
      case GameState.TITLE:
        this.titleScreen.handleInput();
        break;

      case GameState.PLAYING:
        if (input.isJustPressed(InputAction.PAUSE)) {
          this.pauseGame();
          break;
        }

        // Update run stats timer
        this.runStats.timeSurvivedSeconds += dt;

        // Update ECS World
        this.world.update(dt);

        // Update Camera
        const players = this.world.query(['PlayerControl', 'Transform']);
        if (players.length > 0) {
          const pt = players[0].getComponent<TransformComponent>('Transform')!;
          this.camera.follow(pt.x, pt.y, 0.12);
        }
        this.camera.update();

        // Update In-game HUD
        this.hud.update(this.playerStats, this.runStats);

        // Render Frame
        this.renderSystem.update(dt, this.world);
        break;

      case GameState.LEVEL_UP:
        this.upgradeOverlay.handleInput();
        // Still render current frame under overlay
        this.renderSystem.update(0, this.world);
        break;

      case GameState.PAUSED:
        this.pauseOverlay.handleInput();
        // Render current frozen frame
        this.renderSystem.update(0, this.world);
        break;

      case GameState.GAME_OVER:
        this.gameOverOverlay.handleInput();
        this.renderSystem.update(0, this.world);
        break;

      case GameState.CODEX:
        this.codexOverlay.handleInput();
        break;
    }

    // Flush single-frame input flags at end of frame
    input.update();

    requestAnimationFrame((t) => this.loop(t));
  }

  public startRun(weapon: WeaponId): void {
    this.world.clear();
    this.activePerks.clear();

    this.playerStats = this.createInitialPlayerStats(weapon);
    this.runStats = this.createInitialRunStats();
    this.spawnSystem.reset();

    // Spawn Player Entity at (0, 0)
    const player = this.world.createEntity();
    player.addComponent(new TransformComponent(0, 0, -Math.PI / 2))
          .addComponent(new VelocityComponent(0, 0, 0.90, this.playerStats.speed))
          .addComponent(new ColliderComponent(14, false, 'player'))
          .addComponent(new HealthComponent(this.playerStats.maxHp, this.playerStats.maxHp))
          .addComponent(new PlayerControlComponent())
          .addComponent(new RenderComponent(EntityType.PLAYER, '#00f3ff', '#00f3ff', 16, 'polygon', 3));

    this.camera.x = -this.canvas.width / 2;
    this.camera.y = -this.canvas.height / 2;

    this.state = GameState.PLAYING;
    this.titleScreen.hide();
    this.hud.show();
  }

  private checkLevelUp(): void {
    if (this.runStats.currentXp >= this.runStats.nextLevelXp) {
      this.runStats.currentXp -= this.runStats.nextLevelXp;
      this.runStats.level++;
      // Exponential curve for next level XP requirement
      this.runStats.nextLevelXp = Math.floor(10 * Math.pow(1.22, this.runStats.level - 1));

      // Audio sting
      SoundSynth.getInstance().playLevelUp();

      // Trigger Upgrade Overlay with 3 perks
      const perks = getRandomPerks(3, this.activePerks);
      this.state = GameState.LEVEL_UP;
      this.upgradeOverlay.show(perks, (chosen) => {
        this.applyPerk(chosen);
        this.state = GameState.PLAYING;

        // If enough XP remained to level up again, chain it!
        if (this.runStats.currentXp >= this.runStats.nextLevelXp) {
          this.checkLevelUp();
        }
      });
    }
  }

  private applyPerk(perk: Perk): void {
    const existing = this.activePerks.get(perk.id);
    if (existing) {
      existing.currentStacks++;
    } else {
      perk.currentStacks = 1;
      this.activePerks.set(perk.id, perk);
    }

    perk.apply(this.playerStats);
  }

  private pauseGame(): void {
    this.state = GameState.PAUSED;
    this.pauseOverlay.show();
  }

  private resumeGame(): void {
    this.state = GameState.PLAYING;
    this.pauseOverlay.hide();
  }

  private restartRun(): void {
    this.pauseOverlay.hide();
    this.gameOverOverlay.hide();
    this.startRun(this.playerStats.currentWeapon);
  }

  private returnToTitle(): void {
    this.pauseOverlay.hide();
    this.gameOverOverlay.hide();
    this.hud.hide();
    this.world.clear();
    this.state = GameState.TITLE;
    this.titleScreen.show();
  }

  private openCodex(): void {
    this.state = GameState.CODEX;
    this.codexOverlay.show();
  }

  private triggerGameOver(): void {
    this.state = GameState.GAME_OVER;
    SaveManager.getInstance().recordRun(
      this.runStats.score,
      this.runStats.wave,
      this.runStats.enemiesKilled
    );
    this.gameOverOverlay.show(this.runStats);
  }

  private hudIsVisible(): boolean {
    return this.state === GameState.PLAYING || this.state === GameState.PAUSED || this.state === GameState.LEVEL_UP;
  }
}
