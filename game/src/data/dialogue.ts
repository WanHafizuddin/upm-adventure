import type { DialogueChoice, DialogueNode } from '../logic/dialogue';

// Every line of dialogue in the game, by node id. Speakers are fictional people at UPM Serdang.

const leave: DialogueChoice = { text: 'Leave', next: null };
const back = (node: string): DialogueChoice => ({ text: 'Ask something else', next: node });
const node = (n: DialogueNode): [string, DialogueNode] => [n.id, n];

// --- Day 1 -----------------------------------------------------------------------

const farahTopics: DialogueChoice[] = [
  { text: 'What was he like as a supervisor?', next: 'farah_supervisor' },
  { text: 'Where were you this evening?', next: 'farah_alibi' },
  { text: 'Ask about the torn note', next: 'farah_note', requiresClue: 'torn_note' },
  leave,
];

const danielTopics: DialogueChoice[] = [
  { text: 'Did you see Dr. Rosli tonight?', next: 'daniel_saw' },
  { text: 'Where were you this evening?', next: 'daniel_alibi' },
  { text: 'Ask about the access card', next: 'daniel_card', requiresClue: 'lab_access_card' },
  leave,
];

const priyaTopics: DialogueChoice[] = [
  { text: "Why didn't you get along?", next: 'priya_feud' },
  { text: 'When did you last see him?', next: 'priya_argument' },
  leave,
];

const day1: Array<[string, DialogueNode]> = [
  node({
    id: 'scene_look',
    speaker: 'You',
    text: 'Behind the tape, a steel coffee tumbler lies on its side by the fountain. The spilled coffee smells faintly bitter. Everyone in Fakulti Sains knew that tumbler: Dr. Rosli never went anywhere without it.',
    setsFlag: 'examined_scene',
    givesClue: 'coffee_tumbler',
    choices: [{ text: 'Step back', next: null }],
  }),

  node({
    id: 'farah_intro',
    speaker: 'Farah Idris',
    text: "I— sorry. I'm Farah. Dr. Rosli was my supervisor. I only came out when I heard the sirens. Ya Allah, I can't believe he's… ",
    setsFlag: 'met_farah',
    choices: farahTopics,
  }),
  node({ id: 'farah_more', speaker: 'Farah Idris', text: 'Is there something else?', choices: farahTopics }),
  node({
    id: 'farah_supervisor',
    speaker: 'Farah Idris',
    text: 'Demanding. Last week he called my results "impossible" and said he\'d go through every one of my samples himself. I thought he was going to end my PhD.',
    choices: [back('farah_more'), leave],
  }),
  node({
    id: 'farah_alibi',
    speaker: 'Farah Idris',
    text: "PSAS — the library. Level 3, the quiet zone, all evening. The librarian saw me; I borrowed two books right before closing, then I was going to walk back to KTDI.",
    givesClue: 'farah_alibi',
    choices: [back('farah_more'), leave],
  }),
  node({
    id: 'farah_note',
    speaker: 'Farah Idris',
    text: "...Okay. Fine. That note isn't what you think it is. He wanted to meet me at ten about my results. I never went. I was too scared of what he'd say.",
    setsFlag: 'farah_admits_note',
    choices: [back('farah_more'), leave],
  }),

  node({
    id: 'daniel_intro',
    speaker: 'Daniel Wong',
    text: "Daniel Wong, I manage the chemistry makmal. Terrible business. I've been in Lab 2 since eight — I can't leave my run for long, so make it quick.",
    setsFlag: 'met_daniel',
    choices: danielTopics,
  }),
  node({ id: 'daniel_more', speaker: 'Daniel Wong', text: 'Anything else?', choices: danielTopics }),
  node({
    id: 'daniel_saw',
    speaker: 'Daniel Wong',
    text: 'Around seven. He came by the stores asking about the inventory again. He was always auditing something.',
    choices: [back('daniel_more'), leave],
  }),
  node({
    id: 'daniel_alibi',
    speaker: 'Daniel Wong',
    text: "Lab 2, all night. It's an overnight run — I sign the logbook every half hour. Ten, ten-thirty, eleven. Check it if you like.",
    givesClue: 'daniel_alibi',
    choices: [back('daniel_more'), leave],
  }),
  node({
    id: 'daniel_card',
    speaker: 'Daniel Wong',
    text: "That's mine? Huh. I lost it days ago — I've been using the spare. Must have dropped it out here some time. Thanks.",
    setsFlag: 'daniel_claims_card_lost',
    choices: [back('daniel_more'), leave],
  }),

  node({
    id: 'priya_intro',
    speaker: 'Dr. Priya Nair',
    text: "Dr. Priya Nair. Yes, I knew him — fifteen years in the same department. You'll hear soon enough that we didn't get along, so you may as well hear it from me.",
    setsFlag: 'met_priya',
    choices: priyaTopics,
  }),
  node({ id: 'priya_more', speaker: 'Dr. Priya Nair', text: 'Go on.', choices: priyaTopics }),
  node({
    id: 'priya_feud',
    speaker: 'Dr. Priya Nair',
    text: 'He told the Dean I copied his grant proposal. It was the other way round. He was simply louder.',
    choices: [back('priya_more'), leave],
  }),
  node({
    id: 'priya_argument',
    speaker: 'Dr. Priya Nair',
    text: "Here, about half past nine. We argued — loudly, I'm afraid. Then I went up to my office for a video call with Melbourne. Ten until eleven.",
    givesClue: 'priya_argument',
    choices: [back('priya_more'), leave],
  }),
];

