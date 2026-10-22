// In-Game Pause Menu Overlay (100% Keyboard-Driven)

import { KeyboardMenu, MenuItem } from './KeyboardMenu';
import { SoundSynth } from '../audio/SoundSynth';

export class PauseOverlay {
  private container: HTMLElement;
  private menuContainer!: HTMLElement;
  private menu!: KeyboardMenu;

  constructor(
    parent: HTMLElement,
    onResume: () => void,
    onOpenCodex: () => void,
    onRestart: () => void,
    onQuit: () => void
  ) {
    this.container = document.createElement('div');
    this.container.id = 'pause-overlay';
    this.container.className = 'cyber-overlay';
    this.container.style.display = 'none';
    parent.appendChild(this.container);

    this.container.innerHTML = `
      <div class="cyber-modal">
        <div class="modal-header">
          <div class="modal-sub">TACTICAL PAUSE</div>
          <h2 class="modal-title">SYSTEM SUSPENDED</h2>
          <div class="modal-instruction">Navigate with [ARROWS / 1-5] &bull; Confirm with [ENTER] &bull; Resume with [ESC]</div>
        </div>

        <div id="pause-menu-container"></div>
      </div>
    `;

    this.menuContainer = this.container.querySelector('#pause-menu-container')!;
    this.menu = new KeyboardMenu(
      this.menuContainer,
      [
        {
          id: 'resume',
          label: 'RESUME SIMULATION',
          subtext: 'Return to active combat protocol',
          onSelect: () => {
            this.hide();
            onResume();
          }
        },
        {
          id: 'codex',
          label: 'TACTICAL CODEX',
          subtext: 'View weapon blueprints, enemy Intel, and keyboard keybindings',
          onSelect: onOpenCodex
        },
        {
          id: 'audio',
          label: 'TOGGLE AUDIO MUTE',
          subtext: 'Mute/unmute procedural synth engine',
          onSelect: () => {
            const isMuted = SoundSynth.getInstance().toggleMute();
            alert(`Audio ${isMuted ? 'Muted' : 'Unmuted'}`);
          }
        },
        {
          id: 'restart',
          label: 'REBOOT SECTOR',
          subtext: 'Restart the run with current chassis',
          onSelect: () => {
            this.hide();
            onRestart();
          }
        },
        {
          id: 'quit',
          label: 'ABORT PROTOCOL',
          subtext: 'Return to title mainframe',
          onSelect: () => {
            this.hide();
            onQuit();
          }
        }
      ],
      () => {
        // On cancel (Escape)
        this.hide();
        onResume();
      }
    );
  }

  public show(): void {
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
