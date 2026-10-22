// Core game types & enumerations

export type Vector2D = {
  x: number;
  y: number;
};

export enum GameState {
  TITLE = 'TITLE',
  PLAYING = 'PLAYING',
  LEVEL_UP = 'LEVEL_UP',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  CODEX = 'CODEX',
  SETTINGS = 'SETTINGS',
  WORKSHOP = 'WORKSHOP',
  VICTORY = 'VICTORY'
}

export enum EntityType {
  PLAYER = 'PLAYER',
  ENEMY = 'ENEMY',
  PROJECTILE = 'PROJECTILE',
  XP_GEM = 'XP_GEM',
  PARTICLE = 'PARTICLE',
  OBSTACLE = 'OBSTACLE',
  BOSS = 'BOSS',
  SHOCKWAVE = 'SHOCKWAVE'
}

export enum EnemyType {
  DRONE_SWARM = 'DRONE_SWARM',
  CYBER_ENFORCER = 'CYBER_ENFORCER',
  SNIPER_TURRET = 'SNIPER_TURRET',
  GLITCH_PHANTOM = 'GLITCH_PHANTOM',
  BOSS_MECH = 'BOSS_MECH'
}

export enum WeaponId {
  KINETIC_BLADE = 'KINETIC_BLADE',
  PLASMA_BLASTER = 'PLASMA_BLASTER',
  RAILGUN = 'RAILGUN',
  SCATTER_CANNON = 'SCATTER_CANNON',
  SINGULARITY_LAUNCHER = 'SINGULARITY_LAUNCHER'
}

export enum ChassisId {
  VANGUARD_ASSAULT = 'VANGUARD_ASSAULT',
  RONIN_STRIKER = 'RONIN_STRIKER',
  PHANTOM_SPECTRE = 'PHANTOM_SPECTRE',
  JUGGERNAUT_COLOSSUS = 'JUGGERNAUT_COLOSSUS'
}

export interface ChassisDef {
  id: ChassisId;
  name: string;
  tagline: string;
  description: string;
  baseWeapon: WeaponId;
  baseHp: number;
  baseSpeed: number;
  dashSpeed: number;
  dashCooldown: number;
  armor: number;
  critChance: number;
  color: string;
  glowColor: string;
  passiveName: string;
  passiveDesc: string;
}

export enum PerkTier {
  COMMON = 'COMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY'
}

export interface Perk {
  id: string;
  name: string;
  description: string;
  tier: PerkTier;
  icon: string;
  tags: string[];
  maxStacks: number;
  currentStacks: number;
  apply: (stats: PlayerStats) => void;
}

export interface PlayerStats {
  maxHp: number;
  hp: number;
  speed: number;
  dashSpeed: number;
  dashCooldown: number;
  dashDuration: number;
  dashTimer: number;
  isDashing: boolean;
  damageMultiplier: number;
  attackSpeedMultiplier: number;
  projectileSpeedMultiplier: number;
  critChance: number;
  critDamage: number;
  pickupRadius: number;
  armor: number;
  xpMultiplier: number;
  currentWeapon: WeaponId;
  secondaryWeapon?: WeaponId;
  overdriveCharge: number;
  maxOverdrive: number;
  isOverdriveActive: boolean;
  overdriveTimer: number;
}

export interface RunStats {
  score: number;
  enemiesKilled: number;
  damageDealt: number;
  timeSurvivedSeconds: number;
  level: number;
  currentXp: number;
  nextLevelXp: number;
  cyberCoresEarned: number;
  wave: number;
}

export interface KeyBindingMap {
  [action: string]: string[];
}

export interface GameSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  crtFilter: boolean;
  screenShake: number; // 0 to 1
  damageNumbers: boolean;
  showFps: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
}
