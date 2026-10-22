// Roguelite Upgrade Deck & Synergies

import { Perk, PerkTier, PlayerStats } from '../types';

export const PERK_POOL: Omit<Perk, 'currentStacks'>[] = [
  {
    id: 'overclock_actuators',
    name: 'Overclocked Actuators',
    description: '+15% Movement Speed and +25% Dash recovery.',
    tier: PerkTier.COMMON,
    icon: '⚡',
    tags: ['mobility'],
    maxStacks: 4,
    apply: (stats: PlayerStats) => {
      stats.speed *= 1.15;
      stats.dashCooldown = Math.max(0.4, stats.dashCooldown * 0.85);
    }
  },
  {
    id: 'plasma_amplifiers',
    name: 'Hyper-Capacitor Array',
    description: '+25% All Weapon Damage.',
    tier: PerkTier.COMMON,
    icon: '💥',
    tags: ['offense'],
    maxStacks: 5,
    apply: (stats: PlayerStats) => {
      stats.damageMultiplier += 0.25;
    }
  },
  {
    id: 'rapid_cycler',
    name: 'Rapid Cycle Valve',
    description: '+20% Weapon Fire Rate.',
    tier: PerkTier.COMMON,
    icon: '🔄',
    tags: ['offense'],
    maxStacks: 4,
    apply: (stats: PlayerStats) => {
      stats.attackSpeedMultiplier += 0.20;
    }
  },
  {
    id: 'critical_subroutines',
    name: 'Precision Optics',
    description: '+12% Critical Strike Chance and +40% Critical Damage.',
    tier: PerkTier.RARE,
    icon: '🎯',
    tags: ['offense', 'crit'],
    maxStacks: 3,
    apply: (stats: PlayerStats) => {
      stats.critChance += 0.12;
      stats.critDamage += 0.40;
    }
  },
  {
    id: 'magnetic_inductor',
    name: 'Tractor Field Grid',
    description: '+80px XP Core collection radius and +15% XP gain.',
    tier: PerkTier.COMMON,
    icon: '🧲',
    tags: ['utility'],
    maxStacks: 3,
    apply: (stats: PlayerStats) => {
      stats.pickupRadius += 80;
      stats.xpMultiplier += 0.15;
    }
  },
  {
    id: 'nano_mesh_armor',
    name: 'Reinforced Carbon Lattice',
    description: '+35 Max HP and +3 Flat Damage Reduction.',
    tier: PerkTier.RARE,
    icon: '🛡️',
    tags: ['defense'],
    maxStacks: 4,
    apply: (stats: PlayerStats) => {
      stats.maxHp += 35;
      stats.hp = Math.min(stats.maxHp, stats.hp + 35);
      stats.armor += 3;
    }
  },
  {
    id: 'twin_barrel_matrix',
    name: 'Split-Emitter Matrix',
    description: '+1 additional projectile fired per volley.',
    tier: PerkTier.EPIC,
    icon: '🔱',
    tags: ['offense', 'synergy'],
    maxStacks: 2,
    apply: (stats: PlayerStats) => {
      // Handled in combat/weapon calculation
      stats.damageMultiplier *= 0.9; // slight damage compensation for balance
    }
  },
  {
    id: 'phase_warp_drive',
    name: 'Chrono-Shift Core',
    description: 'Dash grants +0.2s extra invulnerability and releases an EMP wave.',
    tier: PerkTier.EPIC,
    icon: '🌌',
    tags: ['mobility', 'utility'],
    maxStacks: 2,
    apply: (stats: PlayerStats) => {
      stats.dashDuration += 0.15;
    }
  },
  {
    id: 'singularity_protocol',
    name: 'Zero-Point Singularity',
    description: 'Overdrive charge fills 40% faster and lasts 3 seconds longer.',
    tier: PerkTier.LEGENDARY,
    icon: '🪐',
    tags: ['overdrive', 'legendary'],
    maxStacks: 1,
    apply: (stats: PlayerStats) => {
      stats.maxOverdrive *= 0.75; // fills quicker
    }
  }
];

export function getRandomPerks(count: number, activePerks: Map<string, Perk>): Perk[] {
  // Filter perks that haven't reached max stacks
  const eligible = PERK_POOL.filter(p => {
    const existing = activePerks.get(p.id);
    return !existing || existing.currentStacks < existing.maxStacks;
  });

  // Shuffle and pick
  const shuffled = [...eligible].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);

  return selected.map(p => {
    const existing = activePerks.get(p.id);
    return {
      ...p,
      currentStacks: existing ? existing.currentStacks : 0
    };
  });
}
