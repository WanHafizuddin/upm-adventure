/** Short messages that pop up at the top of the screen and fade away. */
export class Toaster {
  private readonly el: HTMLElement;

  constructor(root: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'toasts';
    root.appendChild(this.el);
  }

  show(text: string, durationMs = 2600): void {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = text;
    this.el.appendChild(toast);
    window.setTimeout(() => toast.classList.add('leaving'), durationMs - 400);
    window.setTimeout(() => toast.remove(), durationMs);
  }
}
