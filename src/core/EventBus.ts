// Decoupled, strongly-typed Publish/Subscribe Event Bus

export type EventCallback<T = any> = (payload: T) => void;

export class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, Set<EventCallback>> = new Map();

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public on<T = any>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unbind function
    return () => this.off(event, callback);
  }

  public off<T = any>(event: string, callback: EventCallback<T>): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  public emit<T = any>(event: string, payload?: T): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach(cb => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`Error in EventBus listener for event "${event}":`, err);
        }
      });
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}

// Event constant definitions for type safety
export const GameEvents = {
  STATE_CHANGE: 'STATE_CHANGE',
  PLAYER_DAMAGED: 'PLAYER_DAMAGED',
  PLAYER_HEALED: 'PLAYER_HEALED',
  PLAYER_DIED: 'PLAYER_DIED',
  PLAYER_DASHED: 'PLAYER_DASHED',
  ENEMY_SPAWNED: 'ENEMY_SPAWNED',
  ENEMY_DAMAGED: 'ENEMY_DAMAGED',
  ENEMY_DIED: 'ENEMY_DIED',
  XP_GAINED: 'XP_GAINED',
  LEVEL_UP: 'LEVEL_UP',
  PERK_SELECTED: 'PERK_SELECTED',
  WAVE_COMPLETED: 'WAVE_COMPLETED',
  BOSS_SPAWNED: 'BOSS_SPAWNED',
  BOSS_DEFEATED: 'BOSS_DEFEATED',
  SCREEN_SHAKE: 'SCREEN_SHAKE',
  PLAY_SFX: 'PLAY_SFX',
  WEAPON_FIRED: 'WEAPON_FIRED',
  OVERDRIVE_ACTIVATED: 'OVERDRIVE_ACTIVATED'
} as const;
