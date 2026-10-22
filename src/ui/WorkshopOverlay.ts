// Meta-Progression Cybernetic Workshop Overlay (100% Keyboard-Driven)

import { KeyboardMenu, MenuItem } from './KeyboardMenu';
import { SaveManager } from '../storage/SaveManager';
import { SoundSynth } from '../audio/SoundSynth';
import { InputManager, InputAction } from '../core/InputManager';

export class WorkshopOverlay {
  private container: HTMLElement;
  private menuContainer!: HTMLElement;
  private menu!: KeyboardMenu;
  private coresDisplay!: HTMLElement;
  private onCloseCallback: () => void;

  constructor(parent: HTMLElement, onClose: () => void) {
    this.onCloseCallback = onClose;

    this.container = document.createElement('div');
    this.container.id = 'workshop-overlay';
    this.container.className = 'cyber-overlay';
    this.container.style.display = 'none';
    parent.appendChild(this.container);

    this.container.innerHTML = `
      <div class="cyber-modal workshop-modal">
        <div class="modal-header">
          <div class="modal-sub">CYBERNETIC CORE FORGE</div>
          <h2 class="modal-title">CHASSIS WORKSHOP</h2>
          <div class="workshop-cores-banner">
            <span>AVAILABLE DATA CORES:</span>
            <span id="workshop-cores-count" class="gold-val">0</span>
          </div>
          <div class="modal-instruction">Press [1-5] or [ARROWS + ENTER] to forge enhancements &bull; [ESC] to return</div>
        </div>

        <div id="workshop-menu-container"></div>

        <div class="modal-footer">
          <button id="workshop-exit-btn" class="cyber-btn">[ESC / BACKSPACE] RETURN TO MAINFRAME</button>
        </div>
      </div>
    `;

    this.coresDisplay = this.container.querySelector('#workshop-cores-count')!;
    this.menuContainer = this.container.querySelector('#workshop-menu-container')!;
    this.menu = new KeyboardMenu(this.menuContainer, []);
  }

  public show(): void {
    this.container.style.display = 'flex';
    this.renderMenu();
  }

  public hide(): void {
    this.container.style.display = 'none';
  }

  public handleInput(): boolean {
    if (this.container.style.display === 'none') return false;

    const input = InputManager.getInstance();
    if (input.isJustPressed(InputAction.CANCEL)) {
      this.hide();
      this.onCloseCallback();
      return true;
    }

    return this.menu.handleInput();
  }

  private renderMenu(): void {
    const save = SaveManager.getInstance();
    const data = save.getData();
    const up = data.permanentUpgrades;

    this.coresDisplay.textContent = data.totalCyberCores.toString();

    // Upgrade costs calculation
    const hpCost = 20 * (up.maxHpLevel + 1);
    const dmgCost = 25 * (up.damageLevel + 1);
    const spdCost = 20 * (up.speedLevel + 1);
    const magCost = 15 * (up.magnetLevel + 1);
    const odCost = 35 * (up.startingCoresLevel + 1);

    const items: MenuItem[] = [
      {
        id: 'hp',
        label: `NANITE ALLOY HULL [Lvl ${up.maxHpLevel}/10]`,
        subtext: `+12 Max Vitality (Cost: ${hpCost} Cores)`,
        badge: up.maxHpLevel >= 10 ? 'MAX' : `${hpCost} CORES`,
        disabled: up.maxHpLevel >= 10 || data.totalCyberCores < hpCost,
        onSelect: () => this.buyUpgrade('maxHpLevel', hpCost)
      },
      {
        id: 'damage',
        label: `CAPACITOR OVERCLOCKED [Lvl ${up.damageLevel}/10]`,
        subtext: `+5% Weapon Output Damage (Cost: ${dmgCost} Cores)`,
        badge: up.damageLevel >= 10 ? 'MAX' : `${dmgCost} CORES`,
        disabled: up.damageLevel >= 10 || data.totalCyberCores < dmgCost,
        onSelect: () => this.buyUpgrade('damageLevel', dmgCost)
      },
      {
        id: 'speed',
        label: `ION THRUSTER ACTUATORS [Lvl ${up.speedLevel}/8]`,
        subtext: `+4% Flight Speed & +6% Dash Velocity (Cost: ${spdCost} Cores)`,
        badge: up.speedLevel >= 8 ? 'MAX' : `${spdCost} CORES`,
        disabled: up.speedLevel >= 8 || data.totalCyberCores < spdCost,
        onSelect: () => this.buyUpgrade('speedLevel', spdCost)
      },
      {
        id: 'magnet',
        label: `TRACTOR EMITTER EXPANSION [Lvl ${up.magnetLevel}/6]`,
        subtext: `+25px XP Core Pull Radius (Cost: ${magCost} Cores)`,
        badge: up.magnetLevel >= 6 ? 'MAX' : `${magCost} CORES`,
        disabled: up.magnetLevel >= 6 || data.totalCyberCores < magCost,
        onSelect: () => this.buyUpgrade('magnetLevel', magCost)
      },
      {
        id: 'overdrive',
        label: `DISCHARGE CELL PRE-CHARGER [Lvl ${up.startingCoresLevel}/5]`,
        subtext: `Start runs with +15% EMP Overdrive Charge (Cost: ${odCost} Cores)`,
        badge: up.startingCoresLevel >= 5 ? 'MAX' : `${odCost} CORES`,
        disabled: up.startingCoresLevel >= 5 || data.totalCyberCores < odCost,
        onSelect: () => this.buyUpgrade('startingCoresLevel', odCost)
      }
    ];

    this.menu.setItems(items);
  }

  private buyUpgrade(key: keyof typeof SaveManager.prototype['data']['permanentUpgrades'], cost: number): void {
    const save = SaveManager.getInstance();
    const data = save.getData();

    if (data.totalCyberCores >= cost) {
      data.totalCyberCores -= cost;
      data.permanentUpgrades[key]++;
      save.saveData();

      SoundSynth.getInstance().playLevelUp();
      this.renderMenu();
    } else {
      SoundSynth.getInstance().playHit();
    }
  }
}
