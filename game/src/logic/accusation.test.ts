import { describe, expect, it } from 'vitest';
import { judgeAccusation, type AccusationRules } from './accusation';

const rules: AccusationRules = {
  culprit: 'daniel',
  evidenceNeeded: 3,
  groups: [
    { name: 'opportunity', clues: ['door_access_log', 'presigned_logbook'] },
    { name: 'means', clues: ['toxicology_report', 'cleaner_statement'] },
    { name: 'motive', clues: ['audit_notes'] },
  ],
};

describe('judgeAccusation', () => {
  it('is not ready with fewer than three pieces of evidence', () => {
    expect(judgeAccusation('daniel', ['presigned_logbook', 'audit_notes'], rules).ending).toBe('not_ready');
  });

  it('calls out the wrong suspect even with perfect evidence', () => {
    expect(judgeAccusation('priya', ['presigned_logbook', 'toxicology_report', 'audit_notes'], rules).ending).toBe('wrong');
  });

  it('closes the case when the evidence covers opportunity, means and motive', () => {
    expect(judgeAccusation('daniel', ['presigned_logbook', 'toxicology_report', 'audit_notes'], rules)).toEqual({
      ending: 'true',
      missing: [],
    });
  });

  it('is unproven when the right suspect is named without covering every angle', () => {
    expect(judgeAccusation('daniel', ['presigned_logbook', 'door_access_log', 'cleaner_statement'], rules)).toEqual({
      ending: 'unproven',
      missing: ['motive'],
    });
  });

  it('does not count the same clue twice', () => {
    expect(judgeAccusation('daniel', ['audit_notes', 'audit_notes', 'presigned_logbook'], rules).ending).toBe('not_ready');
  });
});
