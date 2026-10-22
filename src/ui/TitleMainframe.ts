// Title Screen & Loadout Mainframe (100% Keyboard-Driven)

import { KeyboardMenu, MenuItem } from './KeyboardMenu';
import { SaveManager } from '../storage/SaveManager';
import { ChassisId, WeaponId } from '../types';
import { CHASSIS_REGISTRY } from '../content/Chassis';
import { SoundSynth } from '../audio/SoundSynth';
import { MusicTracker } from '../audio/MusicTracker';

export class TitleMainframe {
  private container: HTMLElement;
  private menuContainer!: HTMLElement;
  private menu!: KeyboardMenu;
  private selectedChassis: ChassisId = ChassisId.VANGUARD_ASSAULT;
  private onStartRunCallback: (chassis: ChassisId) => void;
  private onOpenCodexCallback: () => void;
  private onOpenWorkshopCallback: () => void;

  constructor(
    parent: HTMLElement,
    onStartRun: (chassis: ChassisId) => void,
    onOpenCodex: () => void,
    onOpenWorkshop: () => void
  ) {
    this.onStartRunCallback = onStartRun;
    this.onOpenCodexCallback = onOpenCodex;
    this.onOpenWorkshopCallback = onOpenWorkshop;

    this.container = document.createElement('div');
    this.container.id = 'title-mainframe';
    this.container.className = 'cyber-title-screen';
    parent.appendChild(this.container);

    this.initScreen();
  }

  private initScreen(): void {
    const save = SaveManager.getInstance();
    const data = save.getData();
    const cDef = CHASSIS_REGISTRY[this.selectedChassis];

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

        <!-- Chassis Display Card -->
        <div class="chassis-preview-card">
          <div class="chassis-header">
            <span class="chassis-tag">SELECTED INTERCEPTOR</span>
            <span id="title-chassis-name" class="chassis-name" style="color: ${cDef.color};">${cDef.name}</span>
          </div>
          <div id="title-chassis-tagline" class="chassis-tagline">${cDef.tagline}</div>
          <div id="title-chassis-desc" class="chassis-desc">${cDef.description}</div>
          <div class="chassis-stats-row">
            <span>HP: <b id="stat-hp" style="color: var(--neon-cyan);">${cDef.baseHp}</b></span> &bull;
            <span>SPEED: <b id="stat-spd" style="color: var(--neon-green);">${cDef.baseSpeed}</b></span> &bull;
            <span>ARMOR: <b id="stat-arm" style="color: var(--neon-gold);">${cDef.armor}</b></span> &bull;
            <span>CRIT: <b id="stat-crit" style="color: var(--neon-magenta);">${Math.round(cDef.critChance * 100)}%</b></span>
          </div>
          <div class="chassis-passive">
            <span class="passive-lbl">PASSIVE:</span>
            <span id="title-passive" class="passive-val">${cDef.passiveName} &mdash; ${cDef.passiveDesc}</span>
          </div>
        </div>

        <div id="title-menu-container" class="title-menu-box"></div>

        <div class="title-footer-tips">
          <div class="tip-line">★ 100% KEYBOARD PLAYABLE &bull; ZERO MOUSE REQUIRED ★</div>
          <div class="tip-keys">[1-4] Quick Select &bull; [ARROWS + ENTER] Navigate &bull; [C] Codex &bull; [M] Audio</div>
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
        label: 'INITIATE PROTOCOL (START RUN)',
        subtext: 'Deploy selected chassis into hostile sector grid [Press 1 or Enter]',
        badge: 'READY',
        onSelect: () => {
          SoundSynth.getInstance().init();
          MusicTracker.getInstance().start();
          this.hide();
          this.onStartRunCallback(this.selectedChassis);
        }
      },
      {
        id: 'cycle_chassis',
        label: 'CYCLE INTERCEPTOR CHASSIS',
        subtext: 'Switch between Vanguard, Ronin, Phantom, and Juggernaut [Press 2]',
        onSelect: () => {
          this.cycleChassis();
        }
      },
      {
        id: 'workshop',
        label: 'CYBER CORE WORKSHOP (META-LAB)',
        subtext: 'Forge permanent chassis upgrades with extracted Data Cores [Press 3]',
        onSelect: () => {
          this.onOpenWorkshopCallback();
        }
      },
      {
        id: 'codex',
        label: 'TACTICAL CODEX & INTEL',
        subtext: 'Review hostiles, weapon specs, and controls [Press 4 or C]',
        onSelect: () => {
          this.onOpenCodexCallback();
        }
      }
    ];

    this.menu = new KeyboardMenu(this.menuContainer, items);
  }

  private cycleChassis(): void {
    const chassisList = [
      ChassisId.VANGUARD_ASSAULT,
      ChassisId.RONIN_STRIKER,
      ChassisId.PHANTOM_SPECTRE,
      ChassisId.JUGGERNAUT_COLOSSUS
    ];

    const currentIdx = chassisList.indexOf(this.selectedChassis);
    const nextIdx = (currentIdx + 1) % chassisList.length;
    this.selectedChassis = chassisList[nextIdx];

    const c = CHASSIS_REGISTRY[this.selectedChassis];

    const nameEl = this.container.querySelector('#title-chassis-name') as HTMLElement;
    const tagEl = this.container.querySelector('#title-chassis-tagline') as HTMLElement;
    const descEl = this.container.querySelector('#title-chassis-desc') as HTMLElement;
    const hpEl = this.container.querySelector('#stat-hp') as HTMLElement;
    const spdEl = this.container.querySelector('#stat-spd') as HTMLElement;
    const armEl = this.container.querySelector('#stat-arm') as HTMLElement;
    const critEl = this.container.querySelector('#stat-crit') as HTMLElement;
    const passEl = this.container.querySelector('#title-passive') as HTMLElement;

    if (nameEl) {
      nameEl.textContent = c.name;
      nameEl.style.color = c.color;
    }
    if (tagEl) tagEl.textContent = c.tagline;
    if (descEl) descEl.textContent = c.description;
    if (hpEl) hpEl.textContent = c.baseHp.toString();
    if (spdEl) spdEl.textContent = c.baseSpeed.toString();
    if (armEl) armEl.textContent = c.armor.toString();
    if (critEl) critEl.textContent = `${Math.round(c.critChance * 100)}%`;
    if (passEl) passEl.textContent = `${c.passiveName} — ${c.passiveDesc}`;

    SoundSynth.getInstance().playMenuBeep(true);
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
