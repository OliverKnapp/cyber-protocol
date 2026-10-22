// Enemy Definitions and Boss Configurations

import { EnemyType } from '../types';

export interface EnemyDef {
  type: EnemyType;
  name: string;
  maxHp: number;
  speed: number;
  radius: number;
  color: string;
  glowColor: string;
  scoreValue: number;
  xpValue: number;
  attackCooldown: number;
  shape: 'circle' | 'polygon' | 'boss';
  points: number; // polygon vertices
}

export const ENEMY_REGISTRY: Record<EnemyType, EnemyDef> = {
  [EnemyType.DRONE_SWARM]: {
    type: EnemyType.DRONE_SWARM,
    name: 'V-4 Hornet Drone',
    maxHp: 28,
    speed: 155,
    radius: 12,
    color: '#ff0055',
    glowColor: '#ff0033',
    scoreValue: 100,
    xpValue: 1,
    attackCooldown: 1.5,
    shape: 'polygon',
    points: 3 // triangle
  },
  [EnemyType.CYBER_ENFORCER]: {
    type: EnemyType.CYBER_ENFORCER,
    name: 'Goliath Enforcer',
    maxHp: 110,
    speed: 85,
    radius: 20,
    color: '#ff5500',
    glowColor: '#ff3300',
    scoreValue: 250,
    xpValue: 3,
    attackCooldown: 2.2,
    shape: 'polygon',
    points: 6 // hexagon
  },
  [EnemyType.SNIPER_TURRET]: {
    type: EnemyType.SNIPER_TURRET,
    name: 'Viper Rail Sniper',
    maxHp: 65,
    speed: 60,
    radius: 15,
    color: '#bf00ff',
    glowColor: '#9d00ff',
    scoreValue: 350,
    xpValue: 4,
    attackCooldown: 3.5,
    shape: 'polygon',
    points: 4 // diamond
  },
  [EnemyType.GLITCH_PHANTOM]: {
    type: EnemyType.GLITCH_PHANTOM,
    name: 'Glitch Infiltrator',
    maxHp: 50,
    speed: 190,
    radius: 14,
    color: '#00ffaa',
    glowColor: '#00e676',
    scoreValue: 400,
    xpValue: 5,
    attackCooldown: 2.0,
    shape: 'polygon',
    points: 5 // pentagon
  },
  [EnemyType.BOSS_MECH]: {
    type: EnemyType.BOSS_MECH,
    name: 'NEXUS OVERLORD PRIME',
    maxHp: 1800,
    speed: 70,
    radius: 46,
    color: '#ff0033',
    glowColor: '#ff0077',
    scoreValue: 5000,
    xpValue: 50,
    attackCooldown: 1.8,
    shape: 'boss',
    points: 8
  }
};
