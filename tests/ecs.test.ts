import { describe, it, expect } from 'vitest';
import { World } from '../src/ecs/World';
import { TransformComponent, VelocityComponent, HealthComponent, ColliderComponent } from '../src/ecs/Component';
import { EventBus, GameEvents } from '../src/core/EventBus';

describe('ECS World and Components', () => {
  it('should create entities and query components correctly', () => {
    const world = new World();
    const entity = world.createEntity();

    entity.addComponent(new TransformComponent(100, 200))
          .addComponent(new VelocityComponent(50, -50))
          .addComponent(new HealthComponent(100, 100));

    expect(entity.hasComponent('Transform')).toBe(true);
    expect(entity.hasComponent('Velocity')).toBe(true);
    expect(entity.hasComponent('Health')).toBe(true);
    expect(entity.hasComponent('NonExistent')).toBe(false);

    const queryResult = world.query(['Transform', 'Velocity']);
    expect(queryResult.length).toBe(1);
    expect(queryResult[0].id).toBe(entity.id);
  });

  it('should query potential colliders from spatial grid', () => {
    const world = new World();
    const e1 = world.createEntity();
    e1.addComponent(new TransformComponent(100, 100))
      .addComponent(new ColliderComponent(16));

    const e2 = world.createEntity();
    e2.addComponent(new TransformComponent(1000, 1000))
      .addComponent(new ColliderComponent(16));

    // Force update to rebuild spatial grid
    world.update(0.016);

    const nearE1 = world.getPotentialColliders(105, 105, 20);
    expect(nearE1.some(e => e.id === e1.id)).toBe(true);
    expect(nearE1.some(e => e.id === e2.id)).toBe(false);
  });
});

describe('EventBus', () => {
  it('should emit and receive events', () => {
    const bus = EventBus.getInstance();
    let receivedPayload: any = null;

    const unbind = bus.on(GameEvents.SCREEN_SHAKE, (payload) => {
      receivedPayload = payload;
    });

    bus.emit(GameEvents.SCREEN_SHAKE, 15);
    expect(receivedPayload).toBe(15);

    unbind();
    bus.emit(GameEvents.SCREEN_SHAKE, 30);
    expect(receivedPayload).toBe(15); // should remain unchanged after unbind
  });
});
