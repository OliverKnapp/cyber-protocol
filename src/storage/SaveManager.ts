// Persistent Save & Meta-Progression Storage

import { GameSettings, WeaponId } from '../types';

export interface MetaProgression {
  totalCyberCores: number;
  highScore: number;
  highestWave: number;
  totalRuns: number;
  totalKills: number;
  unlockedWeapons: WeaponId[];
  permanentUpgrades: {
    maxHpLevel: number;      // +10 HP per level
    damageLevel: number;     // +5% damage per level
    speedLevel: number;      // +4% speed per level
    magnetLevel: number;     // +20px magnet per level
    startingCoresLevel: number;
  };
}

export class SaveManager {
  private static instance: SaveManager;
  private readonly SAVE_KEY = 'cyber_protocol_save_v1';
  private readonly SETTINGS_KEY = 'cyber_protocol_settings_v1';

  private defaultData: MetaProgression = {
    totalCyberCores: 0,
    highScore: 0,
    highestWave: 1,
    totalRuns: 0,
    totalKills: 0,
    unlockedWeapons: [WeaponId.PLASMA_BLASTER, WeaponId.KINETIC_BLADE],
    permanentUpgrades: {
      maxHpLevel: 0,
      damageLevel: 0,
      speedLevel: 0,
      magnetLevel: 0,
      startingCoresLevel: 0
    }
  };

  private defaultSettings: GameSettings = {
    masterVolume: 0.8,
    sfxVolume: 0.8,
    musicVolume: 0.7,
    crtFilter: true,
    screenShake: 1.0,
    damageNumbers: true,
    showFps: false,
    colorBlindMode: 'none'
  };

  private data: MetaProgression;
  private settings: GameSettings;

  private constructor() {
    this.data = this.loadData();
    this.settings = this.loadSettings();
  }

  public static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  private memoryStorage: Map<string, string> = new Map();

  private isStorageAvailable(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined' && window.localStorage !== null;
  }

  private loadData(): MetaProgression {
    try {
      const raw = this.isStorageAvailable()
        ? window.localStorage.getItem(this.SAVE_KEY)
        : this.memoryStorage.get(this.SAVE_KEY);

      if (raw) {
        return { ...this.defaultData, ...JSON.parse(raw) };
      }
    } catch {
      // Return defaults on parse error
    }
    return { ...this.defaultData };
  }

  public saveData(): void {
    try {
      const serialized = JSON.stringify(this.data);
      if (this.isStorageAvailable()) {
        window.localStorage.setItem(this.SAVE_KEY, serialized);
      } else {
        this.memoryStorage.set(this.SAVE_KEY, serialized);
      }
    } catch {
      // Storage quota or error safe
    }
  }

  private loadSettings(): GameSettings {
    try {
      const raw = this.isStorageAvailable()
        ? window.localStorage.getItem(this.SETTINGS_KEY)
        : this.memoryStorage.get(this.SETTINGS_KEY);

      if (raw) {
        return { ...this.defaultSettings, ...JSON.parse(raw) };
      }
    } catch {
      // Defaults on error
    }
    return { ...this.defaultSettings };
  }

  public saveSettings(): void {
    try {
      const serialized = JSON.stringify(this.settings);
      if (this.isStorageAvailable()) {
        window.localStorage.setItem(this.SETTINGS_KEY, serialized);
      } else {
        this.memoryStorage.set(this.SETTINGS_KEY, serialized);
      }
    } catch {
      // Safe
    }
  }

  public getData(): MetaProgression {
    return this.data;
  }

  public getSettings(): GameSettings {
    return this.settings;
  }

  public recordRun(score: number, wave: number, kills: number): void {
    this.data.totalRuns++;
    this.data.totalKills += kills;
    const earnedCores = Math.floor(score / 150) + wave * 5;
    this.data.totalCyberCores += earnedCores;

    if (score > this.data.highScore) {
      this.data.highScore = score;
    }
    if (wave > this.data.highestWave) {
      this.data.highestWave = wave;
    }

    this.saveData();
  }

  public unlockWeapon(weapon: WeaponId): void {
    if (!this.data.unlockedWeapons.includes(weapon)) {
      this.data.unlockedWeapons.push(weapon);
      this.saveData();
    }
  }
}