// --- Day 2 -----------------------------------------------------------------------

const limTopics: DialogueChoice[] = [
  { text: 'Was Farah Idris here last night?', next: 'lim_farah' },
  { text: 'Did you notice anything unusual?', next: 'lim_unusual' },
  leave,
];

const rahmanTopics: DialogueChoice[] = [
  { text: 'You found him?', next: 'rahman_found' },
  { text: 'Can I see last night’s faculty door records?', next: 'rahman_doors' },
  leave,
];

const aniTopics: DialogueChoice[] = [
  { text: 'Were you working last night?', next: 'ani_night' },
  { text: 'What was Dr. Rosli like?', next: 'ani_rosli' },
  leave,
];

const farah2Topics: DialogueChoice[] = [
  { text: 'Where were you that night?', next: 'farah2_alibi' },
  { text: 'Ask about your samples', next: 'farah2_samples' },
  { text: 'Ask about the note again', next: 'farah2_note', requiresClue: 'torn_note' },
  leave,
];

const daniel2Topics: DialogueChoice[] = [
  { text: 'Where were you that night?', next: 'daniel2_alibi' },
  { text: 'Ask about the door records', next: 'daniel2_doors', requiresClue: 'door_access_log' },
  { text: 'Ask about the pantry', next: 'daniel2_pantry', requiresClue: 'cleaner_statement' },
  leave,
];

