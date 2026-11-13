import type { Facing } from '../logic/movement';

/** Where and how the player appears in a location. */
export interface Spawn {
  location: string;
  x: number;
  y: number;
  facing: Facing;
}

export interface DaySpec {
  day: number;
  /** Shown on the title card under "Day N". */
  subtitle: string;
  time: 'Night' | 'Evening';
  /** Flags that finish the day. */
  goals: readonly string[];
  /** One line on the title card telling the player what today is about. */
  hint: string;
  start: Spawn;
}

// A little away from the "Head back to KTDI" exit, so it isn't the first prompt you see.
const COURTYARD_START: Spawn = { location: 'courtyard', x: 384, y: 508, facing: 'up' };

export const DAYS: readonly DaySpec[] = [
  {
    day: 1,
    subtitle: 'The night it happened',
    time: 'Night',
    goals: ['met_farah', 'met_daniel', 'met_priya', 'examined_scene', 'linked_tumbler_to_victim'],
    hint: 'Talk to everyone in the courtyard, examine the scene, and work out how Dr. Rosli died.',
    start: COURTYARD_START,
  },
  {
    day: 2,
    subtitle: 'The next evening',
    time: 'Evening',
    goals: ['met_librarian', 'met_guard', 'met_cleaner', 'farah_cleared'],
    hint: "The library, the security office and the faculty are open again. Check everyone's story.",
    start: COURTYARD_START,
  },
];

export const DAY_GOALS: Readonly<Record<number, readonly string[]>> = Object.fromEntries(DAYS.map((d) => [d.day, d.goals]));

export const LAST_DAY = DAYS[DAYS.length - 1].day;

export function daySpec(day: number): DaySpec | undefined {
  return DAYS.find((d) => d.day === day);
}
