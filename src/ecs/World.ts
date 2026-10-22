// ECS World & System Execution Pipeline with Spatial Hash Grid

import { Entity, EntityId } from './Entity';
import { TransformComponent, ColliderComponent } from './Component';

export interface System {
  update(dt: number, world: World): void;
}

export class World {
  private entities: Map<EntityId, Entity> = new Map();
  private nextEntityId: EntityId = 1;
  private systems: System[] = [];

  // Spatial Grid for rapid collision queries
  private cellSize: number = 64;
  private spatialGrid: Map<string, Entity[]> = new Map();

  public createEntity(): Entity {
    const entity = new Entity(this.nextEntityId++);
    this.entities.set(entity.id, entity);
    return entity;
  }

  public getEntity(id: EntityId): Entity | undefined {
    return this.entities.get(id);
  }

  public removeEntity(id: EntityId): void {
    const entity = this.entities.get(id);
    if (entity) {
      entity.alive = false;
      this.entities.delete(id);
    }
  }

  public query(componentTypes: string[]): Entity[] {
    const results: Entity[] = [];
    for (const entity of this.entities.values()) {
      if (entity.alive && entity.hasComponents(componentTypes)) {
        results.push(entity);
      }
    }
    return results;
  }

  public addSystem(system: System): this {
    this.systems.push(system);
    return this;
  }

  public update(dt: number): void {
    // 1. Rebuild spatial grid for active colliders
    this.rebuildSpatialGrid();

    // 2. Run all systems in registration order
    for (const system of this.systems) {
      system.update(dt, this);
    }

    // 3. Purge dead entities
    for (const [id, entity] of this.entities.entries()) {
      if (!entity.alive) {
        this.entities.delete(id);
      }
    }
  }

  private getCellKey(x: number, y: number): string {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    return `${cx},${cy}`;
  }

  private rebuildSpatialGrid(): void {
    this.spatialGrid.clear();
    const colliders = this.query(['Transform', 'Collider']);

    for (const e of colliders) {
      const t = e.getComponent<TransformComponent>('Transform')!;
      const c = e.getComponent<ColliderComponent>('Collider')!;

      const minX = Math.floor((t.x - c.radius) / this.cellSize);
      const maxX = Math.floor((t.x + c.radius) / this.cellSize);
      const minY = Math.floor((t.y - c.radius) / this.cellSize);
      const maxY = Math.floor((t.y + c.radius) / this.cellSize);

      for (let cx = minX; cx <= maxX; cx++) {
        for (let cy = minY; cy <= maxY; cy++) {
          const key = `${cx},${cy}`;
          let bucket = this.spatialGrid.get(key);
          if (!bucket) {
            bucket = [];
            this.spatialGrid.set(key, bucket);
          }
          bucket.push(e);
        }
      }
    }
  }

  public getPotentialColliders(x: number, y: number, radius: number): Entity[] {
    const minX = Math.floor((x - radius) / this.cellSize);
    const maxX = Math.floor((x + radius) / this.cellSize);
    const minY = Math.floor((y - radius) / this.cellSize);
    const maxY = Math.floor((y + radius) / this.cellSize);

    const set = new Set<Entity>();
    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        const bucket = this.spatialGrid.get(`${cx},${cy}`);
        if (bucket) {
          for (const e of bucket) {
            set.add(e);
          }
        }
      }
    }
    return Array.from(set);
  }

  public clear(): void {
    this.entities.clear();
    this.spatialGrid.clear();
  }

  public getEntityCount(): number {
    return this.entities.size;
  }
}
