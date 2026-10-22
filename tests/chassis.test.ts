import { describe, it, expect } from 'vitest';
import { CHASSIS_REGISTRY } from '../src/content/Chassis';
import { ChassisId, WeaponId } from '../src/types';

describe('Chassis Blueprints & Specializations', () => {
  it('should have 4 distinct balanced chassis registered', () => {
    const chassisKeys = Object.keys(CHASSIS_REGISTRY);
    expect(chassisKeys.length).toBe(4);
    expect(chassisKeys).toContain(ChassisId.VANGUARD_ASSAULT);
    expect(chassisKeys).toContain(ChassisId.RONIN_STRIKER);
    expect(chassisKeys).toContain(ChassisId.PHANTOM_SPECTRE);
    expect(chassisKeys).toContain(ChassisId.JUGGERNAUT_COLOSSUS);
  });

  it('Ronin Striker should have fastest dash and melee blade', () => {
    const ronin = CHASSIS_REGISTRY[ChassisId.RONIN_STRIKER];
    expect(ronin.baseWeapon).toBe(WeaponId.KINETIC_BLADE);
    expect(ronin.dashCooldown).toBeLessThan(1.0);
    expect(ronin.dashSpeed).toBeGreaterThan(900);
  });

  it('Juggernaut Colossus should have heaviest armor and high HP', () => {
    const jugg = CHASSIS_REGISTRY[ChassisId.JUGGERNAUT_COLOSSUS];
    expect(jugg.baseWeapon).toBe(WeaponId.SCATTER_CANNON);
    expect(jugg.baseHp).toBeGreaterThanOrEqual(150);
    expect(jugg.armor).toBeGreaterThanOrEqual(5);
  });
});
