// Game Over Run Summary Overlay (100% Keyboard-Driven)

import { RunStats } from '../types';
import { KeyboardMenu } from './KeyboardMenu';

export class GameOverOverlay {
  private container: HTMLElement;
  private menuContainer!: HTMLElement;
  private menu!: KeyboardMenu;
  private scoreVal!: HTMLElement;
  private waveVal!: HTMLElement;
  private killsVal!: HTMLElement;
  private damageVal!: HTMLElement;
  private coresVal!: HTMLElement;

  constructor(
    parent: HTMLElement,
    onRestart: () => void,
    onOpenCodex: () => void,
    onQuit: () => void
  ) {
    this.container = document.createElement('div');
    this.container.id = 'game-over-overlay';
    this.container.className = 'cyber-overlay';
    this.container.style.display = 'none';
    parent.appendChild(this.container);

    this.container.innerHTML = `
      <div class="cyber-modal danger-modal">
        <div class="modal-header">
          <div class="modal-sub danger-sub">CRITICAL FAILURE DETECTED</div>
          <h2 class="modal-title glitch-text" data-text="NEURAL LINK SEVERED">NEURAL LINK SEVERED</h2>
          <div class="modal-instruction">Tactical evaluation report logged to mainframe</div>
        </div>

        <div class="run-stats-grid">
          <div class="stat-card">
            <span class="card-label">FINAL SCORE</span>
            <span id="go-score" class="card-value highlight">0</span>
          </div>
          <div class="stat-card">
            <span class="card-label">SECTORS SURVIVED</span>
            <span id="go-wave" class="card-value">WAVE 1</span>
          </div>
          <div class="stat-card">
            <span class="card-label">HOSTILES NEUTRALIZED</span>
            <span id="go-kills" class="card-value">0</span>
          </div>
          <div class="stat-card">
            <span class="card-label">DAMAGE DEALT</span>
            <span id="go-damage" class="card-value">0</span>
          </div>
          <div class="stat-card full-width">
            <span class="card-label">CYBER-CORES EXTRACTED</span>
            <span id="go-cores" class="card-value gold-value">+0 CORES</span>
          </div>
        </div>

        <div id="game-over-menu-container"></div>
      </div>
    `;

    this.scoreVal = this.container.querySelector('#go-score')!;
    this.waveVal = this.container.querySelector('#go-wave')!;
    this.killsVal = this.container.querySelector('#go-kills')!;
    this.damageVal = this.container.querySelector('#go-damage')!;
    this.coresVal = this.container.querySelector('#go-cores')!;

    this.menuContainer = this.container.querySelector('#game-over-menu-container')!;
    this.menu = new KeyboardMenu(this.menuContainer, [
      {
        id: 'restart',
        label: 'RE-ENGAGE PROTOCOL (RESTART)',
        subtext: 'Deploy a new chassis immediately [Press 1 or Enter]',
        onSelect: () => {
          this.hide();
          onRestart();
        }
      },
      {
        id: 'codex',
        label: 'TACTICAL CODEX & INTEL',
        subtext: 'Review enemies, mechanics, and controls [Press 2]',
        onSelect: onOpenCodex
      },
      {
        id: 'quit',
        label: 'RETURN TO TITLE MAINFRAME',
        subtext: 'Access loadout and meta-upgrades [Press 3]',
        onSelect: () => {
          this.hide();
          onQuit();
        }
      }
    ]);
  }

  public show(stats: RunStats): void {
    this.scoreVal.textContent = stats.score.toLocaleString();
    this.waveVal.textContent = `WAVE ${stats.wave}`;
    this.killsVal.textContent = stats.enemiesKilled.toString();
    this.damageVal.textContent = stats.damageDealt.toLocaleString();

    const cores = Math.floor(stats.score / 150) + stats.wave * 5;
    this.coresVal.textContent = `+${cores} DATA CORES`;

    this.container.style.display = 'flex';
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
