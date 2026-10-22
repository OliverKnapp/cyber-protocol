// Roguelite Level-Up Perk Selection Overlay (100% Keyboard-Driven)

import { Perk, PerkTier } from '../types';
import { KeyboardMenu, MenuItem } from './KeyboardMenu';

export class UpgradeOverlay {
  private container: HTMLElement;
  private menuContainer!: HTMLElement;
  private menu!: KeyboardMenu;
  private activePerks: Perk[] = [];
  private onSelectCallback?: (perk: Perk) => void;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'upgrade-overlay';
    this.container.className = 'cyber-overlay';
    this.container.style.display = 'none';
    parent.appendChild(this.container);

    this.initElements();
  }

  private initElements(): void {
    this.container.innerHTML = `
      <div class="cyber-modal">
        <div class="modal-header">
          <div class="modal-sub">NEURAL MATRIX UPGRADE AVAILABLE</div>
          <h2 class="modal-title">SELECT SUBSYSTEM OVERCLOCK</h2>
          <div class="modal-instruction">Use [1], [2], [3] or [ARROWS + ENTER] to integrate</div>
        </div>

        <div id="upgrade-menu-container" class="upgrade-cards-list"></div>
      </div>
    `;

    this.menuContainer = this.container.querySelector('#upgrade-menu-container')!;
    this.menu = new KeyboardMenu(this.menuContainer);
  }

  public show(perks: Perk[], onSelect: (perk: Perk) => void): void {
    this.activePerks = perks;
    this.onSelectCallback = onSelect;
    this.container.style.display = 'flex';

    const items: MenuItem[] = perks.map((p, idx) => ({
      id: p.id,
      label: `${p.icon} ${p.name}`,
      subtext: p.description,
      badge: `${p.tier} ${p.currentStacks > 0 ? `(Lvl ${p.currentStacks + 1}/${p.maxStacks})` : ''}`,
      onSelect: () => {
        this.hide();
        this.onSelectCallback?.(p);
      }
    }));

    this.menu.setItems(items, 0);
  }

  public handleInput(): boolean {
    if (this.container.style.display === 'none') return false;
    return this.menu.handleInput();
  }

  public hide(): void {
    this.container.style.display = 'none';
  }
}
