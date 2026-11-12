import type { DialogueNode } from '../logic/dialogue';
import type { GameState } from '../logic/gameState';
import type { Suspect } from '../data/day1';
import { DeductionBoard } from './deductionBoard';
import { DialogueBox } from './dialogueBox';
import { Toaster } from './toast';

/** All the HTML layered over the game canvas: HUD, dialogue, board and toasts. */
export class Overlays {
  private readonly dialogue: DialogueBox;
  private readonly board: DeductionBoard;
  private readonly toaster: Toaster;
  private dayCompleteAnnounced = false;

  constructor(
    root: HTMLElement,
    private readonly state: GameState,
    content: { dialogue: Readonly<Record<string, DialogueNode>>; suspects: readonly Suspect[] },
  ) {
    const hud = document.createElement('div');
    hud.className = 'hud';
    hud.innerHTML = `
      <span class="where">Day 1 · Faculty courtyard · Night</span>
      <span class="keys">WASD move · E interact · Tab board</span>`;
    root.appendChild(hud);

    this.toaster = new Toaster(root);
    this.dialogue = new DialogueBox(root, state, content.dialogue);
    this.board = new DeductionBoard(root, state, content.suspects, (text) => this.toast(text));

    state.onChange(() => this.checkDayComplete());
  }

  /** True while an overlay should stop the player from walking or interacting. */
  isBlocking(): boolean {
    return this.dialogue.isOpen || this.board.isOpen;
  }

  isDialogueOpen(): boolean {
    return this.dialogue.isOpen;
  }

  openDialogue(startId: string): void {
    this.board.close();
    this.dialogue.open(startId);
  }

  chooseNumber(n: number): void {
    if (this.dialogue.isOpen) this.dialogue.chooseNumber(n);
  }

  /** Opens or closes the board. Does nothing mid-conversation. */
  toggleBoard(): void {
    if (this.dialogue.isOpen) return;
    if (this.board.isOpen) this.board.close();
    else this.board.open();
  }

  closeAll(): void {
    this.dialogue.close();
    this.board.close();
  }

  toast(text: string): void {
    this.toaster.show(text);
  }

  private checkDayComplete(): void {
    if (this.dayCompleteAnnounced || !this.state.isDay1Complete()) return;
    this.dayCompleteAnnounced = true;
    // Let the "Connected" message show first.
    window.setTimeout(() => this.toaster.show('Day 1 complete. The case continues tomorrow.', 4500), 700);
  }
}
