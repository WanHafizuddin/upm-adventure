import { ACCUSATION, CLUES, ENDINGS, type Person } from '../data/case';
import { judgeAccusation, type Verdict } from '../logic/accusation';
import type { GameState } from '../logic/gameState';

/** How each part of the case is described when it's missing. */
const GROUP_WORDS: Readonly<Record<string, string>> = {
  opportunity: 'that he had the chance to do it (opportunity)',
  means: 'how he did it (means)',
  motive: 'why he did it (motive)',
};

/**
 * The final accusation: choose the killer and exactly three pieces of evidence,
 * then see the ending. Wrong or weak accusations can be tried again.
 */
export class AccusationPanel {
  private readonly el: HTMLElement;
  private readonly endCard: HTMLElement;
  private suspect: string | null = null;
  private readonly picked = new Set<string>();

  constructor(
    root: HTMLElement,
    private readonly state: GameState,
    private readonly people: readonly Person[],
    private readonly toast: (text: string) => void,
  ) {
    this.el = document.createElement('section');
    this.el.className = 'panel accuse';
    this.el.hidden = true;
    root.appendChild(this.el);

    this.endCard = document.createElement('section');
    this.endCard.className = 'endcard';
    this.endCard.hidden = true;
    root.appendChild(this.endCard);
  }

  /** True while the panel or an ending is on screen. */
  get isOpen(): boolean {
    return !this.el.hidden || !this.endCard.hidden;
  }

  open(): void {
    this.suspect = null;
    this.picked.clear();
    this.el.hidden = false;
    this.render();
  }

  /** Closes the panel (Esc). An ending screen stays until the player chooses what to do. */
  close(): void {
    this.el.hidden = true;
  }

  private render(): void {
    const suspects = this.people.filter((p) => p.kind === 'Suspect');
    const clues = this.state.inventory.all();
    const ready = this.suspect !== null && this.picked.size === ACCUSATION.evidenceNeeded;

    this.el.innerHTML = `
      <header>
        <h2>Name the killer</h2>
        <p class="hint">Esc to step back</p>
      </header>
      <h3>1. Who killed Dr. Rosli?</h3>
      <div class="accuse-suspects"></div>
      <h3>2. Choose exactly ${ACCUSATION.evidenceNeeded} pieces of evidence <span class="count"></span></h3>
      <div class="accuse-evidence"></div>
      <p class="accuse-detail">Hover a piece of evidence to read it.</p>
      <button type="button" class="accuse-go">Accuse</button>`;

    const suspectBox = this.el.querySelector('.accuse-suspects')!;
    for (const person of suspects) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `accuse-suspect${this.suspect === person.id ? ' chosen' : ''}`;
      button.innerHTML = '<strong></strong><small></small>';
      button.querySelector('strong')!.textContent = person.name;
      button.querySelector('small')!.textContent = person.role;
      button.addEventListener('click', () => {
        this.suspect = person.id;
        this.render();
      });
      suspectBox.appendChild(button);
    }

    const detail = this.el.querySelector('.accuse-detail')!;
    const evidenceBox = this.el.querySelector('.accuse-evidence')!;
    for (const clue of clues) {
      const button = document.createElement('button');
      button.type = 'button';
      const chosen = this.picked.has(clue.id);
      button.className = `accuse-clue${chosen ? ' chosen' : ''}`;
      button.textContent = clue.name;
      button.disabled = !chosen && this.picked.size >= ACCUSATION.evidenceNeeded;
      button.addEventListener('pointerenter', () => (detail.textContent = `${clue.name}: ${clue.description}`));
      button.addEventListener('click', () => {
        if (chosen) this.picked.delete(clue.id);
        else this.picked.add(clue.id);
        this.render();
      });
      evidenceBox.appendChild(button);
    }
    this.el.querySelector('.count')!.textContent = `(${this.picked.size} / ${ACCUSATION.evidenceNeeded})`;

    const go = this.el.querySelector<HTMLButtonElement>('.accuse-go')!;
    go.disabled = !ready;
    go.addEventListener('click', () => this.submit());
  }

  private submit(): void {
    if (this.suspect === null) return;
    const verdict = judgeAccusation(this.suspect, [...this.picked], ACCUSATION);
    if (verdict.ending === 'not_ready') {
      this.toast(`Choose ${ACCUSATION.evidenceNeeded} pieces of evidence first.`);
      return;
    }
    this.state.setFlag('accused');
    this.el.hidden = true;
    this.showEnding(verdict, this.suspect);
  }

  private showEnding(verdict: Verdict, suspectId: string): void {
    if (verdict.ending === 'not_ready') return;
    const ending = ENDINGS[verdict.ending];
    const name = this.people.find((p) => p.id === suspectId)?.name ?? suspectId;

    this.endCard.innerHTML = `
      <div class="endcard-inner">
        <p class="end-kicker">Case Files: Serdang Raya</p>
        <h1></h1>
        <p class="end-text"></p>
        <p class="end-missing"></p>
        <p class="end-evidence"></p>
        <div class="end-buttons"></div>
      </div>`;
    this.endCard.querySelector('h1')!.textContent = ending.title;
    this.endCard.querySelector('.end-text')!.textContent = ending.text.replace('{name}', name);
    const missing = this.endCard.querySelector<HTMLElement>('.end-missing')!;
    if (verdict.ending === 'unproven') {
      missing.textContent = `Your case never proved ${verdict.missing.map((g) => GROUP_WORDS[g] ?? g).join(', or ')}.`;
    } else missing.hidden = true;
    this.endCard.querySelector('.end-evidence')!.textContent =
      `You accused ${name} with: ${[...this.picked].map((id) => CLUES[id]?.name ?? id).join(', ')}.`;

    const buttons = this.endCard.querySelector('.end-buttons')!;
    if (verdict.ending !== 'true') {
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.textContent = 'Try the accusation again';
      retry.addEventListener('click', () => {
        this.endCard.hidden = true;
        this.open();
      });
      buttons.appendChild(retry);
    }
    const restart = document.createElement('button');
    restart.type = 'button';
    restart.textContent = 'Play again from Day 1';
    restart.addEventListener('click', () => window.location.reload());
    buttons.appendChild(restart);

    this.endCard.hidden = false;
  }
}
