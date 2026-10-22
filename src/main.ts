// Main Game Application Entry Point

import './style.css';
import { Engine } from './core/Engine';
import { SoundSynth } from './audio/SoundSynth';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  const uiContainer = document.getElementById('ui-container') as HTMLElement;

  if (!canvas || !uiContainer) {
    console.error('Critical Error: Failed to find canvas or ui container elements');
    return;
  }

  // Pre-initialize sound synthesizer on first user keyboard interaction
  const unlockAudio = () => {
    SoundSynth.getInstance().init();
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('keydown', unlockAudio);

  // Initialize and launch the Game Engine
  const engine = new Engine(canvas, uiContainer);
  engine.start();

  console.log('⚡ CYBER PROTOCOL initialized. 100% Keyboard-Driven Roguelite active.');
});
