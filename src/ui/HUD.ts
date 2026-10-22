// In-Game Cyberpunk HUD

import { PlayerStats, RunStats } from '../types';
import { WEAPON_REGISTRY } from '../content/Weapons';

export class HUD {
  private container: HTMLElement;
  private hpFill!: HTMLElement;
  private hpText!: HTMLElement;
  private xpFill!: HTMLElement;
  private levelBadge!: HTMLElement;
  private overdriveFill!: HTMLElement;
  private overdrivePrompt!: HTMLElement;
  private dashIndicator!: HTMLElement;
  private waveText!: HTMLElement;
  private scoreText!: HTMLElement;
  private killsText!: HTMLElement;
  private weaponName!: HTMLElement;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'game-hud';
    this.container.className = 'cyber-hud';
    parent.appendChild(this.container);

    this.initElements();
  }

  private initElements(): void {
    this.container.innerHTML = `
      <!-- Top Bar -->
      <div class="hud-top-bar">
        <div class="hud-status-group">
          <!-- HP Bar -->
          <div class="hud-bar-container hp-bar">
            <div class="hud-bar-label">VITALITY <span id="hud-hp-text">100 / 100</span></div>
            <div class="hud-bar-track">
              <div id="hud-hp-fill" class="hud-bar-fill hp-gradient" style="width: 100%;"></div>
            </div>
          </div>

          <!-- XP Bar -->
          <div class="hud-bar-container xp-bar">
            <div class="hud-bar-label">
              <span>SYNC LEVEL <span id="hud-level-badge" class="hud-badge">1</span></span>
            </div>
            <div class="hud-bar-track">
              <div id="hud-xp-fill" class="hud-bar-fill xp-gradient" style="width: 0%;"></div>
            </div>
          </div>

          <!-- Overdrive EMP Bar -->
          <div class="hud-bar-container overdrive-bar">
            <div class="hud-bar-label">OVERDRIVE <span id="hud-overdrive-prompt" class="emp-prompt">[CHARGE: 0%]</span></div>
            <div class="hud-bar-track">
              <div id="hud-overdrive-fill" class="hud-bar-fill overdrive-gradient" style="width: 0%;"></div>
            </div>
          </div>
        </div>

        <!-- Center Wave / Timer -->
        <div class="hud-center-group">
          <div class="hud-wave-title">SECTOR PROTOCOL</div>
          <div id="hud-wave-text" class="hud-wave-number">WAVE 01</div>
        </div>

        <!-- Right Score / Kills -->
        <div class="hud-score-group">
          <div class="hud-stat-box">
            <span class="stat-label">SCORE</span>
            <span id="hud-score-text" class="stat-value">000,000</span>
          </div>
          <div class="hud-stat-box">
            <span class="stat-label">TERMINATED</span>
            <span id="hud-kills-text" class="stat-value">0</span>
          </div>
        </div>
      </div>

      <!-- Bottom Bar: Weapon & Hotkeys -->
      <div class="hud-bottom-bar">
        <div class="hud-weapon-box">
          <span class="weapon-label">SYSTEM ARMAMENT</span>
          <span id="hud-weapon-name" class="weapon-name">PULSE BLASTER MK-I</span>
        </div>

        <div id="hud-dash-indicator" class="hud-dash-box">
          <span class="dash-key">[SHIFT / K]</span>
          <span class="dash-status">DASH READY</span>
        </div>

        <div class="hud-hotkeys-help">
          <span class="key-tag">[WASD]</span> Move &bull;
          <span class="key-tag">[SPACE / J]</span> Fire &bull;
          <span class="key-tag">[SHIFT / K]</span> Dash &bull;
          <span class="key-tag">[E]</span> EMP Wave &bull;
          <span class="key-tag">[C]</span> Codex &bull;
          <span class="key-tag">[ESC]</span> Pause
        </div>
      </div>
    `;

    this.hpFill = this.container.querySelector('#hud-hp-fill')!;
    this.hpText = this.container.querySelector('#hud-hp-text')!;
    this.xpFill = this.container.querySelector('#hud-xp-fill')!;
    this.levelBadge = this.container.querySelector('#hud-level-badge')!;
    this.overdriveFill = this.container.querySelector('#hud-overdrive-fill')!;
    this.overdrivePrompt = this.container.querySelector('#hud-overdrive-prompt')!;
    this.dashIndicator = this.container.querySelector('#hud-dash-indicator')!;
    this.waveText = this.container.querySelector('#hud-wave-text')!;
    this.scoreText = this.container.querySelector('#hud-score-text')!;
    this.killsText = this.container.querySelector('#hud-kills-text')!;
    this.weaponName = this.container.querySelector('#hud-weapon-name')!;
  }

  public update(player: PlayerStats, run: RunStats): void {
    // HP
    const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
    this.hpFill.style.width = `${hpPercent}%`;
    this.hpText.textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;

    // XP
    const xpPercent = Math.max(0, Math.min(100, (run.currentXp / run.nextLevelXp) * 100));
    this.xpFill.style.width = `${xpPercent}%`;
    this.levelBadge.textContent = `${run.level}`;

    // Overdrive
    const odPercent = Math.min(100, (player.overdriveCharge / player.maxOverdrive) * 100);
    this.overdriveFill.style.width = `${odPercent}%`;
    if (odPercent >= 100) {
      this.overdrivePrompt.textContent = '[READY - PRESS E]';
      this.overdrivePrompt.className = 'emp-prompt ready';
    } else {
      this.overdrivePrompt.textContent = `[${Math.floor(odPercent)}%]`;
      this.overdrivePrompt.className = 'emp-prompt';
    }

    // Dash
    if (player.dashCooldown <= 0) {
      this.dashIndicator.className = 'hud-dash-box ready';
      this.dashIndicator.querySelector('.dash-status')!.textContent = 'DASH READY';
    } else {
      this.dashIndicator.className = 'hud-dash-box cooling';
      this.dashIndicator.querySelector('.dash-status')!.textContent = `RECHARGING (${player.dashCooldown.toFixed(1)}s)`;
    }

    // Wave, Score, Kills
    this.waveText.textContent = `WAVE ${run.wave < 10 ? '0' + run.wave : run.wave}`;
    this.scoreText.textContent = run.score.toLocaleString();
    this.killsText.textContent = run.enemiesKilled.toString();

    // Weapon
    const w = WEAPON_REGISTRY[player.currentWeapon];
    if (w) {
      this.weaponName.textContent = w.name.toUpperCase();
    }
  }

  public show(): void {
    this.container.style.display = 'flex';
  }

  public hide(): void {
    this.container.style.display = 'none';
  }
}
