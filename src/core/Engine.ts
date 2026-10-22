// Core Game Engine & State Orchestrator

import { GameState, PlayerStats, RunStats, EntityType, Perk, ChassisId } from '../types';
import { World } from '../ecs/World';
import { Camera } from './Camera';
import { InputManager, InputAction } from './InputManager';
import { EventBus, GameEvents } from './EventBus';
import { SoundSynth } from '../audio/SoundSynth';
import { SaveManager } from '../storage/SaveManager';
import { getRandomPerks } from '../content/Perks';
import { CHASSIS_REGISTRY } from '../content/Chassis';

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
import { WorkshopOverlay } from '../ui/WorkshopOverlay';
import { SettingsOverlay } from '../ui/SettingsOverlay';

export class Engine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private camera: Camera;
  private world: World;
  private state: GameState = GameState.TITLE;

  // Run State & Stats
  private currentChassis: ChassisId = ChassisId.VANGUARD_ASSAULT;
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
  private workshopOverlay!: WorkshopOverlay;
  private settingsOverlay!: SettingsOverlay;

  // Timing
  private lastTime: number = 0;
  private isRunning: boolean = false;

  constructor(canvas: HTMLCanvasElement, uiContainer: HTMLElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.camera = new Camera(canvas.width, canvas.height);
    this.world = new World();

    this.playerStats = this.createInitialPlayerStats(this.currentChassis);
    this.runStats = this.createInitialRunStats();

    this.initUI(uiContainer);
    this.initSystems();
    this.initEventListeners();
    this.resize();

    window.addEventListener('resize', () => this.resize());
  }

  private createInitialPlayerStats(chassisId: ChassisId): PlayerStats {
    const save = SaveManager.getInstance();
    const up = save.getData().permanentUpgrades;
    const c = CHASSIS_REGISTRY[chassisId];

    const baseHp = c.baseHp + up.maxHpLevel * 12;
    const baseDamage = 1.0 + up.damageLevel * 0.05;
    const baseSpeed = c.baseSpeed * (1 + up.speedLevel * 0.04);
    const baseDashSpeed = c.dashSpeed * (1 + up.speedLevel * 0.05);
    const baseMagnet = 180 + up.magnetLevel * 25;
    const startingOverdrive = Math.min(100, up.startingCoresLevel * 15);

    return {
      maxHp: baseHp,
      hp: baseHp,
      speed: baseSpeed,
      dashSpeed: baseDashSpeed,
      dashCooldown: 0,
      dashDuration: chassisId === ChassisId.RONIN_STRIKER ? 0.22 : 0.18,
      dashTimer: 0,
      isDashing: false,
      damageMultiplier: baseDamage,
      attackSpeedMultiplier: chassisId === ChassisId.VANGUARD_ASSAULT ? 1.10 : 1.0,
      projectileSpeedMultiplier: chassisId === ChassisId.VANGUARD_ASSAULT ? 1.15 : 1.0,
      critChance: c.critChance,
      critDamage: chassisId === ChassisId.PHANTOM_SPECTRE ? 0.85 : 0.50,
      pickupRadius: baseMagnet,
      armor: c.armor,
      xpMultiplier: 1.0,
      currentWeapon: c.baseWeapon,
      overdriveCharge: startingOverdrive,
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
      (selectedChassis) => this.startRun(selectedChassis),
      () => this.openCodex(),
      () => this.openWorkshop()
    );

    this.upgradeOverlay = new UpgradeOverlay(uiContainer);

    this.pauseOverlay = new PauseOverlay(
      uiContainer,
      () => this.resumeGame(),
      () => this.openSettings(),
      () => this.openCodex(),
      () => this.restartRun(),
      () => this.returnToTitle()
    );

    this.settingsOverlay = new SettingsOverlay(uiContainer, () => {
      this.state = GameState.PAUSED;
      this.pauseOverlay.show();
    });

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

    this.workshopOverlay = new WorkshopOverlay(uiContainer, () => {
      this.state = GameState.TITLE;
      this.titleScreen.show();
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

    if (input.isJustPressed(InputAction.OPEN_CODEX) && this.state !== GameState.LEVEL_UP && this.state !== GameState.WORKSHOP) {
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
        this.renderSystem.update(0, this.world);
        break;

      case GameState.PAUSED:
        this.pauseOverlay.handleInput();
        this.renderSystem.update(0, this.world);
        break;

      case GameState.GAME_OVER:
        this.gameOverOverlay.handleInput();
        this.renderSystem.update(0, this.world);
        break;

      case GameState.CODEX:
        this.codexOverlay.handleInput();
        break;

      case GameState.WORKSHOP:
        this.workshopOverlay.handleInput();
        break;

      case GameState.SETTINGS:
        this.settingsOverlay.handleInput();
        break;
    }

    // Flush single-frame input flags at end of frame
    input.update();

    requestAnimationFrame((t) => this.loop(t));
  }

  public startRun(chassisId: ChassisId): void {
    this.currentChassis = chassisId;
    this.world.clear();
    this.activePerks.clear();

    const cDef = CHASSIS_REGISTRY[chassisId];
    this.playerStats = this.createInitialPlayerStats(chassisId);
    this.runStats = this.createInitialRunStats();
    this.spawnSystem.reset();

    // Spawn Player Entity at (0, 0)
    const pts = chassisId === ChassisId.JUGGERNAUT_COLOSSUS ? 6 : chassisId === ChassisId.PHANTOM_SPECTRE ? 4 : 3;
    const rad = chassisId === ChassisId.JUGGERNAUT_COLOSSUS ? 20 : 16;

    const player = this.world.createEntity();
    player.addComponent(new TransformComponent(0, 0, -Math.PI / 2))
          .addComponent(new VelocityComponent(0, 0, 0.90, this.playerStats.speed))
          .addComponent(new ColliderComponent(14, false, 'player'))
          .addComponent(new HealthComponent(this.playerStats.maxHp, this.playerStats.maxHp))
          .addComponent(new PlayerControlComponent())
          .addComponent(new RenderComponent(EntityType.PLAYER, cDef.color, cDef.glowColor, rad, 'polygon', pts));

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
    this.startRun(this.currentChassis);
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

  private openWorkshop(): void {
    this.state = GameState.WORKSHOP;
    this.titleScreen.hide();
    this.workshopOverlay.show();
  }

  private openSettings(): void {
    this.state = GameState.SETTINGS;
    this.pauseOverlay.hide();
    this.settingsOverlay.show();
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
