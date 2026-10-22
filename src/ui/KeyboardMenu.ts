// Reusable 100% Keyboard-Driven Menu Controller

import { InputManager, InputAction } from '../core/InputManager';
import { SoundSynth } from '../audio/SoundSynth';

export interface MenuItem {
  id: string;
  label: string;
  subtext?: string;
  badge?: string;
  disabled?: boolean;
  onSelect: () => void;
}

export class KeyboardMenu {
  private items: MenuItem[] = [];
  private selectedIndex: number = 0;
  private container: HTMLElement;
  private onCancelCallback?: () => void;

  constructor(container: HTMLElement, items: MenuItem[] = [], onCancel?: () => void) {
    this.container = container;
    this.items = items;
    this.onCancelCallback = onCancel;
  }

  public setItems(items: MenuItem[], defaultIndex: number = 0): void {
    this.items = items;
    this.selectedIndex = Math.max(0, Math.min(items.length - 1, defaultIndex));
    this.render();
  }

  public handleInput(): boolean {
    const input = InputManager.getInstance();
    const synth = SoundSynth.getInstance();

    if (this.items.length === 0) return false;

    // Direct number selection (1-4)
    if (input.isJustPressed(InputAction.SELECT_1) && this.items[0]) {
      this.selectIndex(0);
      return true;
    }
    if (input.isJustPressed(InputAction.SELECT_2) && this.items[1]) {
      this.selectIndex(1);
      return true;
    }
    if (input.isJustPressed(InputAction.SELECT_3) && this.items[2]) {
      this.selectIndex(2);
      return true;
    }
    if (input.isJustPressed(InputAction.SELECT_4) && this.items[3]) {
      this.selectIndex(3);
      return true;
    }

    // Up / Down navigation
    if (input.isJustPressed(InputAction.MOVE_UP)) {
      this.navigate(-1);
      synth.playMenuBeep(false);
      return true;
    }
    if (input.isJustPressed(InputAction.MOVE_DOWN)) {
      this.navigate(1);
      synth.playMenuBeep(false);
      return true;
    }

    // Confirm
    if (input.isJustPressed(InputAction.CONFIRM)) {
      this.activateSelected();
      return true;
    }

    // Cancel / Back
    if (input.isJustPressed(InputAction.CANCEL) && this.onCancelCallback) {
      synth.playMenuBeep(false);
      this.onCancelCallback();
      return true;
    }

    return false;
  }

  private navigate(delta: number): void {
    const len = this.items.length;
    let next = (this.selectedIndex + delta + len) % len;
    // Skip disabled
    while (this.items[next]?.disabled && next !== this.selectedIndex) {
      next = (next + delta + len) % len;
    }
    this.selectedIndex = next;
    this.render();
  }

  private selectIndex(idx: number): void {
    if (idx >= 0 && idx < this.items.length && !this.items[idx].disabled) {
      this.selectedIndex = idx;
      this.render();
      this.activateSelected();
    }
  }

  private activateSelected(): void {
    const item = this.items[this.selectedIndex];
    if (item && !item.disabled) {
      SoundSynth.getInstance().playMenuBeep(true);
      item.onSelect();
    }
  }

  public render(): void {
    this.container.innerHTML = '';
    const list = document.createElement('div');
    list.className = 'cyber-menu-list';

    this.items.forEach((item, index) => {
      const isSelected = index === this.selectedIndex;
      const el = document.createElement('div');
      el.className = `cyber-menu-item ${isSelected ? 'selected' : ''} ${item.disabled ? 'disabled' : ''}`;

      el.innerHTML = `
        <div class="menu-prefix">${isSelected ? '►' : ' '} [${index + 1}]</div>
        <div class="menu-content">
          <div class="menu-title">
            ${item.label}
            ${item.badge ? `<span class="menu-badge">${item.badge}</span>` : ''}
          </div>
          ${item.subtext ? `<div class="menu-subtext">${item.subtext}</div>` : ''}
        </div>
      `;

      list.appendChild(el);
    });

    this.container.appendChild(list);
  }
}
