import { describe, it, expect } from 'vitest';
import { summarizeSetProgress, pickNextSet } from '../lib/progress';
import type { PracticeSet, AttemptState } from '../lib/types';

describe('Progress Helpers', () => {
  describe('summarizeSetProgress', () => {
    it('handles empty attempts (not started)', () => {
      const set = { id: 's1', skill: 'reading', title: 'S1', estimatedMin: 10, itemIds: ['i1', 'i2'], status: 'published' } as PracticeSet;
      const attempts: Record<string, AttemptState> = {};
      const prog = summarizeSetProgress(set, attempts);
      expect(prog).toEqual({ total: 2, answered: 0, correct: 0, isMcqSet: true, status: 'not-started' });
    });

    it('handles partial progress', () => {
      const set = { id: 's1', skill: 'listening', title: 'S1', estimatedMin: 10, itemIds: ['i1', 'i2'], status: 'published' } as PracticeSet;
      const attempts: Record<string, AttemptState> = {
        i1: { itemId: 'i1', kind: 'listening', correct: true, attemptCount: 1, lastAttemptedAt: 1 } as AttemptState
      };
      const prog = summarizeSetProgress(set, attempts);
      expect(prog).toEqual({ total: 2, answered: 1, correct: 1, isMcqSet: true, status: 'in-progress' });
    });

    it('handles done status with correct count', () => {
      const set = { id: 's1', skill: 'reading', title: 'S1', estimatedMin: 10, itemIds: ['i1', 'i2'], status: 'published' } as PracticeSet;
      const attempts: Record<string, AttemptState> = {
        i1: { itemId: 'i1', kind: 'reading', correct: true, attemptCount: 1, lastAttemptedAt: 1 } as AttemptState,
        i2: { itemId: 'i2', kind: 'reading', correct: false, attemptCount: 1, lastAttemptedAt: 1 } as AttemptState
      };
      const prog = summarizeSetProgress(set, attempts);
      expect(prog).toEqual({ total: 2, answered: 2, correct: 1, isMcqSet: true, status: 'done' });
    });

    it('ignores draft for open attempts (not completed)', () => {
      const set = { id: 's1', skill: 'writing', title: 'S1', estimatedMin: 10, itemIds: ['i1'], status: 'published' } as PracticeSet;
      const attempts: Record<string, AttemptState> = {
        i1: { itemId: 'i1', kind: 'open', completed: false, flagged: false, attemptCount: 1, lastAttemptedAt: 1 } as AttemptState
      };
      const prog = summarizeSetProgress(set, attempts);
      expect(prog).toEqual({ total: 1, answered: 0, correct: 0, isMcqSet: false, status: 'not-started' });
    });

    it('counts completed open attempts', () => {
      const set = { id: 's1', skill: 'writing', title: 'S1', estimatedMin: 10, itemIds: ['i1'], status: 'published' } as PracticeSet;
      const attempts: Record<string, AttemptState> = {
        i1: { itemId: 'i1', kind: 'open', completed: true, flagged: false, attemptCount: 1, lastAttemptedAt: 1, selfScore: 2 } as AttemptState
      };
      const prog = summarizeSetProgress(set, attempts);
      expect(prog).toEqual({ total: 1, answered: 1, correct: 0, isMcqSet: false, status: 'done' });
    });

    it('ignores wrong attempt kinds', () => {
      const set = { id: 's1', skill: 'reading', title: 'S1', estimatedMin: 10, itemIds: ['i1'], status: 'published' } as PracticeSet;
      const attempts: Record<string, AttemptState> = {
        i1: { itemId: 'i1', kind: 'listening', correct: true, attemptCount: 1, lastAttemptedAt: 1 } as AttemptState
      };
      const prog = summarizeSetProgress(set, attempts);
      expect(prog).toEqual({ total: 1, answered: 0, correct: 0, isMcqSet: true, status: 'not-started' });
    });

    it('handles mixed sets generally', () => {
      const set = { id: 's1', skill: 'mixed', title: 'S1', estimatedMin: 10, itemIds: ['i1', 'i2'], status: 'published' } as unknown as PracticeSet;
      const attempts: Record<string, AttemptState> = {
        i1: { itemId: 'i1', kind: 'reading', correct: true, attemptCount: 1, lastAttemptedAt: 1 } as AttemptState,
        i2: { itemId: 'i2', kind: 'open', completed: true, flagged: false, attemptCount: 1, lastAttemptedAt: 1, selfScore: 2 } as AttemptState
      };
      const prog = summarizeSetProgress(set, attempts);
      expect(prog).toEqual({ total: 2, answered: 2, correct: 1, isMcqSet: false, status: 'done' });
    });
  });

  describe('pickNextSet', () => {
    const sets: PracticeSet[] = [
      { id: 'r1', skill: 'reading', title: 'R1', estimatedMin: 10, itemIds: ['i1'], status: 'published' } as PracticeSet,
      { id: 'r2', skill: 'reading', title: 'R2', estimatedMin: 10, itemIds: ['i2'], status: 'published' } as PracticeSet,
      { id: 'r3', skill: 'reading', title: 'R3', estimatedMin: 10, itemIds: ['i3'], status: 'published' } as PracticeSet,
      { id: 'l1', skill: 'listening', title: 'L1', estimatedMin: 10, itemIds: ['i4'], status: 'published' } as PracticeSet,
    ];

    it('finds next set in same skill', () => {
      const attempts: Record<string, AttemptState> = {};
      expect(pickNextSet('r1', sets, attempts)?.id).toBe('r2');
    });

    it('loops to beginning of same skill if end is reached', () => {
      const attempts: Record<string, AttemptState> = {
        i3: { itemId: 'i3', kind: 'reading', correct: true, attemptCount: 1, lastAttemptedAt: 1 } as AttemptState // r3 done
      };
      expect(pickNextSet('r3', sets, attempts)?.id).toBe('r1');
    });

    it('skips done sets when looping', () => {
      const attempts: Record<string, AttemptState> = {
        i1: { itemId: 'i1', kind: 'reading', correct: true, attemptCount: 1, lastAttemptedAt: 1 } as AttemptState // r1 done
      };
      expect(pickNextSet('r3', sets, attempts)?.id).toBe('r2');
    });

    it('falls back to different skill if all same skill sets are done', () => {
      const attempts: Record<string, AttemptState> = {
        i1: { itemId: 'i1', kind: 'reading', correct: true, attemptCount: 1, lastAttemptedAt: 1 } as AttemptState,
        i2: { itemId: 'i2', kind: 'reading', correct: true, attemptCount: 1, lastAttemptedAt: 1 } as AttemptState,
        i3: { itemId: 'i3', kind: 'reading', correct: true, attemptCount: 1, lastAttemptedAt: 1 } as AttemptState
      };
      expect(pickNextSet('r2', sets, attempts)?.id).toBe('l1');
    });

    it('returns undefined if all sets are done', () => {
      const attempts: Record<string, AttemptState> = {
        i1: { itemId: 'i1', kind: 'reading', correct: true, attemptCount: 1, lastAttemptedAt: 1 } as AttemptState,
        i2: { itemId: 'i2', kind: 'reading', correct: true, attemptCount: 1, lastAttemptedAt: 1 } as AttemptState,
        i3: { itemId: 'i3', kind: 'reading', correct: true, attemptCount: 1, lastAttemptedAt: 1 } as AttemptState,
        i4: { itemId: 'i4', kind: 'listening', correct: true, attemptCount: 1, lastAttemptedAt: 1 } as AttemptState
      };
      expect(pickNextSet('r1', sets, attempts)).toBeUndefined();
    });

    it('returns undefined if current set is not found', () => {
      expect(pickNextSet('invalid', sets, {})).toBeUndefined();
    });

    it('uses catalog metadata instead of the caller array order', () => {
      const unordered = [
        { id: 'r3', skill: 'reading', mode: 'guided', task: 'tarea2', sequence: 1, title: 'R3', estimatedMin: 10, itemIds: ['i3'], status: 'published' },
        { id: 'r2', skill: 'reading', mode: 'guided', task: 'tarea1', sequence: 2, title: 'R2', estimatedMin: 10, itemIds: ['i2'], status: 'published' },
        { id: 'r1', skill: 'reading', mode: 'guided', task: 'tarea1', sequence: 1, title: 'R1', estimatedMin: 10, itemIds: ['i1'], status: 'published' },
      ] as PracticeSet[];

      expect(pickNextSet('r1', unordered, {})?.id).toBe('r2');
    });
  });
});

import { summarizeRate, RATE_MIN_ATTEMPTS } from '../lib/progress';

describe('summarizeRate', () => {
  it('returns an empty marker when nothing was attempted', () => {
    expect(summarizeRate(0, 0)).toEqual({ kind: 'empty', text: '–', pct: 0 });
  });

  it('shows a fraction below the minimum sample size', () => {
    const rate = summarizeRate(1, RATE_MIN_ATTEMPTS - 1);
    expect(rate.kind).toBe('sample');
    expect(rate.text).toBe(`1/${RATE_MIN_ATTEMPTS - 1} 정답`);
    expect(rate.pct).toBe(25);
  });

  it('shows a percentage at or above the minimum sample size', () => {
    expect(summarizeRate(3, RATE_MIN_ATTEMPTS)).toEqual({ kind: 'percent', text: '60%', pct: 60 });
    expect(summarizeRate(10, 10)).toEqual({ kind: 'percent', text: '100%', pct: 100 });
  });
});
