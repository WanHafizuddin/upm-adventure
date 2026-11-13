import type { Objective } from '../logic/days';
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
  /** What finishes the day, in the words shown on the HUD's checklist. */
  objectives: readonly Objective[];
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
    objectives: [
      { flag: 'met_farah', text: 'Talk to Farah' },
      { flag: 'met_daniel', text: 'Talk to Daniel' },
      { flag: 'met_priya', text: 'Talk to Dr. Priya' },
      { flag: 'examined_scene', text: 'Examine the crime scene' },
      { flag: 'linked_tumbler_to_victim', text: 'Board (Tab): work out how Dr. Rosli died' },
    ],
    hint: 'Talk to everyone in the courtyard, examine the scene, and work out how Dr. Rosli died.',
    start: COURTYARD_START,
  },
  {
    day: 2,
    subtitle: 'The next evening',
    time: 'Evening',
    objectives: [
      { flag: 'met_librarian', text: 'Talk to the librarian at PSAS (west path)' },
      { flag: 'met_guard', text: 'Talk to the guard at the security office (east path)' },
      { flag: 'met_cleaner', text: 'Talk to the cleaner inside Fakulti Sains' },
      { flag: 'farah_cleared', text: "Board (Tab): check Farah's alibi against the library's records" },
    ],
    hint: "The library, the security office and the faculty are open again. Check everyone's story.",
    start: COURTYARD_START,
  },
  {
    day: 3,
    subtitle: 'The third evening',
    time: 'Evening',
    objectives: [
      { flag: 'examined_logbook', text: 'Read the logbook in Makmal 2 (inside Fakulti Sains)' },
      { flag: 'examined_rosli_office', text: "Search Dr. Rosli's office (Fakulti Sains, upstairs)" },
      { flag: 'checked_priya_call', text: 'Ask Dr. Priya about her video call (upstairs)' },
      { flag: 'daniel_alibi_broken', text: "Board (Tab): test Daniel's alibi against the logbook" },
      { flag: 'priya_cleared', text: "Board (Tab): check Priya's story against her call record" },
    ],
    hint: 'Makmal 2 and the upstairs offices are open again. Somebody has been lying. Find out who.',
    start: COURTYARD_START,
  },
];

export const DAY_GOALS: Readonly<Record<number, readonly string[]>> = Object.fromEntries(
  DAYS.map((d) => [d.day, d.objectives.map((o) => o.flag)]),
);

export const LAST_DAY = DAYS[DAYS.length - 1].day;

export function daySpec(day: number): DaySpec | undefined {
  return DAYS.find((d) => d.day === day);
}
