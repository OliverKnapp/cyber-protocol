import { describe, it, expect } from 'vitest';
import { SaveManager } from '../src/storage/SaveManager';

describe('SaveManager and Meta-Progression Workshop', () => {
  it('should initialize with default meta-progression values', () => {
    const save = SaveManager.getInstance();
    const data = save.getData();

    expect(data.highScore).toBeGreaterThanOrEqual(0);
    expect(data.totalCyberCores).toBeGreaterThanOrEqual(0);
    expect(data.permanentUpgrades).toBeDefined();
    expect(data.permanentUpgrades.maxHpLevel).toBeGreaterThanOrEqual(0);
  });

  it('should calculate data cores correctly on recording runs', () => {
    const save = SaveManager.getInstance();
    const beforeCores = save.getData().totalCyberCores;

    save.recordRun(1500, 3, 25);
    const afterCores = save.getData().totalCyberCores;

    // 1500 / 150 = 10, plus wave 3 * 5 = 15 => +25 cores
    expect(afterCores).toBe(beforeCores + 25);
    expect(save.getData().highestWave).toBeGreaterThanOrEqual(3);
  });
});
