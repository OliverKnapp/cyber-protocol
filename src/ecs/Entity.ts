// ECS Entity & Component Container

import { Component } from './Component';

export type EntityId = number;

export class Entity {
  public id: EntityId;
  public alive: boolean = true;
  private components: Map<string, Component> = new Map();

  constructor(id: EntityId) {
    this.id = id;
  }

  public addComponent<T extends Component>(component: T): this {
    this.components.set(component._type, component);
    return this;
  }

  public getComponent<T extends Component>(componentType: string): T | undefined {
    return this.components.get(componentType) as T | undefined;
  }

  public hasComponent(componentType: string): boolean {
    return this.components.has(componentType);
  }

  public hasComponents(componentTypes: string[]): boolean {
    return componentTypes.every(type => this.components.has(type));
  }

  public removeComponent(componentType: string): this {
    this.components.delete(componentType);
    return this;
  }

  public destroy(): void {
    this.alive = false;
  }
}
