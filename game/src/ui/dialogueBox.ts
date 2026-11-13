import { isChoiceAvailable, resolveChoice, type DialogueNode } from '../logic/dialogue';
import type { Clue } from '../logic/clues';
import type { GameState } from '../logic/gameState';

/** The conversation panel along the bottom of the screen. */
export class DialogueBox {
  private readonly el: HTMLElement;
  private readonly speakerEl: HTMLElement;
  private readonly textEl: HTMLElement;
  private readonly choicesEl: HTMLElement;
  private current: DialogueNode | null = null;

  constructor(
    root: HTMLElement,
    private readonly state: GameState,
    private readonly nodes: Readonly<Record<string, DialogueNode>>,
    private readonly clues: Readonly<Record<string, Clue>>,
    private readonly toast: (text: string) => void,
  ) {
    this.el = document.createElement('section');
    this.el.className = 'panel dialogue';
    this.el.hidden = true;
    this.el.innerHTML = `
      <div class="speaker"></div>
      <p class="line"></p>
      <ol class="choices"></ol>
      <div class="hint">Click a reply or press its number · Esc to leave</div>`;
    this.speakerEl = this.el.querySelector('.speaker')!;
    this.textEl = this.el.querySelector('.line')!;
    this.choicesEl = this.el.querySelector('.choices')!;
    root.appendChild(this.el);
  }

  get isOpen(): boolean {
    return this.current !== null;
  }

  open(startId: string): void {
    const start = this.nodes[startId];
    if (start) this.show(start);
  }

  close(): void {
    this.current = null;
    this.el.hidden = true;
  }

  /** Picks the reply shown with this number (1-based), if it can be picked. */
  chooseNumber(n: number): void {
    const button = this.choicesEl.querySelectorAll('button')[n - 1];
    if (button && !button.disabled) button.click();
  }

  private show(node: DialogueNode): void {
    this.current = node;
    const gained = this.state.enterNode(node, this.clues);
    if (gained) this.toast(`New clue: ${gained.name}`);

    this.speakerEl.textContent = node.speaker;
    this.textEl.textContent = node.text;
    this.choicesEl.replaceChildren(
      ...node.choices.map((choice, index) => {
        const available = isChoiceAvailable(choice, this.state.inventory);
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = `${index + 1}. ${choice.text}${available ? '' : ' (needs a clue)'}`;
        button.disabled = !available;
        button.addEventListener('click', () => this.choose(index));
        item.appendChild(button);
        return item;
      }),
    );
    this.el.hidden = false;
  }

  private choose(index: number): void {
    if (!this.current) return;
    const next = resolveChoice(this.current, index, this.nodes);
    if (next === null) this.close();
    else this.show(next);
  }
}
