// Weapon Definitions and Projectile Spawn Logic

import { WeaponId } from '../types';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  description: string;
  damage: number;
  fireRate: number; // shots per second
  projectileSpeed: number;
  projectileCount: number;
  spreadAngle: number; // in radians
  pierce: number;
  color: string;
  glowColor: string;
  projectileRadius: number;
  knockback: number;
  soundType: 'laser' | 'blade' | 'railgun' | 'scatter';
}

export const WEAPON_REGISTRY: Record<WeaponId, WeaponDef> = {
  [WeaponId.PLASMA_BLASTER]: {
    id: WeaponId.PLASMA_BLASTER,
    name: 'Pulse Blaster MK-I',
    description: 'Rapid-fire coherent energy bolts. Balanced damage and range.',
    damage: 22,
    fireRate: 4.5,
    projectileSpeed: 700,
    projectileCount: 1,
    spreadAngle: 0.05,
    pierce: 0,
    color: '#00f3ff',
    glowColor: '#00c3ff',
    projectileRadius: 5,
    knockback: 60,
    soundType: 'laser'
  },
  [WeaponId.KINETIC_BLADE]: {
    id: WeaponId.KINETIC_BLADE,
    name: 'Nano-Kinetic Edge',
    description: 'High-frequency blade slice in an arc. Destroys bullets and cleaves enemies.',
    damage: 55,
    fireRate: 2.2,
    projectileSpeed: 350,
    projectileCount: 3,
    spreadAngle: 0.7,
    pierce: 99,
    color: '#00ffaa',
    glowColor: '#00e676',
    projectileRadius: 18,
    knockback: 160,
    soundType: 'blade'
  },
  [WeaponId.RAILGUN]: {
    id: WeaponId.RAILGUN,
    name: 'Hyper-Rail Accelerator',
    description: 'Extreme velocity beam that punches through entire lines of targets.',
    damage: 120,
    fireRate: 1.2,
    projectileSpeed: 1400,
    projectileCount: 1,
    spreadAngle: 0,
    pierce: 8,
    color: '#ff0077',
    glowColor: '#ff0055',
    projectileRadius: 7,
    knockback: 220,
    soundType: 'railgun'
  },
  [WeaponId.SCATTER_CANNON]: {
    id: WeaponId.SCATTER_CANNON,
    name: 'Flak Dissolver',
    description: 'Fires a wide spread of shrapnel shards. Devastating at point-blank range.',
    damage: 16,
    fireRate: 2.0,
    projectileSpeed: 550,
    projectileCount: 7,
    spreadAngle: 0.55,
    pierce: 1,
    color: '#ffe600',
    glowColor: '#ffbb00',
    projectileRadius: 4,
    knockback: 110,
    soundType: 'scatter'
  },
  [WeaponId.SINGULARITY_LAUNCHER]: {
    id: WeaponId.SINGULARITY_LAUNCHER,
    name: 'Vortex Disruptor',
    description: 'Launches unstable gravity spheres that pull enemies in and implode.',
    damage: 80,
    fireRate: 1.0,
    projectileSpeed: 300,
    projectileCount: 1,
    spreadAngle: 0,
    pierce: 3,
    color: '#bf00ff',
    glowColor: '#9d00ff',
    projectileRadius: 12,
    knockback: -140, // pulls towards center!
    soundType: 'laser'
  }
};
