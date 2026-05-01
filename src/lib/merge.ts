type ManualTalk = { title: string; youtube_id: string | null };
type FetchedTalk = { title: string; youtube_id: string | null };

export function titleSimilarity(a: string, b: string): number {
  const norm = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9 ]+/g, '').trim();
  const A = norm(a);
  const B = norm(b);
  if (!A || !B) return 0;
  if (A === B) return 1;
  const longer = A.length >= B.length ? A : B;
  const shorter = A.length >= B.length ? B : A;
  if (longer.includes(shorter)) {
    return Math.min(1, shorter.length / longer.length + 0.1);
  }
  // Levenshtein distance
  const m = longer.length;
  const n = shorter.length;
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = longer[i - 1] === shorter[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return 1 - dp[n] / longer.length;
}

export function shouldMergeYouTube<T extends ManualTalk>(
  manual: T[],
  fetched: FetchedTalk,
): T | null {
  if (fetched.youtube_id) {
    const byId = manual.find((m) => m.youtube_id === fetched.youtube_id);
    if (byId) return byId;
  }
  for (const m of manual) {
    if (titleSimilarity(m.title, fetched.title) > 0.8) return m;
  }
  return null;
}
