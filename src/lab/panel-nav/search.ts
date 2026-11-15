// A tiny client-side ranker over a static index built at build time.
// Every query word has to hit something; hits in the title count most.

export interface Entry {
  title: string;
  /** Short hand-lettered line under the title ("Project, 2024"). */
  sub: string;
  href: string;
  /** Extra searchable text that isn't shown (blurb, tags, event). */
  terms: string;
  /** Shown when the box is empty. */
  suggest?: boolean;
}

export interface Hit {
  entry: Entry;
  score: number;
  /** [start, end) ranges in the title to underline. */
  marks: Array<[number, number]>;
}

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

export function search(index: Entry[], query: string, limit = 6): Hit[] {
  const words = norm(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const hits: Hit[] = [];

  for (const entry of index) {
    const title = norm(entry.title);
    const rest = norm(`${entry.sub} ${entry.terms}`);
    let score = 0;
    const marks: Hit['marks'] = [];
    let ok = true;

    for (const w of words) {
      const at = title.indexOf(w);
      if (at === 0) score += 12;
      else if (at > 0 && /[\s\-:]/.test(title[at - 1])) score += 8;
      else if (at > 0) score += 4;
      else if (rest.includes(w)) score += 2;
      else {
        const sub = subsequence(title, w);
        if (sub && w.length > 2) {
          score += 1;
          marks.push(...sub);
          continue;
        }
        ok = false;
        break;
      }
      if (at >= 0) marks.push([at, at + w.length]);
    }
    if (ok) hits.push({ entry, score: score - title.length / 200, marks: merge(marks) });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Loose match: the letters of w appear in order in s. */
function subsequence(s: string, w: string): Array<[number, number]> | null {
  const out: Array<[number, number]> = [];
  let i = 0;
  for (const ch of w) {
    i = s.indexOf(ch, i);
    if (i < 0) return null;
    out.push([i, i + 1]);
    i++;
  }
  return out;
}

function merge(ranges: Array<[number, number]>) {
  const sorted = ranges.sort((a, b) => a[0] - b[0]);
  const out: Array<[number, number]> = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else out.push([...r]);
  }
  return out;
}
