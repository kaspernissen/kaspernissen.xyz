import { describe, it, expect } from 'vitest';
import { isListed } from './engagement';

const now = new Date('2026-10-21T12:00:00Z');
const talk = (date: string, extra: Record<string, unknown> = {}) => ({
  data: { date: new Date(date), ...extra },
});

describe('isListed', () => {
  it('lists a delivered talk, deck or not', () => {
    expect(isListed(talk('2026-10-01'), now)).toBe(true);
  });

  it('keeps an upcoming talk without a deck off the list', () => {
    expect(isListed(talk('2026-10-22'), now)).toBe(false);
  });

  it('lists an upcoming talk once its deck is up', () => {
    // The deck's QR code points at the talk page before the talk is given.
    expect(isListed(talk('2026-10-22', { deck_file: 'x.pdf' }), now)).toBe(true);
  });

  it('never lists a cancelled talk, even with a deck', () => {
    expect(isListed(talk('2026-10-22', { deck_file: 'x.pdf', status: 'cancelled' }), now)).toBe(false);
  });
});
