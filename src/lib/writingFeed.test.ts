import { describe, expect, it } from 'vitest';
import { writingFeed } from './writingFeed';

const linked = (url: string, date: string) => ({ data: { url, date: new Date(date) } });
const post = (date: string, canonical: string | null = null) => ({
  data: { date: new Date(date), canonical },
});

describe('writingFeed', () => {
  it('interleaves posts and linked writing newest first', () => {
    const older = linked('https://example.com/a', '2026-08-01');
    const newer = linked('https://example.com/b', '2026-09-20');
    const mine = post('2026-09-25');
    expect(writingFeed([older, newer], [mine])).toEqual([
      { type: 'post', entry: mine },
      { type: 'writing', entry: newer },
      { type: 'writing', entry: older },
    ]);
  });

  it('drops a cross-post whose original is already listed', () => {
    const original = linked('https://www.dash0.com/blog/rails-moment', '2026-08-14');
    const copy = post('2026-08-14', 'https://www.dash0.com/blog/rails-moment/');
    expect(writingFeed([original], [copy])).toEqual([{ type: 'writing', entry: original }]);
  });

  it('keeps a backfilled post whose original is not listed', () => {
    const backfill = post('2017-01-30', 'https://medium.com/kubecloud/kops-ha');
    expect(writingFeed([], [backfill])).toEqual([{ type: 'post', entry: backfill }]);
  });
});
