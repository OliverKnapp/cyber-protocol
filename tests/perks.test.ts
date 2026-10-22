import { describe, it, expect } from 'vitest';
import { getRandomPerks, PERK_POOL } from '../src/content/Perks';
import { Perk, PlayerStats, WeaponId } from '../src/types';

describe('Roguelite Perks and Synergies', () => {
  it('should draw correct number of random perks', () => {
    const activePerks = new Map<string, Perk>();
    const drawn = getRandomPerks(3, activePerks);

    expect(drawn.length).toBe(3);
    const uniqueIds = new Set(drawn.map(p => p.id));
    expect(uniqueIds.size).toBe(3);
  });

  it('should apply stat upgrades correctly', () => {
    const stats: PlayerStats = {
      maxHp: 100,
      hp: 100,
      speed: 250,
      dashSpeed: 800,
      dashCooldown: 1.0,
      dashDuration: 0.2,
      dashTimer: 0,
      isDashing: false,
      damageMultiplier: 1.0,
      attackSpeedMultiplier: 1.0,
      projectileSpeedMultiplier: 1.0,
      critChance: 0.1,
      critDamage: 0.5,
      pickupRadius: 180,
      armor: 0,
      xpMultiplier: 1.0,
      currentWeapon: WeaponId.PLASMA_BLASTER,
      overdriveCharge: 0,
      maxOverdrive: 100,
      isOverdriveActive: false,
      overdriveTimer: 0
    };

    const damagePerk = PERK_POOL.find(p => p.id === 'plasma_amplifiers');
    expect(damagePerk).toBeDefined();

    damagePerk!.apply(stats);
    expect(stats.damageMultiplier).toBe(1.25);
  });
});
