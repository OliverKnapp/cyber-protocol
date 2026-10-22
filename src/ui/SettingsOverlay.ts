// Tactical Settings & Keybinding Configurator (100% Keyboard-Driven)

import { KeyboardMenu, MenuItem } from './KeyboardMenu';
import { SaveManager } from '../storage/SaveManager';
import { SoundSynth } from '../audio/SoundSynth';
import { InputManager, InputAction } from '../core/InputManager';

export class SettingsOverlay {
  private container: HTMLElement;
  private menuContainer!: HTMLElement;
  private menu!: KeyboardMenu;
  private onCloseCallback: () => void;

  constructor(parent: HTMLElement, onClose: () => void) {
    this.onCloseCallback = onClose;

    this.container = document.createElement('div');
    this.container.id = 'settings-overlay';
    this.container.className = 'cyber-overlay';
    this.container.style.display = 'none';
    parent.appendChild(this.container);

    this.container.innerHTML = `
      <div class="cyber-modal settings-modal">
        <div class="modal-header">
          <div class="modal-sub">TACTICAL CALIBRATION</div>
          <h2 class="modal-title">SYSTEM CONFIGURATION</h2>
          <div class="modal-instruction">Press [1-5] or [ARROWS + ENTER] to toggle/calibrate &bull; [ESC] to apply & exit</div>
        </div>

        <div id="settings-menu-container"></div>

        <div class="modal-footer">
          <button id="settings-save-btn" class="cyber-btn">[ESC / ENTER] APPLY CONFIGURATION</button>
        </div>
      </div>
    `;

    this.menuContainer = this.container.querySelector('#settings-menu-container')!;
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
    const settings = save.getSettings();

    const items: MenuItem[] = [
      {
        id: 'master_volume',
        label: `MASTER AUDIO VOLUME`,
        subtext: `Cycle volume levels [Current: ${Math.round(settings.masterVolume * 100)}%]`,
        badge: `${Math.round(settings.masterVolume * 100)}%`,
        onSelect: () => {
          settings.masterVolume = (settings.masterVolume + 0.25) > 1.05 ? 0 : settings.masterVolume + 0.25;
          save.saveSettings();
          SoundSynth.getInstance().setVolume(settings.masterVolume);
          this.renderMenu();
        }
      },
      {
        id: 'crt_filter',
        label: `CRT RETRO SCANLINES & VIGNETTE`,
        subtext: `Toggle retro cathode-ray tube shader scanline overlay`,
        badge: settings.crtFilter ? 'ENABLED' : 'DISABLED',
        onSelect: () => {
          settings.crtFilter = !settings.crtFilter;
          save.saveSettings();
          const crtEl = document.getElementById('crt-scanline-layer');
          if (crtEl) {
            crtEl.style.display = settings.crtFilter ? 'block' : 'none';
          }
          this.renderMenu();
        }
      },
      {
        id: 'screen_shake',
        label: `HAPTIC SCREEN SHAKE INTENSITY`,
        subtext: `Adjust camera rumble on explosions, crits, and heavy weapon discharges`,
        badge: `${Math.round(settings.screenShake * 100)}%`,
        onSelect: () => {
          settings.screenShake = (settings.screenShake + 0.5) > 1.5 ? 0 : settings.screenShake + 0.5;
          save.saveSettings();
          this.renderMenu();
        }
      },
      {
        id: 'damage_numbers',
        label: `FLOATING COMBAT TEXT & CRITS`,
        subtext: `Toggle floating numeric combat damage readouts`,
        badge: settings.damageNumbers ? 'ON' : 'OFF',
        onSelect: () => {
          settings.damageNumbers = !settings.damageNumbers;
          save.saveSettings();
          this.renderMenu();
        }
      },
      {
        id: 'reset_save',
        label: `PURGE SAVE DATA & META-PROGRESSION`,
        subtext: `Factory reset all unlocked cores, high scores, and lab upgrades`,
        badge: 'CAUTION',
        onSelect: () => {
          if (confirm('Are you sure you want to purge all Cyber Protocol save data?')) {
            localStorage.clear();
            location.reload();
          }
        }
      }
    ];

    this.menu.setItems(items);
  }
}
