import type { Person } from '../data/case';
import { LAST_DAY, daySpec, type DaySpec } from '../data/days';
import type { Clue } from '../logic/clues';
import type { DialogueNode } from '../logic/dialogue';
import type { GameState } from '../logic/gameState';
import { DeductionBoard } from './deductionBoard';
import { DialogueBox } from './dialogueBox';
import { Toaster } from './toast';

/** All the HTML layered over the game canvas: HUD, day title card, dialogue, board and toasts. */
export class Overlays {
  private readonly dialogue: DialogueBox;
  private readonly board: DeductionBoard;
  private readonly toaster: Toaster;
  private readonly where: HTMLElement;
  private readonly card: HTMLElement;
  private place = '';
  private readonly announcedDays = new Set<number>();

  constructor(
    root: HTMLElement,
    private readonly state: GameState,
    content: {
      dialogue: Readonly<Record<string, DialogueNode>>;
      clues: Readonly<Record<string, Clue>>;
      people: readonly Person[];
    },
  ) {
    const hud = document.createElement('div');
    hud.className = 'hud';
    hud.innerHTML = `
      <span class="where"></span>
      <span class="keys">WASD move · E interact · Tab board</span>`;
    this.where = hud.querySelector('.where')!;
    root.appendChild(hud);

    this.toaster = new Toaster(root);
    this.dialogue = new DialogueBox(root, state, content.dialogue, content.clues, (text) => this.toast(text));
    this.board = new DeductionBoard(root, state, content.people, (text) => this.toast(text));
    this.card = this.buildDayCard(root);

    state.onChange(() => {
      this.updateHud();
      this.checkDayComplete();
    });
  }

  /** True while an overlay should stop the player from walking or interacting. */
  isBlocking(): boolean {
    return this.dialogue.isOpen || this.board.isOpen || !this.card.hidden;
  }

  isDialogueOpen(): boolean {
    return this.dialogue.isOpen;
  }

  /** Called by each location as the player arrives, for the HUD. */
  setPlace(name: string): void {
    this.place = name;
    this.updateHud();
  }

  openDialogue(startId: string): void {
    this.board.close();
    this.dialogue.open(startId);
  }

  chooseNumber(n: number): void {
    if (this.dialogue.isOpen) this.dialogue.chooseNumber(n);
  }

  /** Opens or closes the board. Does nothing mid-conversation or while the day card is up. */
  toggleBoard(): void {
    if (this.dialogue.isOpen || !this.card.hidden) return;
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

  /** The full-screen card that opens each day. Closes on click, or on releasing E, Enter or Space. */
  showDayCard(day: DaySpec): void {
    this.card.querySelector('.day-number')!.textContent = `Day ${day.day}`;
    this.card.querySelector('.day-subtitle')!.textContent = day.subtitle;
    this.card.querySelector('.day-hint')!.textContent = day.hint;
    this.card.hidden = false;
  }

  private buildDayCard(root: HTMLElement): HTMLElement {
    const card = document.createElement('section');
    card.className = 'daycard';
    card.hidden = true;
    card.innerHTML = `
      <div class="daycard-inner">
        <img class="upm-logo" src="upm-logo.png" alt="Universiti Putra Malaysia" />
        <p class="upm-name">Universiti Putra Malaysia</p>
        <p class="upm-motto">Berilmu Berbakti</p>
        <h1 class="game-title">Case Files: Serdang Raya</h1>
        <p class="day-number"></p>
        <p class="day-subtitle"></p>
        <p class="day-hint"></p>
        <p class="day-continue">Click or press E to continue</p>
        <p class="disclaimer">A fan-made story. All characters and events are fictional. Not an official UPM production.</p>
      </div>`;
    // The official logo is supplied separately (see game/README.md); hide the slot until it's there.
    const logo = card.querySelector<HTMLImageElement>('.upm-logo')!;
    logo.addEventListener('error', () => (logo.hidden = true));

    const close = () => {
      if (card.hidden) return;
      card.hidden = true;
      this.updateHud();
    };
    card.addEventListener('click', close);
    // Close on key *release*, so the same press can't also trigger something in the world.
    window.addEventListener('keyup', (e) => {
      if (['e', 'E', 'Enter', ' '].includes(e.key)) close();
    });
    root.appendChild(card);
    return card;
  }

  private updateHud(): void {
    const spec = daySpec(this.state.day);
    this.where.textContent = `Day ${this.state.day} · ${this.place} · ${spec?.time ?? ''}`;
  }

  private checkDayComplete(): void {
    const day = this.state.day;
    if (this.announcedDays.has(day) || !this.state.isDayComplete()) return;
    this.announcedDays.add(day);
    const text =
      day >= LAST_DAY
        ? `Day ${day} complete. That's the whole story so far — more days are coming.`
        : `Day ${day} complete. Head back to KTDI down the south path when you're ready.`;
    // Let the link's own message show first.
    window.setTimeout(() => this.toaster.show(text, 5000), 700);
  }
}
