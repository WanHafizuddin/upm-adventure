import type { Person } from '../data/case';
import { sound } from '../audio/sound';
import type { DeductionLink } from '../logic/deduction';
import type { GameState } from '../logic/gameState';

interface BoardCard {
  id: string;
  name: string;
  kind: 'Clue' | 'Suspect' | 'Victim';
  detail: string;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const HINT =
  'Each lead on the right names the cards to compare. Click one card, then the card it connects to (or drag one onto the other).';
/** Vertical space per card row, in CSS pixels (a card is about 52px tall). */
const ROW_PX = 66;

/**
 * Full-screen board. With a few clues: clues left, people right. With many: people in the middle and
 * clues on both sides, so every string runs clue-to-person without passing behind another card.
 * A "Leads" list beside the cards says which connections are still open, so the player always knows
 * what to compare. Click a card then another (or drag one onto another) to propose a connection.
 */
export class DeductionBoard {
  private readonly el: HTMLElement;
  private readonly area: HTMLElement;
  private readonly svg: SVGSVGElement;
  private readonly emptyHint: HTMLElement;
  private readonly detail: HTMLElement;
  private readonly openList: HTMLElement;
  private readonly madeList: HTMLElement;
  private readonly madeTitle: HTMLElement;
  private dragFrom: HTMLElement | null = null;
  private dragLine: SVGLineElement | null = null;
  /** The card picked by a click, waiting for the card it should connect to. */
  private selected: HTMLElement | null = null;

  constructor(
    root: HTMLElement,
    private readonly state: GameState,
    private readonly people: readonly Person[],
    private readonly toast: (text: string) => void,
  ) {
    this.el = document.createElement('section');
    this.el.className = 'panel board';
    this.el.hidden = true;
    this.el.innerHTML = `
      <header>
        <h2>Deduction Board</h2>
        <p class="hint">Tab or Esc to close</p>
      </header>
      <div class="board-body">
        <div class="board-area">
          <svg class="board-lines"></svg>
          <p class="board-empty">Collect clues to add them to the board.</p>
        </div>
        <aside class="board-leads">
          <h3>Leads</h3>
          <ol class="leads-open"></ol>
          <h3 class="leads-made-title">Worked out</h3>
          <ol class="leads-made"></ol>
        </aside>
      </div>
      <p class="board-detail"></p>`;
    this.area = this.el.querySelector('.board-area')!;
    this.svg = this.el.querySelector('svg')!;
    this.emptyHint = this.el.querySelector('.board-empty')!;
    this.detail = this.el.querySelector('.board-detail')!;
    this.openList = this.el.querySelector('.leads-open')!;
    this.madeList = this.el.querySelector('.leads-made')!;
    this.madeTitle = this.el.querySelector('.leads-made-title')!;
    root.appendChild(this.el);

    // A click on empty board space drops the current pick.
    this.area.addEventListener('pointerdown', (e) => {
      if (!(e.target as HTMLElement).closest('.card')) this.select(null);
    });
    window.addEventListener('pointermove', (e) => this.onPointerMove(e));
    window.addEventListener('pointerup', (e) => this.onPointerUp(e));
    window.addEventListener('resize', () => {
      if (this.isOpen) this.redrawLines();
    });
  }

  get isOpen(): boolean {
    return !this.el.hidden;
  }

  open(): void {
    this.el.hidden = false;
    this.detail.textContent = HINT;
    this.render();
  }

  close(): void {
    this.cancelDrag();
    this.select(null);
    this.el.hidden = true;
  }

  private render(): void {
    this.selected = null;
    this.area.querySelectorAll('.card').forEach((card) => card.remove());
    const clues: BoardCard[] = this.state.inventory
      .all()
      .map((c) => ({ id: c.id, name: c.name, kind: 'Clue', detail: c.description }));
    const people: BoardCard[] = this.people.map((p) => ({ id: p.id, name: p.name, kind: p.kind, detail: p.role }));
    this.emptyHint.hidden = clues.length > 0;

    const open = this.state.validator.openLinks(new Set([...clues, ...people].map((c) => c.id)));
    const openCount = (id: string) => open.filter((l) => l.clueId === id || l.targetId === id).length;

    // Each row has a fixed height so cards never overlap. On a short window the board scrolls instead.
    const split = clues.length > 4;
    const clueRows = Math.ceil(clues.length / (split ? 2 : 1));
    const rows = Math.max(clueRows, people.length);
    this.area.style.minHeight = `${rows * ROW_PX + 8}px`;
    clues.forEach((card, i) => {
      const column = split && i % 2 === 1 ? 'right' : 'left';
      const row = split ? Math.floor(i / 2) : i;
      this.addCard(card, column, 6 + row * ROW_PX, openCount(card.id));
    });
    people.forEach((card, i) => this.addCard(card, split ? 'center' : 'right', 6 + i * ROW_PX, openCount(card.id)));
    this.renderLeads(open);
    this.redrawLines();
  }

  private addCard(card: BoardCard, column: string, topPx: number, openLeads: number): void {
    const el = document.createElement('div');
    el.className = `card ${card.kind.toLowerCase()} ${column}`;
    // Nothing left to connect on this card for now: fade it so the cards that matter stand out.
    if (openLeads === 0) el.classList.add('idle');
    el.dataset.id = card.id;
    el.dataset.name = card.name;
    el.style.top = `${topPx}px`;
    const kind = document.createElement('span');
    kind.className = 'kind';
    kind.textContent = card.kind;
    const name = document.createElement('strong');
    name.textContent = card.name;
    el.append(kind, name);
    if (openLeads > 0) {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = String(openLeads);
      badge.title = `${openLeads} open lead${openLeads === 1 ? '' : 's'}`;
      el.append(badge);
    }
    el.addEventListener('pointerenter', () => {
      if (!this.selected) this.detail.textContent = `${card.name}: ${card.detail}`;
    });
    el.addEventListener('pointerdown', (e) => this.startDrag(e, el));
    this.area.appendChild(el);
  }

