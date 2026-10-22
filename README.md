# ⚡ CYBER PROTOCOL

[![CI Build & Test Pipeline](https://github.com/OliverKnapp/cyber-protocol/actions/workflows/ci.yml/badge.svg)](https://github.com/OliverKnapp/cyber-protocol/actions/workflows/ci.yml)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict%20ES2022-blue.svg)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Tests-Vitest%20Passing-brightgreen.svg)](https://vitest.dev/)
[![Zero-Mouse](https://img.shields.io/badge/Accessibility-100%25%20Keyboard%20Only-cyan.svg)]()

> **High-octane, keyboard-only roguelite action game.** Zero mouse required. Built with an Entity-Component-System (ECS) architecture, procedural Web Audio synthesis, and dynamic vector neon graphics.

---

## 🕹️ Pure Keyboard Control Cheatsheet

| Action | Primary Keys | Alternative Keys |
| :--- | :--- | :--- |
| **Omni-Directional Movement** | `W` `A` `S` `D` | `Arrow Keys` |
| **Fire Primary Armament** | `Space` (Hold to autofire) | `J` / `Enter` |
| **Cybernetic Dash (i-frames)** | `Shift` (Left or Right) | `K` / `Z` |
| **Switch Weapon Slot** | `Tab` | `Q` |
| **EMP Overdrive Shockwave** | `E` | `X` |
| **Tactical Pause & Settings** | `Escape` | `P` |
| **Tactical Codex & Intel** | `C` | (From Menu: `4`) |
| **Quick Option Selection** | `1`, `2`, `3`, `4`, `5` | `Arrows` + `Enter` |
| **Toggle Synthesizer Mute** | `M` | (From Settings) |

Gamepad controller (standard API) is automatically supported out of the box!

---

## 🚀 Key Features

- **100% Zero-Mouse Guarantee**: Every menu, inventory card, talent tree, and battle action is completely controllable via keyboard with glowing visual brackets and audio confirmation beeps.
- **Entity-Component-System (ECS)**: Decoupled data-driven architecture built for high performance and infinite scalability.
- **4 Playable Interceptor Chassis**:
  - `V-01 VANGUARD`: Balanced tactical assault interceptor with kinetic stabilizers.
  - `RONIN-EX`: High-frequency blade melee chassis with rapid flow-state dashes that deflect enemy bullets.
  - `PHANTOM-NULL`: Long-range sniper rig with hyper-rail accelerator and devastating critical strikes.
  - `JUGGERNAUT-MK4`: Heavy siege dreadnought with tungsten reactive armor and flak shotgun.
- **Procedural Web Audio Synth Engine**:
  - Zero external `.mp3` or `.wav` dependencies. 100% instantaneous loading with zero latency.
  - Generative cyberpunk synthwave soundtrack (124 BPM) with dynamic basslines, chord progressions, and arpeggios.
  - Procedurally synthesized lasers, explosions, blade swooshes, dash sub-whooshes, and chimes.
- **Deep Roguelite Progression**:
  - 30+ synergistic perks and upgrades (Overclocked Actuators, Split-Emitter Matrix, Chrono-Shift Core, Zero-Point Singularity).
  - Permanent Meta-Lab Workshop where extracted Data Cores are forged into permanent hull, damage, speed, and magnet upgrades.
- **Elite Enemy Variants**:
  - Swarm Hornets, Goliath Enforcers, Viper Snipers, Glitch Infiltrators, and Multi-Phase Boss Mechs.
  - Random Elite modifiers: `SHIELDED`, `SPEED_DEMON`, `SPLITTER`, and `VOLATILE`.
- **Cyberpunk Glassmorphic Aesthetics**:
  - Procedural vector canvas with dynamic pulsing grid, particle spark physics, floating crits, and toggleable CRT scanlines.

---

## 📐 Scalable Architecture Guide

The project is structured to remain clean, modular, and effortless to expand over long-term development:

```
src/
├── core/                  # Core runtime & lifecycle
│   ├── Engine.ts          # State orchestrator & game loop (fixed dt clamp)
│   ├── EventBus.ts        # Strongly-typed publish/subscribe event bus
│   ├── InputManager.ts    # 100% Keyboard input mapping & state tracking
│   └── Camera.ts          # Smooth lerp camera with procedural screen shake
├── ecs/                   # Entity-Component-System framework
│   ├── Entity.ts          # Unique ID & component bag
│   ├── Component.ts       # Pure data components (Transform, Velocity, Health, etc.)
│   ├── World.ts           # Spatial Hash Grid & system pipeline
│   └── systems/           # Specialized decoupled systems
│       ├── InputSystem.ts      # Keyboard intent to physics & firing
│       ├── MovementSystem.ts   # Velocity integration & damping
│       ├── AISystem.ts         # Enemy & boss state machines
│       ├── CollisionSystem.ts  # Rapid spatial query resolution
│       ├── CombatSystem.ts     # Deaths, XP drops, scoring, and elite effects
│       ├── ParticleSystem.ts   # Alpha decay & particle physics
│       ├── RenderSystem.ts     # Procedural vector canvas graphics
│       └── SpawnSystem.ts      # Wave escalations & boss encounters
├── content/               # Mod-friendly data registries
│   ├── Weapons.ts         # Weapon stats, speeds, angles, and damage
│   ├── Chassis.ts         # Interceptor class definitions & passives
│   ├── Perks.ts           # Roguelite upgrade deck & synergy functions
│   └── Enemies.ts         # Enemy stats, shapes, and attack patterns
├── audio/                 # Procedural Web Audio synthesis
│   ├── SoundSynth.ts      # Real-time oscillator & noise buffer SFX
│   └── MusicTracker.ts    # 16th-note generative synthwave engine
├── storage/               # Persistence layer
│   └── SaveManager.ts     # LocalStorage & memory-safe meta-progression
├── ui/                    # 100% Keyboard-driven UI overlays
│   ├── KeyboardMenu.ts    # Reusable arrow/number selectable menu controller
│   ├── HUD.ts             # Cyber vitality, XP, overdrive, and weapon stats
│   ├── TitleMainframe.ts  # Title screen & loadout selector
│   ├── UpgradeOverlay.ts  # Roguelite card perk picker
│   ├── WorkshopOverlay.ts # Meta-lab core enhancement forge
│   ├── PauseOverlay.ts    # Tactical pause & configuration
│   ├── SettingsOverlay.ts # Audio & visual shader calibration
│   ├── CodexOverlay.ts    # Database intel & keyboard guide
│   └── GameOverOverlay.ts # Run recap & score extraction
└── types/                 # Shared TypeScript interfaces & enums
```

### Adding New Content

- **Adding a Weapon**: Add 1 typed entry to `WEAPON_REGISTRY` in `src/content/Weapons.ts`.
- **Adding a Chassis**: Add 1 typed entry to `CHASSIS_REGISTRY` in `src/content/Chassis.ts`.
- **Adding a Perk**: Add 1 entry to `PERK_POOL` in `src/content/Perks.ts` with its `apply(stats)` closure.
- **Adding an Enemy**: Add 1 entry to `ENEMY_REGISTRY` in `src/content/Enemies.ts` and handle its behavior in `AISystem.ts`.

---

## 🛠️ Development & Testing

```bash
# Install dependencies
npm install

# Start local dev server (http://localhost:3000)
npm run dev

# Run automated Vitest test suite
npm run test

# Build production bundle with TypeScript strict verification
npm run build

# Preview production build
npm run preview
```

---

## 📜 License

MIT &bull; Created and maintained by [Oliver Knapp](https://github.com/OliverKnapp).
