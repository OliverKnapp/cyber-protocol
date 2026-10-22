// In-Game Tactical Codex & Keyboard Control Reference

import { KeyboardMenu } from './KeyboardMenu';
import { InputManager, InputAction } from '../core/InputManager';

export class CodexOverlay {
  private container: HTMLElement;
  private tabContent!: HTMLElement;
  private currentTab: 'controls' | 'weapons' | 'enemies' = 'controls';
  private onCloseCallback: () => void;

  constructor(parent: HTMLElement, onClose: () => void) {
    this.onCloseCallback = onClose;

    this.container = document.createElement('div');
    this.container.id = 'codex-overlay';
    this.container.className = 'cyber-overlay';
    this.container.style.display = 'none';
    parent.appendChild(this.container);

    this.container.innerHTML = `
      <div class="cyber-modal codex-modal">
        <div class="modal-header">
          <div class="modal-sub">DATABASE REPOSITORY</div>
          <h2 class="modal-title">TACTICAL CODEX</h2>
          <div class="codex-nav-tabs">
            <span id="tab-btn-controls" class="codex-tab active">[1] CONTROLS</span>
            <span id="tab-btn-weapons" class="codex-tab">[2] WEAPON SPECS</span>
            <span id="tab-btn-enemies" class="codex-tab">[3] HOSTILES</span>
          </div>
          <div class="modal-instruction">Press [1], [2], [3] to switch tabs &bull; Press [ESC / ENTER] to exit</div>
        </div>

        <div id="codex-tab-content" class="codex-content-body"></div>

        <div class="modal-footer">
          <button id="codex-close-btn" class="cyber-btn">[ESC / ENTER] CLOSE CODEX</button>
        </div>
      </div>
    `;

    this.tabContent = this.container.querySelector('#codex-tab-content')!;
    this.renderTab();
  }

  public show(): void {
    this.container.style.display = 'flex';
    this.currentTab = 'controls';
    this.renderTab();
  }

  public hide(): void {
    this.container.style.display = 'none';
  }

  public handleInput(): boolean {
    if (this.container.style.display === 'none') return false;

    const input = InputManager.getInstance();

    if (input.isJustPressed(InputAction.SELECT_1)) {
      this.currentTab = 'controls';
      this.renderTab();
      return true;
    }
    if (input.isJustPressed(InputAction.SELECT_2)) {
      this.currentTab = 'weapons';
      this.renderTab();
      return true;
    }
    if (input.isJustPressed(InputAction.SELECT_3)) {
      this.currentTab = 'enemies';
      this.renderTab();
      return true;
    }

    if (input.isJustPressed(InputAction.CANCEL) || input.isJustPressed(InputAction.CONFIRM) || input.isJustPressed(InputAction.OPEN_CODEX)) {
      this.hide();
      this.onCloseCallback();
      return true;
    }

    return false;
  }

  private renderTab(): void {
    // Update active tab styles
    this.container.querySelectorAll('.codex-tab').forEach(tab => tab.classList.remove('active'));
    this.container.querySelector(`#tab-btn-${this.currentTab}`)?.classList.add('active');

    if (this.currentTab === 'controls') {
      this.tabContent.innerHTML = `
        <div class="controls-guide-grid">
          <div class="control-card">
            <span class="control-key">WASD / ARROW KEYS</span>
            <span class="control-desc">Omni-directional Thruster Propulsion</span>
          </div>
          <div class="control-card">
            <span class="control-key">SPACE / J</span>
            <span class="control-desc">Primary Weapon Discharge (Hold for auto-fire)</span>
          </div>
          <div class="control-card">
            <span class="control-key">SHIFT / K / Z</span>
            <span class="control-desc">Cybernetic Dash (Invulnerability frames + speed burst)</span>
          </div>
          <div class="control-card">
            <span class="control-key">E / X</span>
            <span class="control-desc">EMP Overdrive Pulse (Clears enemy bullets in 360&deg;)</span>
          </div>
          <div class="control-card">
            <span class="control-key">1, 2, 3, 4</span>
            <span class="control-desc">Instant Menu & Level-up Perk Selection</span>
          </div>
          <div class="control-card">
            <span class="control-key">ESC / P</span>
            <span class="control-desc">Tactical Simulation Pause</span>
          </div>
          <div class="control-card">
            <span class="control-key">M</span>
            <span class="control-desc">Audio Mute / Sound Toggle</span>
          </div>
          <div class="control-card">
            <span class="control-key">C</span>
            <span class="control-desc">Toggle Tactical Codex</span>
          </div>
        </div>
      `;
    } else if (this.currentTab === 'weapons') {
      this.tabContent.innerHTML = `
        <div class="weapons-guide-list">
          <div class="intel-item">
            <div class="intel-title cyan">⚡ PULSE BLASTER MK-I</div>
            <div class="intel-body">Balanced military-grade plasma carbine. 4.5 shots/sec with pinpoint accuracy. Optimal for mobile combat and kiting.</div>
          </div>
          <div class="intel-item">
            <div class="intel-title green">🗡️ NANO-KINETIC EDGE</div>
            <div class="intel-body">High-frequency blade slice emitting wide energy arcs. Destroys hostile projectile bullets upon contact and cleaves multiple enemies.</div>
          </div>
          <div class="intel-item">
            <div class="intel-title magenta">🎯 HYPER-RAIL ACCELERATOR</div>
            <div class="intel-body">High-voltage depleted slug launcher. Punches through up to 8 targets in a line with 120 base damage and massive knockback.</div>
          </div>
          <div class="intel-item">
            <div class="intel-title yellow">💥 FLAK DISSOLVER</div>
            <div class="intel-body">Fires a shotgun blast of 7 tungsten shrapnel pellets. Extremely devastating at point-blank range against dense drone swarms.</div>
          </div>
          <div class="intel-item">
            <div class="intel-title purple">🪐 VORTEX DISRUPTOR</div>
            <div class="intel-body">Launches localized mini-singularities that generate gravitational pull, drawing enemies inward before detonating in an implosion.</div>
          </div>
        </div>
      `;
    } else {
      this.tabContent.innerHTML = `
        <div class="enemies-guide-list">
          <div class="intel-item">
            <div class="intel-title red">🔺 V-4 HORNET DRONE</div>
            <div class="intel-body">Fast, agile scout drones that attack in swarms. Individually fragile, but dangerous in large flanking packs.</div>
          </div>
          <div class="intel-item">
            <div class="intel-title orange">🛑 GOLIATH ENFORCER</div>
            <div class="intel-body">Armored security dreadnought. Approaches to mid-range and unleashes 3-round bursts of high-velocity plasma bolts.</div>
          </div>
          <div class="intel-item">
            <div class="intel-title purple">💎 VIPER RAIL SNIPER</div>
            <div class="intel-body">Stationary perimeter artillery. Maintains extreme distance, charges an aiming laser line, and discharges piercing rail slugs.</div>
          </div>
          <div class="intel-item">
            <div class="intel-title green">💠 GLITCH INFILTRATOR</div>
            <div class="intel-body">Experimental phase-shifting construct. Disappears from radar and blinks directly into your blind spot.</div>
          </div>
          <div class="intel-item">
            <div class="intel-title red">👑 NEXUS OVERLORD PRIME (BOSS)</div>
            <div class="intel-body">Super-dreadnought guarding each sector transition (Wave 5, 10...). Features 3 combat phases: spiral bullet hell, high-speed ramming charges, and radial laser sweeps.</div>
          </div>
        </div>
      `;
    }
  }
}
