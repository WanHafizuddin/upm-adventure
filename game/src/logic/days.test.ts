import { describe, expect, it } from 'vitest';
import { availableOn, checklist } from './days';
import { Flags } from './flags';

describe('availableOn', () => {
  it('treats things with no day list as available every day', () => {
    expect(availableOn({}, 1)).toBe(true);
    expect(availableOn({}, 4)).toBe(true);
  });

  it('only offers things on the days they list', () => {
    expect(availableOn({ days: [2] }, 1)).toBe(false);
    expect(availableOn({ days: [2] }, 2)).toBe(true);
    expect(availableOn({ days: [1, 2] }, 3)).toBe(false);
  });
});

describe('checklist', () => {
  const objectives = [
    { flag: 'met_librarian', text: 'Talk to the librarian at PSAS' },
    { flag: 'farah_cleared', text: "Check Farah's alibi on the board" },
  ];

  it('lists every objective, unticked at the start', () => {
    expect(checklist(objectives, new Flags())).toEqual([
      { text: 'Talk to the librarian at PSAS', done: false },
      { text: "Check Farah's alibi on the board", done: false },
    ]);
  });

  it('ticks off objectives whose flag is set', () => {
    const flags = new Flags();
    flags.set('farah_cleared');
    expect(checklist(objectives, flags).map((o) => o.done)).toEqual([false, true]);
  });
});