  /** Fills the side list: open questions first, then what the player has already worked out. */
  private renderLeads(open: readonly DeductionLink[]): void {
    this.openList.replaceChildren();
    if (open.length === 0) {
      const none = document.createElement('li');
      none.className = 'none';
      none.textContent = 'Nothing to connect right now. Find more clues.';
      this.openList.append(none);
    }
    for (const link of open) {
      const item = document.createElement('li');
      item.className = 'lead';
      item.textContent = link.lead ?? 'Something here still connects.';
      item.title = 'Click to pick the clue this lead starts from';
      item.addEventListener('pointerenter', () => this.cardFor(link.clueId)?.classList.add('hinted'));
      item.addEventListener('pointerleave', () => this.cardFor(link.clueId)?.classList.remove('hinted'));
      item.addEventListener('click', () => this.select(this.cardFor(link.clueId) ?? null));
      this.openList.append(item);
    }

    const made = this.state.validator.madeLinks();
    this.madeTitle.hidden = made.length === 0;
    this.madeList.replaceChildren(
      ...made.map((link) => {
        const item = document.createElement('li');
        item.textContent = link.insight ?? `${link.clueId} ↔ ${link.targetId}`;
        return item;
      }),
    );
  }

  private cardFor(id: string): HTMLElement | undefined {
    return this.area.querySelector<HTMLElement>(`.card[data-id="${id}"]`) ?? undefined;
  }

  /** Picks a card as the first half of a connection, or clears the pick with `null`. */
  private select(card: HTMLElement | null): void {
    this.selected?.classList.remove('selected');
    this.selected = card;
    if (card) {
      card.classList.add('selected');
      this.detail.textContent = `${card.dataset.name} picked. Now click the card it connects to (click it again to cancel).`;
    } else if (this.isOpen) {
      this.detail.textContent = HINT;
    }
  }

  /** Draws a line for every pair already connected, and marks those cards. */
  private redrawLines(): void {
    this.svg.querySelectorAll('line.made').forEach((l) => l.remove());
    const cards = [...this.area.querySelectorAll<HTMLElement>('.card')];
    for (const a of cards) {
      for (const b of cards) {
        if (a.dataset.id! < b.dataset.id! && this.state.validator.isConnected(a.dataset.id!, b.dataset.id!)) {
          a.classList.add('connected');
          b.classList.add('connected');
          this.setLine(this.makeLine('made'), this.centerOf(a), this.centerOf(b));
        }
      }
    }
  }

  private startDrag(e: PointerEvent, card: HTMLElement): void {
    e.preventDefault();
    this.dragFrom = card;
    card.classList.add('dragging');
    this.dragLine = this.makeLine('preview');
    const start = this.centerOf(card);
    this.setLine(this.dragLine, start, start);
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.dragFrom || !this.dragLine) return;
    this.setLine(this.dragLine, this.centerOf(this.dragFrom), this.toAreaPoint(e.clientX, e.clientY));
  }

  private onPointerUp(e: PointerEvent): void {
    if (!this.dragFrom) return;
    const from = this.dragFrom;
    const target = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('.card');
    this.cancelDrag();
    if (!target) return;

    if (target !== from) {
      // Dragged one card onto another.
      this.select(null);
      this.tryConnect(from, target);
    } else if (this.selected === null) {
      this.select(from);
    } else if (this.selected === from) {
      this.select(null);
    } else {
      // Second click: connect it to the card picked first.
      const first = this.selected;
      this.select(null);
      this.tryConnect(first, from);
    }
  }

  private tryConnect(a: HTMLElement, b: HTMLElement): void {
    const idA = a.dataset.id!;
    const idB = b.dataset.id!;
    if (this.state.validator.isConnected(idA, idB)) {
      this.toast('Already connected.');
      return;
    }
    const result = this.state.connect(idA, idB);
    if (result.valid) {
      sound.connect();
      this.toast(`✓ ${result.insight ?? `Connected: ${a.dataset.name} ↔ ${b.dataset.name}`}`);
      this.render();
    } else {
      sound.reject();
      this.toast(`${a.dataset.name} and ${b.dataset.name} don't connect. Check the Leads list.`);
    }
  }

  private cancelDrag(): void {
    this.dragFrom?.classList.remove('dragging');
    this.dragFrom = null;
    this.dragLine?.remove();
    this.dragLine = null;
  }

  private makeLine(kind: 'made' | 'preview'): SVGLineElement {
    const line = document.createElementNS(SVG_NS, 'line');
    line.classList.add(kind);
    this.svg.appendChild(line);
    return line;
  }

  private setLine(line: SVGLineElement, from: { x: number; y: number }, to: { x: number; y: number }): void {
    line.setAttribute('x1', String(from.x));
    line.setAttribute('y1', String(from.y));
    line.setAttribute('x2', String(to.x));
    line.setAttribute('y2', String(to.y));
  }

  private centerOf(el: HTMLElement): { x: number; y: number } {
    const r = el.getBoundingClientRect();
    return this.toAreaPoint(r.left + r.width / 2, r.top + r.height / 2);
  }

  private toAreaPoint(clientX: number, clientY: number): { x: number; y: number } {
    const r = this.area.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }
}
