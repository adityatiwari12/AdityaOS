export interface GitHubStreak {
  current: number;
  longest: number;
  total: number;
}

interface ContribDay {
  date: string;
  count: number;
}

/**
 * Fetches real GitHub contribution data (public, no auth) and computes the
 * current streak, longest streak, and total contributions for the last year.
 * Uses the open-source contributions API which scrapes the public profile.
 */
export async function fetchGitHubStreak(username: string): Promise<GitHubStreak | null> {
  try {
    const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`);
    if (!res.ok) return null;
    const data = await res.json();
    const days: ContribDay[] = data.contributions ?? [];
    if (!days.length) return null;

    // Only count days up to today (the API may include future days in the grid).
    const today = new Date().toISOString().slice(0, 10);
    const past = days.filter((d) => d.date <= today);

    let total = 0;
    let longest = 0;
    let running = 0;
    for (const d of past) {
      total += d.count;
      if (d.count > 0) {
        running += 1;
        longest = Math.max(longest, running);
      } else {
        running = 0;
      }
    }

    // Current streak: walk backwards from the most recent day. Today counting
    // as 0 doesn't break the streak (the day isn't over yet).
    let current = 0;
    for (let i = past.length - 1; i >= 0; i--) {
      if (past[i].count > 0) {
        current += 1;
      } else if (i === past.length - 1) {
        continue; // today has no contributions yet — keep going
      } else {
        break;
      }
    }

    return { current, longest, total };
  } catch {
    return null;
  }
}
