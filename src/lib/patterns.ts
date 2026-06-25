// Smart Patterns — rule-based correlation engine over the check-in history.
// Mirrors the web engine 1:1, but takes the store's logs array (mobile selectors
// are pure over arrays). Surfaces real findings ranked by effect strength.
import { scoreFor, type HealthLog } from "@/lib/store";

export type PatternIcon = "sleep" | "focus" | "trend" | "time" | "drink" | "water";

export interface Pattern {
  id: string;
  icon: PatternIcon;
  title: string;
  detail: string;
  strength: number; // 0-100
  positive: boolean;
}

const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

function split(
  logs: HealthLog[],
  cond: (l: HealthLog) => boolean,
  metric: (l: HealthLog) => number
) {
  const hi: number[] = [];
  const lo: number[] = [];
  for (const l of logs) (cond(l) ? hi : lo).push(metric(l));
  return { hi, lo, hiMean: mean(hi), loMean: mean(lo) };
}

export function getPatterns(logs: HealthLog[]): Pattern[] {
  const out: Pattern[] = [];

  // 1. Sleep → mood
  {
    const pop = logs.filter((l) => l.sleep > 0 && l.mood > 0);
    if (pop.length >= 4) {
      const { hi, lo, hiMean, loMean } = split(pop, (l) => l.sleep >= 7, (l) => l.mood);
      const d = hiMean - loMean;
      if (hi.length >= 2 && lo.length >= 2 && Math.abs(d) >= 0.6) {
        out.push({
          id: "sleep-mood",
          icon: "sleep",
          positive: d > 0,
          title: d > 0 ? "Sleep lifts your mood" : "Short sleep drags your mood",
          detail: `On 7h+ sleep your mood averages ${hiMean.toFixed(1)}/10 — vs ${loMean.toFixed(1)} on less.`,
          strength: clamp((Math.abs(d) / 4) * 100),
        });
      }
    }
  }

  // 2. Sleep → deep work
  {
    const pop = logs.filter((l) => l.sleep > 0);
    if (pop.length >= 4) {
      const { hi, lo, hiMean, loMean } = split(pop, (l) => l.sleep >= 7, (l) => l.deepWork || 0);
      const d = hiMean - loMean;
      if (hi.length >= 2 && lo.length >= 2 && d >= 0.4) {
        out.push({
          id: "sleep-focus",
          icon: "focus",
          positive: true,
          title: "Rested days are focused days",
          detail: `You log ${hiMean.toFixed(1)}h of deep work after 7h+ sleep — vs ${loMean.toFixed(1)}h on less.`,
          strength: clamp((d / 3) * 100),
        });
      }
    }
  }

  // 3. Deep work → life score
  {
    const pop = logs.filter((l) => scoreFor(l) > 0);
    if (pop.length >= 4) {
      const { hi, lo, hiMean, loMean } = split(pop, (l) => (l.deepWork || 0) >= 2, (l) => scoreFor(l));
      const d = hiMean - loMean;
      if (hi.length >= 2 && lo.length >= 2 && d >= 4) {
        out.push({
          id: "focus-score",
          icon: "trend",
          positive: true,
          title: "Deep work raises your whole day",
          detail: `Days with 2h+ deep work score ${Math.round(hiMean)} overall — vs ${Math.round(loMean)} without.`,
          strength: clamp((d / 30) * 100),
        });
      }
    }
  }

  // 4. Hydration → energy
  {
    const pop = logs.filter((l) => l.water > 0 && l.energy > 0);
    if (pop.length >= 4) {
      const { hi, lo, hiMean, loMean } = split(pop, (l) => l.water >= 2.5, (l) => l.energy);
      const d = hiMean - loMean;
      if (hi.length >= 2 && lo.length >= 2 && d >= 0.6) {
        out.push({
          id: "water-energy",
          icon: "water",
          positive: true,
          title: "Hydration tracks your energy",
          detail: `Well-hydrated days (2.5L+) average ${hiMean.toFixed(1)}/10 energy — vs ${loMean.toFixed(1)}.`,
          strength: clamp((d / 4) * 100),
        });
      }
    }
  }

  // 5. Alcohol → sleep quality
  {
    const pop = logs.filter((l) => (l.sleepQuality || 0) > 0 && l.alcohol !== undefined);
    if (pop.length >= 4) {
      const { hi, lo, hiMean, loMean } = split(pop, (l) => (l.alcohol || 0) > 0, (l) => l.sleepQuality || 0);
      const d = loMean - hiMean;
      if (hi.length >= 2 && lo.length >= 2 && d >= 0.6) {
        out.push({
          id: "alcohol-sleep",
          icon: "drink",
          positive: false,
          title: "Drinks cost you sleep quality",
          detail: `Sleep quality drops to ${hiMean.toFixed(1)}/10 on drinking days — vs ${loMean.toFixed(1)} sober.`,
          strength: clamp((d / 4) * 100),
        });
      }
    }
  }

  // 6. Best day of the week
  {
    const byDay: Record<number, number[]> = {};
    for (const l of logs) {
      const sc = scoreFor(l);
      if (sc > 0) {
        const wd = new Date(l.date + "T00:00:00").getDay();
        (byDay[wd] = byDay[wd] || []).push(sc);
      }
    }
    const days = Object.keys(byDay).filter((k) => byDay[+k].length >= 2);
    if (days.length >= 3) {
      let best = { wd: -1, m: 0 };
      for (const k of days) {
        const m = mean(byDay[+k]);
        if (m > best.m) best = { wd: +k, m };
      }
      const name = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][best.wd];
      out.push({
        id: "best-day",
        icon: "time",
        positive: true,
        title: `${name}s are your peak`,
        detail: `Your life score averages ${Math.round(best.m)} on ${name}s — your strongest day of the week.`,
        strength: clamp(best.m),
      });
    }
  }

  return out.sort((a, b) => b.strength - a.strength).slice(0, 5);
}