const day2: Array<[string, DialogueNode]> = [
  // Puan Lim, librarian on night duty at PSAS.
  node({
    id: 'lim_intro',
    speaker: 'Puan Lim',
    text: "Selamat petang. I'm on the evening desk here at PSAS. Such terrible news about Dr. Rosli — the whole campus is talking. How can I help?",
    setsFlag: 'met_librarian',
    choices: limTopics,
  }),
  node({ id: 'lim_more', speaker: 'Puan Lim', text: 'Anything else, adik?', choices: limTopics }),
  node({
    id: 'lim_farah',
    speaker: 'Puan Lim',
    text: "Farah? She's here most nights, same table on Level 3. Let me check the gate system… Here. Her card went out through the gate at 10:55 pm, just before we closed.",
    givesClue: 'library_gate_log',
    choices: [back('lim_more'), leave],
  }),
  node({
    id: 'lim_unusual',
    speaker: 'Puan Lim',
    text: "Only the sirens. You can't see Fakulti Sains from the reading room, so nobody knew anything until the students started whispering.",
    choices: [back('lim_more'), leave],
  }),

  // Encik Rahman, campus security.
  node({
    id: 'rahman_intro',
    speaker: 'Encik Rahman',
    text: "Rahman, campus security. I'm the one who found him. Twenty years on this job — not a night I'll forget.",
    setsFlag: 'met_guard',
    choices: rahmanTopics,
  }),
  node({ id: 'rahman_more', speaker: 'Encik Rahman', text: 'Apa lagi?', choices: rahmanTopics }),
  node({
    id: 'rahman_found',
    speaker: 'Encik Rahman',
    text: 'Rounds at 10:40. He was by the fountain, already gone. Coffee spilled everywhere. I called it in straight away.',
    choices: [back('rahman_more'), leave],
  }),
  node({
    id: 'rahman_doors',
    speaker: 'Encik Rahman',
    text: "Students aren't supposed to see these… but fine, since you're helping. Every card that opens the faculty doors is logged. Here's last night — funny, Daniel Wong's old card shows up at 6:15.",
    givesClue: 'door_access_log',
    choices: [back('rahman_more'), leave],
  }),

  // Kak Ani, cleaner at Fakulti Sains.
  node({
    id: 'ani_intro',
    speaker: 'Kak Ani',
    text: "Assalamualaikum. Kak Ani, I clean this floor at night. Kesian Dr. Rosli… he always said thank you, you know. Not everyone does.",
    setsFlag: 'met_cleaner',
    choices: aniTopics,
  }),
  node({ id: 'ani_more', speaker: 'Kak Ani', text: 'Ada apa lagi, dik?', choices: aniTopics }),
  node({
    id: 'ani_night',
    speaker: 'Kak Ani',
    text: "Yes, until eleven. Around quarter to ten I was mopping by the pantri. Encik Daniel was inside, standing at the counter. There was a steel bottle by the kettle — Dr. Rosli's, I think.",
    givesClue: 'cleaner_statement',
    choices: [back('ani_more'), leave],
  }),
  node({
    id: 'ani_rosli',
    speaker: 'Kak Ani',
    text: 'Strict with the students, but fair. Every night he filled that tumbler at the pantri before going out to sit by the fountain.',
    choices: [back('ani_more'), leave],
  }),

  // Suspects on Day 2.
  node({
    id: 'farah2_intro',
    speaker: 'Farah Idris',
    text: "You again. I'm trying to work, but everyone keeps looking at me like I did it.",
    choices: farah2Topics,
  }),
  node({ id: 'farah2_more', speaker: 'Farah Idris', text: 'What else?', choices: farah2Topics }),
  node({
    id: 'farah2_alibi',
    speaker: 'Farah Idris',
    text: 'Same as I said last night. PSAS, Level 3, until closing. Then I walked back to KTDI.',
    givesClue: 'farah_alibi',
    choices: [back('farah2_more'), leave],
  }),
  node({
    id: 'farah2_samples',
    speaker: 'Farah Idris',
    text: 'Dr. Rosli thought someone was tampering with the stock in the stores. That\'s why my results looked wrong. He never said who.',
    setsFlag: 'heard_stock_tampering',
    choices: [back('farah2_more'), leave],
  }),
  node({
    id: 'farah2_note',
    speaker: 'Farah Idris',
    text: 'I told you, I never went. Ask Puan Lim at the desk — she can tell you exactly when I left.',
    choices: [back('farah2_more'), leave],
  }),

  node({
    id: 'daniel2_intro',
    speaker: 'Daniel Wong',
    text: "Busy. The police have been in and out of my makmal all day and my run is ruined.",
    choices: daniel2Topics,
  }),
  node({ id: 'daniel2_more', speaker: 'Daniel Wong', text: 'Make it quick.', choices: daniel2Topics }),
  node({
    id: 'daniel2_alibi',
    speaker: 'Daniel Wong',
    text: 'In Lab 2. All night. The logbook proves it — ten, ten-thirty, eleven.',
    givesClue: 'daniel_alibi',
    choices: [back('daniel2_more'), leave],
  }),
  node({
    id: 'daniel2_doors',
    speaker: 'Daniel Wong',
    text: '…Then someone used my old card. I told you, I lost it days ago. Maybe whoever found it.',
    setsFlag: 'daniel_doubles_down',
    choices: [back('daniel2_more'), leave],
  }),
  node({
    id: 'daniel2_pantry',
    speaker: 'Daniel Wong',
    text: 'I make teh tarik at the pantri every night. Is that a crime now?',
    choices: [back('daniel2_more'), leave],
  }),

  node({
    id: 'priya2_intro',
    speaker: 'Dr. Priya Nair',
    text: 'I have told the police everything. My call records are with IT if anyone cares to check. Now, if you will excuse me.',
    choices: [leave],
  }),

  // Things to look at.
  node({
    id: 'lab_door',
    speaker: 'You',
    text: 'MAKMAL 2. A sign on the door: "Eksperimen sedang berjalan — jangan ganggu." Experiment in progress, do not disturb. It\'s locked, and police tape crosses the handle.',
    choices: [{ text: 'Step back', next: null }],
  }),
];

export const DIALOGUE: Readonly<Record<string, DialogueNode>> = Object.fromEntries([...day1, ...day2]);
