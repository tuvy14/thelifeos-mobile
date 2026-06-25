// "Your Week" recap — a Wrapped-style snapshot of the last 7 days, computed from
// the store data. Mirrors the web engine; takes the store arrays (mobile pure).
import {
  scoreFor,
  habitStreak,
  xpFor,
  levelFor,
  XP_PER_CHECKIN,
  XP_PER_WIN,
  type HealthLog,
  type Win,
  type Habit,
  type HabitLog,
} from "@/lib/store";

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export interface WeeklyRecap {
  rangeLabel: string;
  checkins: number;
  avgScore: number;
  scoreDelta: number;
  wins: number;
  topWin?: string;
  deepWork: number;
  topHabit?: { name: string; emoji: string; streak: number };
  xpGained: number;
  bestDay?: { label: string; score: number };
  level: number;
  levelName: string;
  hasData: boolean;
}

const avg = (nums: number[]) => {
  const live = nums.filter((n) => n > 0);
  return live.length ? Math.round(live.reduce((a, b) => a + b, 0) / live.length) : 0;
};

export function getWeeklyRecap(s: {
  logs: HealthLog[];
  wins: Win[];
  habits: Habit[];
  habitLog: HabitLog;
}): WeeklyRecap {
  const today = new Date();
  const day = (off: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - off);
    return ymd(d);
  };
  const last7 = Array.from({ length: 7 }, (_, i) => day(6 - i));
  const prev7 = Array.from({ length: 7 }, (_, i) => day(13 - i));
  const set7 = new Set(last7);

  const byDate = new Map(s.logs.map((l) => [l.date, l]));
  const scores7 = last7.map((d) => scoreFor(byDate.get(d)));
  const scoresPrev = prev7.map((d) => scoreFor(byDate.get(d)));

  const checkins = last7.filter((d) => byDate.has(d)).length;
  const avgScore = avg(scores7);
  const scoreDelta = avgScore - avg(scoresPrev);

  const winsThisWeek = s.wins.filter((w) => set7.has(w.date));
  const deepWork = Math.round(last7.reduce((sum, d) => sum + (byDate.get(d)?.deepWork || 0), 0));

  let topHabit: WeeklyRecap["topHabit"];
  for (const h of s.habits) {
    const streak = habitStreak(s.habitLog, h.id);
    if (streak > 0 && (!topHabit || streak > topHabit.streak)) {
      topHabit = { name: h.name, emoji: h.emoji, streak };
    }
  }

  let bestDay: WeeklyRecap["bestDay"];
  scores7.forEach((score, i) => {
    if (score > 0 && (!bestDay || score > bestDay.score)) {
      bestDay = {
        label: new Date(last7[i] + "T00:00:00").toLocaleDateString(undefined, { weekday: "long" }),
        score,
      };
    }
  });

  const xpGained = checkins * XP_PER_CHECKIN + winsThisWeek.length * XP_PER_WIN;
  const lvl = levelFor(xpFor(s.logs, s.wins));
  const fmt = (str: string) =>
    new Date(str + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return {
    rangeLabel: `${fmt(last7[0])} – ${fmt(last7[6])}`,
    checkins,
    avgScore,
    scoreDelta,
    wins: winsThisWeek.length,
    topWin: winsThisWeek[0]?.text,
    deepWork,
    topHabit,
    xpGained,
    bestDay,
    level: lvl.level,
    levelName: lvl.name,
    hasData: checkins > 0 || winsThisWeek.length > 0,
  };
}
