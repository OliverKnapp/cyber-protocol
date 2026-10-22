// Title Screen & Loadout Mainframe (100% Keyboard-Driven)

import { KeyboardMenu, MenuItem } from './KeyboardMenu';
import { SaveManager } from '../storage/SaveManager';
import { WeaponId } from '../types';
import { WEAPON_REGISTRY } from '../content/Weapons';
import { SoundSynth } from '../audio/SoundSynth';
import { MusicTracker } from '../audio/MusicTracker';

export class TitleMainframe {
  private container: HTMLElement;
  private menuContainer!: HTMLElement;
  private menu!: KeyboardMenu;
  private selectedWeapon: WeaponId = WeaponId.PLASMA_BLASTER;
  private onStartRunCallback: (weapon: WeaponId) => void;
  private onOpenCodexCallback: () => void;

  constructor(
    parent: HTMLElement,
    onStartRun: (weapon: WeaponId) => void,
    onOpenCodex: () => void
  ) {
    this.onStartRunCallback = onStartRun;
    this.onOpenCodexCallback = onOpenCodex;

    this.container = document.createElement('div');
    this.container.id = 'title-mainframe';
    this.container.className = 'cyber-title-screen';
    parent.appendChild(this.container);

    this.initScreen();
  }

  private initScreen(): void {
    const save = SaveManager.getInstance();
    const data = save.getData();

    this.container.innerHTML = `
      <div class="title-content-wrapper">
        <div class="title-logo-box">
          <div class="title-prefix">&gt; SYSTEM STATUS: READY &bull; PROTOCOL 2026.11</div>
          <h1 class="main-title glitch-text" data-text="CYBER PROTOCOL">CYBER PROTOCOL</h1>
          <div class="title-subtitle">KEYBOARD-ONLY ROGUELITE INTERCEPTOR</div>
        </div>

        <div class="title-meta-stats">
          <div class="meta-pill">
            <span class="pill-label">HIGH SCORE:</span>
            <span class="pill-val cyan" id="title-high-score">${data.highScore.toLocaleString()}</span>
          </div>
          <div class="meta-pill">
            <span class="pill-label">HIGHEST WAVE:</span>
            <span class="pill-val green" id="title-high-wave">${data.highestWave}</span>
          </div>
          <div class="meta-pill">
            <span class="pill-label">DATA CORES:</span>
            <span class="pill-val gold" id="title-cores">${data.totalCyberCores}</span>
          </div>
        </div>

        <div class="loadout-display">
          <span class="loadout-label">ACTIVE ARMAMENT:</span>
          <span id="title-weapon-display" class="loadout-val">[PULSE BLASTER MK-I]</span>
          <span class="loadout-hint">(Press 2 to cycle loadout)</span>
        </div>

        <div id="title-menu-container" class="title-menu-box"></div>

        <div class="title-footer-tips">
          <div class="tip-line">★ 100% KEYBOARD PLAYABLE &bull; NO MOUSE REQUIRED ★</div>
          <div class="tip-keys">[ARROWS / 1-4] Navigate &bull; [ENTER / SPACE] Select &bull; [C] Codex</div>
        </div>
      </div>
    `;

    this.menuContainer = this.container.querySelector('#title-menu-container')!;
    this.setupMenu();
  }

  private setupMenu(): void {
    const items: MenuItem[] = [
      {
        id: 'start',
        label: 'INITIATE PROTOCOL (START)',
        subtext: 'Deploy interceptor into hostile sector grid',
        badge: 'READY',
        onSelect: () => {
          // Start procedural music tracker on user interaction!
          SoundSynth.getInstance().init();
          MusicTracker.getInstance().start();
          this.hide();
          this.onStartRunCallback(this.selectedWeapon);
        }
      },
      {
        id: 'cycle_weapon',
        label: 'CYCLE WEAPON LOADOUT',
        subtext: 'Switch primary armament blueprint',
        onSelect: () => {
          this.cycleWeapon();
        }
      },
      {
        id: 'codex',
        label: 'TACTICAL CODEX & INTEL',
        subtext: 'Enemy weaknesses, controls, and weapon blueprints',
        onSelect: () => {
          this.onOpenCodexCallback();
        }
      },
      {
        id: 'toggle_audio',
        label: 'AUDIO ENGINE (SOUND / SYNTH)',
        subtext: 'Toggle master synthesizer output',
        onSelect: () => {
          SoundSynth.getInstance().init();
          const isMuted = SoundSynth.getInstance().toggleMute();
          const badge = isMuted ? 'MUTED' : 'ACTIVE';
          this.menu.setItems(this.getMenuItems(badge), 3);
        }
      }
    ];

    this.menu = new KeyboardMenu(this.menuContainer, items);
  }

  private getMenuItems(audioBadge: string = 'ACTIVE'): MenuItem[] {
    return [
      {
        id: 'start',
        label: 'INITIATE PROTOCOL (START)',
        subtext: 'Deploy interceptor into hostile sector grid',
        badge: 'READY',
        onSelect: () => {
          SoundSynth.getInstance().init();
          MusicTracker.getInstance().start();
          this.hide();
          this.onStartRunCallback(this.selectedWeapon);
        }
      },
      {
        id: 'cycle_weapon',
        label: 'CYCLE WEAPON LOADOUT',
        subtext: 'Switch primary armament blueprint',
        onSelect: () => {
          this.cycleWeapon();
        }
      },
      {
        id: 'codex',
        label: 'TACTICAL CODEX & INTEL',
        subtext: 'Enemy weaknesses, controls, and weapon blueprints',
        onSelect: () => {
          this.onOpenCodexCallback();
        }
      },
      {
        id: 'toggle_audio',
        label: 'AUDIO ENGINE (SOUND / SYNTH)',
        subtext: 'Toggle master synthesizer output',
        badge: audioBadge,
        onSelect: () => {
          SoundSynth.getInstance().init();
          const isMuted = SoundSynth.getInstance().toggleMute();
          this.menu.setItems(this.getMenuItems(isMuted ? 'MUTED' : 'ACTIVE'), 3);
        }
      }
    ];
  }

  private cycleWeapon(): void {
    const weapons = [
      WeaponId.PLASMA_BLASTER,
      WeaponId.KINETIC_BLADE,
      WeaponId.RAILGUN,
      WeaponId.SCATTER_CANNON,
      WeaponId.SINGULARITY_LAUNCHER
    ];

    const currentIdx = weapons.indexOf(this.selectedWeapon);
    const nextIdx = (currentIdx + 1) % weapons.length;
    this.selectedWeapon = weapons[nextIdx];

    const wDef = WEAPON_REGISTRY[this.selectedWeapon];
    const display = this.container.querySelector('#title-weapon-display');
    if (display) {
      display.textContent = `[${wDef.name.toUpperCase()}]`;
    }
  }

  public show(): void {
    this.container.style.display = 'flex';
    const save = SaveManager.getInstance();
    const data = save.getData();

    const hs = this.container.querySelector('#title-high-score');
    if (hs) hs.textContent = data.highScore.toLocaleString();

    const hw = this.container.querySelector('#title-high-wave');
    if (hw) hw.textContent = data.highestWave.toString();

    const tc = this.container.querySelector('#title-cores');
    if (tc) tc.textContent = data.totalCyberCores.toString();

    this.menu.render();
  }

  public hide(): void {
    this.container.style.display = 'none';
  }

  public handleInput(): boolean {
    if (this.container.style.display === 'none') return false;
    return this.menu.handleInput();
  }
}
