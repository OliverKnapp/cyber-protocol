// Playable Chassis / Interceptor Class Blueprints

import { ChassisDef, ChassisId, WeaponId } from '../types';

export const CHASSIS_REGISTRY: Record<ChassisId, ChassisDef> = {
  [ChassisId.VANGUARD_ASSAULT]: {
    id: ChassisId.VANGUARD_ASSAULT,
    name: 'V-01 VANGUARD',
    tagline: 'Standard Tactical Assault Interceptor',
    description: 'All-around combat superiority. Balanced thrusters, reinforced alloy hull, and rapid-fire plasma carbine.',
    baseWeapon: WeaponId.PLASMA_BLASTER,
    baseHp: 100,
    baseSpeed: 270,
    dashSpeed: 820,
    dashCooldown: 1.0,
    armor: 2,
    critChance: 0.12,
    color: '#00f3ff',
    glowColor: '#00c3ff',
    passiveName: 'Kinetic Stabilizer',
    passiveDesc: '+10% fire rate and +15% projectile velocity'
  },
  [ChassisId.RONIN_STRIKER]: {
    id: ChassisId.RONIN_STRIKER,
    name: 'RONIN-EX',
    tagline: 'High-Frequency Melee Striker',
    description: 'Lightweight agility chassis equipped with the Nano-Kinetic Blade. Closes distances instantly and deflects hostile fire.',
    baseWeapon: WeaponId.KINETIC_BLADE,
    baseHp: 85,
    baseSpeed: 310,
    dashSpeed: 960,
    dashCooldown: 0.75,
    armor: 0,
    critChance: 0.18,
    color: '#00ffaa',
    glowColor: '#00e676',
    passiveName: 'Flow State',
    passiveDesc: 'Dash cooldown is 25% faster; dashes destroy enemy projectiles'
  },
  [ChassisId.PHANTOM_SPECTRE]: {
    id: ChassisId.PHANTOM_SPECTRE,
    name: 'PHANTOM-NULL',
    tagline: 'Long-Range Rail Accelerator Platform',
    description: 'Precision assassination rig armed with the Hyper-Rail Accelerator. Destroys entire files of enemies from extreme distance.',
    baseWeapon: WeaponId.RAILGUN,
    baseHp: 75,
    baseSpeed: 250,
    dashSpeed: 800,
    dashCooldown: 1.2,
    armor: 0,
    critChance: 0.28,
    color: '#ff0077',
    glowColor: '#ff0055',
    passiveName: 'Deadly Precision',
    passiveDesc: '+16% base critical strike chance and +50% critical strike damage'
  },
  [ChassisId.JUGGERNAUT_COLOSSUS]: {
    id: ChassisId.JUGGERNAUT_COLOSSUS,
    name: 'JUGGERNAUT-MK4',
    tagline: 'Heavy Siege Breaker',
    description: 'Massive dreadnought chassis with tungsten reactive armor and the Flak Dissolver shotgun. An unstoppable point-blank menace.',
    baseWeapon: WeaponId.SCATTER_CANNON,
    baseHp: 160,
    baseSpeed: 220,
    dashSpeed: 680,
    dashCooldown: 1.35,
    armor: 6,
    critChance: 0.08,
    color: '#ffe600',
    glowColor: '#ffbb00',
    passiveName: 'Reactive Fortress',
    passiveDesc: '+60 Max HP and 6 flat armor damage reduction'
  }
};
