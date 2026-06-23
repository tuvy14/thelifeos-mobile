import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/* ════════════════════════════════════════════════════════════════════════
   Local-first store — mirrors the web app's data model 1:1 (same keys + shapes)
   so the SAME Supabase account syncs losslessly between web and mobile.
   ════════════════════════════════════════════════════════════════════════ */

/* ── Types ── */
export interface HealthLog {
  date: string;
  sleep: number;
  water: number;
  mood: number; // 1-10
  energy: number; // 1-10
  rituals: string[];
  deepWork: number; // hours
  steps?: number;
  screenTime?: number;
  nutrition?: number;
  intention?: string;
  gratitude?: string;
  weight?: number;
  restingHR?: number;
  sleepQuality?: number;
  caffeine?: number;
  alcohol?: number;
  tasksDone?: number;
  outdoors?: number;
  meditation?: number;
  stress?: number;
  social?: number;
  productivity?: number;
  highlight?: string;
  improve?: string;
}
export interface Win { id: string; text: string; date: string; ts: number }
export interface RevenueEntry {
  id: string; amount: number; note: string; date: string; ts: number;
  category?: string; recurring?: boolean;
}
export interface Expense {
  id: string; amount: number; note: string; date: string; ts: number; category?: string;
}
export interface Habit { id: string; name: string; emoji: string; createdAt: number }
export type HabitLog = Record<string, string[]>; // date -> habit ids done
export interface Goal {
  id: string; title: string; category: string; current: number; target: number;
  unit: string; createdAt: number;
}
export interface JournalEntry { id: string; text: string; date: string; ts: number }
export interface Workout {
  id: string; type: string; duration: number; note: string; date: string; ts: number;
}
export type EventPriority = "low" | "medium" | "high";
export interface CalendarEvent {
  id: string; title: string; date: string; priority: EventPriority; done?: boolean;
}
export interface Referral {
  id: string; name: string; status: "invited" | "subscribed"; joined: string; monthlyEarn: number;
}
export interface Profile {
  name?: string; focuses: string[]; challenge?: string; dailyTime?: string;
  level?: string; rhythm?: string; onboardedAt: number;
}

/* ── Constants (mirror web) ── */
export const RITUALS = [
  { id: "cold_shower", label: "Cold shower", emoji: "🧊" },
  { id: "sunlight", label: "Sunlight", emoji: "☀️" },
  { id: "no_phone", label: "No phone 30m", emoji: "📵" },
  { id: "read", label: "Read", emoji: "📖" },
  { id: "walk", label: "Walk", emoji: "🚶" },
  { id: "meditate", label: "Meditate", emoji: "🧘" },
];
export const HABIT_EMOJIS = ["🔥", "📖", "🏃", "🧘", "💧", "🥗", "💤", "✍️", "🎯", "🌱", "💪", "🎨"];
export const REVENUE_CATEGORIES = ["Client work", "Product", "Affiliate", "Sponsorship", "Content", "Other"];
export const EXPENSE_CATEGORIES = ["Software", "Ads", "Contractors", "Equipment", "Fees", "Other"];

export const REFERRAL_PERCENT = 25;
export const REFERRAL_MONTHLY = 5;
export const REFERRAL_DISCOUNT = 5;

export interface FocusArea {
  id: string;
  label: string;
  description: string;
  views: string[];
  seedGoals: { title: string; category: string; target: number; unit: string }[];
}
export const FOCUS_AREAS: FocusArea[] = [
  { id: "fitness", label: "Get fit & healthy", description: "Workouts, sleep, nutrition", views: ["fitness", "checkin"], seedGoals: [
    { title: "Work out 4× a week", category: "Fitness", target: 4, unit: "/wk" },
    { title: "Sleep 8 hours a night", category: "Health", target: 8, unit: "hrs" }] },
  { id: "focus", label: "Focus & productivity", description: "Deep work, fewer distractions", views: ["focus", "habits"], seedGoals: [
    { title: "2 hours of deep work daily", category: "Focus", target: 2, unit: "hrs" }] },
  { id: "business", label: "Build a business", description: "Revenue, clients, MRR", views: ["money", "goals"], seedGoals: [
    { title: "Reach $5k monthly revenue", category: "Business", target: 5000, unit: "$" }] },
  { id: "creator", label: "Grow as a creator", description: "Content, audience, reach", views: ["wins", "journal"], seedGoals: [
    { title: "Post content daily", category: "Content", target: 30, unit: "posts" }] },
  { id: "money", label: "Master my money", description: "Earn more, spend less", views: ["money"], seedGoals: [
    { title: "Save $5,000", category: "Money", target: 5000, unit: "$" }] },
  { id: "mind", label: "Mental wellness", description: "Calm, journaling, gratitude", views: ["journal", "checkin"], seedGoals: [
    { title: "Journal every day", category: "Mind", target: 30, unit: "days" },
    { title: "Meditate 10 min daily", category: "Mind", target: 10, unit: "min" }] },
  { id: "habits", label: "Build better habits", description: "Streaks that actually stick", views: ["habits", "goals"], seedGoals: [
    { title: "Hit a 30-day streak", category: "Habits", target: 30, unit: "days" }] },
  { id: "learn", label: "Learn & grow", description: "Read, study, level up", views: ["habits", "journal"], seedGoals: [
    { title: "Read 20 pages a day", category: "Learning", target: 20, unit: "pages" }] },
];

// Rituals tailored to each focus mode — shown on the check-in.
export const FOCUS_RITUALS: Record<string, { id: string; label: string; emoji: string }[]> = {
  fitness: [
    { id: "fit_workout", label: "Workout", emoji: "🏋️" },
    { id: "fit_stretch", label: "Stretch", emoji: "🧘" },
    { id: "fit_protein", label: "Hit protein", emoji: "🥩" },
    { id: "fit_steps", label: "10k steps", emoji: "🚶" },
    { id: "fit_sleep", label: "8h sleep", emoji: "😴" },
  ],
  focus: [
    { id: "foc_deep", label: "Deep-work block", emoji: "🎯" },
    { id: "foc_nophone", label: "No phone AM", emoji: "📵" },
    { id: "foc_top3", label: "Plan top 3", emoji: "✅" },
    { id: "foc_single", label: "Single-task", emoji: "🧠" },
  ],
  business: [
    { id: "biz_outreach", label: "Outreach", emoji: "📧" },
    { id: "biz_ship", label: "Ship something", emoji: "🚀" },
    { id: "biz_numbers", label: "Check numbers", emoji: "📊" },
    { id: "biz_followup", label: "Follow up", emoji: "🤝" },
  ],
  creator: [
    { id: "cre_post", label: "Post content", emoji: "🎬" },
    { id: "cre_engage", label: "Engage 30m", emoji: "💬" },
    { id: "cre_idea", label: "Capture idea", emoji: "💡" },
    { id: "cre_film", label: "Film B-roll", emoji: "📹" },
  ],
  money: [
    { id: "mon_track", label: "Track spend", emoji: "🧾" },
    { id: "mon_noimpulse", label: "No impulse buy", emoji: "🛑" },
    { id: "mon_income", label: "Income task", emoji: "💸" },
  ],
  mind: [
    { id: "min_meditate", label: "Meditate", emoji: "🧘" },
    { id: "min_journal", label: "Journal", emoji: "📓" },
    { id: "min_grateful", label: "Gratitude", emoji: "🙏" },
    { id: "min_sun", label: "Sunlight", emoji: "☀️" },
    { id: "min_nodoom", label: "No doomscroll", emoji: "📵" },
  ],
  habits: [
    { id: "hab_cold", label: "Cold shower", emoji: "🧊" },
    { id: "hab_bed", label: "Make bed", emoji: "🛏️" },
    { id: "hab_read", label: "Read", emoji: "📖" },
    { id: "hab_water", label: "Hydrate", emoji: "💧" },
  ],
  learn: [
    { id: "lea_read", label: "Read 20 pages", emoji: "📚" },
    { id: "lea_study", label: "Study 30m", emoji: "🎓" },
    { id: "lea_notes", label: "Take notes", emoji: "✍️" },
    { id: "lea_practice", label: "Practice", emoji: "🔁" },
  ],
};
export const activeMode = (mode: string, profile: Profile | null) =>
  mode || profile?.focuses?.[0] || "habits";

/* ── Date helpers (local, not UTC) ── */
const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const today = () => ymd(new Date());
const addDays = (d: string, n: number) => {
  const date = new Date(d + "T00:00:00");
  date.setDate(date.getDate() + n);
  return ymd(date);
};
export function lastNDays(n: number): string[] {
  const out: string[] = [];
  let d = today();
  for (let i = 0; i < n; i++) { out.unshift(d); d = addDays(d, -1); }
  return out;
}

/* ── Life score (0-100) ── */
export function scoreFor(log?: HealthLog): number {
  if (!log) return 0;
  let s = 0;
  s += Math.min(log.sleep / 8, 1) * 30;
  s += Math.min(log.water / 3, 1) * 15;
  s += (Math.max(0, Math.min(log.mood, 10)) / 10) * 20;
  s += (Math.max(0, Math.min(log.energy, 10)) / 10) * 15;
  s += Math.min(log.deepWork / 4, 1) * 10;
  s += Math.min((log.rituals?.length || 0) / 4, 1) * 10;
  return Math.round(s);
}

const uid = () => String(Date.now()) + Math.random().toString(36).slice(2, 8);

/* ── Storage keys (web "short" keys → AsyncStorage as lifeos_<key>) ── */
const PREFIX = "lifeos_";
const K = {
  logs: "health_logs", wins: "wins", revenue: "revenue", expenses: "expenses",
  moneyGoal: "money_goal", habits: "habits", habitLog: "habit_log", goals: "goals",
  journal: "journal", workouts: "workouts", calendar: "calendar", profile: "profile",
  mode: "mode", referrals: "referrals", refCode: "ref_code", celebratedStreak: "celebratedStreak",
} as const;
const ALL_KEYS = Object.values(K);
const sk = (short: string) => PREFIX + short;
const persist = (short: string, value: unknown) =>
  AsyncStorage.setItem(sk(short), JSON.stringify(value)).catch(() => {});

interface Store {
  ready: boolean;
  // data
  logs: HealthLog[];
  wins: Win[];
  revenue: RevenueEntry[];
  expenses: Expense[];
  moneyGoal: number;
  habits: Habit[];
  habitLog: HabitLog;
  goals: Goal[];
  journal: JournalEntry[];
  workouts: Workout[];
  calendar: CalendarEvent[];
  profile: Profile | null;
  mode: string;
  referrals: Referral[];
  refCode: string;
  // check-ins / wins
  saveCheckin: (data: Omit<HealthLog, "date">) => void;
  addWin: (text: string) => void;
  deleteWin: (id: string) => void;
  // money
  addRevenue: (amount: number, note: string, category?: string, recurring?: boolean) => void;
  deleteRevenue: (id: string) => void;
  addExpense: (amount: number, note: string, category?: string) => void;
  deleteExpense: (id: string) => void;
  setMoneyGoal: (n: number) => void;
  // habits
  addHabit: (name: string, emoji: string) => void;
  deleteHabit: (id: string) => void;
  toggleHabit: (id: string, date?: string) => void;
  // goals
  addGoal: (g: Omit<Goal, "id" | "createdAt">) => void;
  setGoalProgress: (id: string, current: number) => void;
  deleteGoal: (id: string) => void;
  // journal
  addJournal: (text: string) => void;
  deleteJournal: (id: string) => void;
  // fitness
  addWorkout: (type: string, duration: number, note: string) => void;
  deleteWorkout: (id: string) => void;
  // focus
  addFocusMinutes: (mins: number) => void;
  // calendar
  addCalendarEvent: (title: string, date: string, priority: EventPriority) => void;
  toggleCalendarEvent: (id: string) => void;
  removeCalendarEvent: (id: string) => void;
  // referrals
  ensureRefCode: () => void;
  addReferral: (name: string) => void;
  // onboarding / mode
  setActiveMode: (id: string) => void;
  completeOnboarding: (name: string, focusIds: string[], extras?: Partial<Pick<Profile, "challenge" | "dailyTime" | "level" | "rhythm">>) => void;
  resetOnboarding: () => void;
  // sync bridge + utility
  exportRaw: () => Record<string, string>;
  importRaw: (data: Record<string, string>) => void;
  resetAll: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [wins, setWins] = useState<Win[]>([]);
  const [revenue, setRevenue] = useState<RevenueEntry[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [moneyGoal, setMoneyGoalState] = useState<number>(0);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLog, setHabitLog] = useState<HabitLog>({});
  const [goals, setGoals] = useState<Goal[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [calendar, setCalendar] = useState<CalendarEvent[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mode, setMode] = useState<string>("");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [refCode, setRefCode] = useState<string>("");

  // Hydrate once.
  useEffect(() => {
    (async () => {
      try {
        const pairs = await AsyncStorage.multiGet(ALL_KEYS.map(sk));
        const m = Object.fromEntries(pairs.map(([k, v]) => [k, v]));
        const get = <T,>(short: string, fb: T): T => {
          const v = m[sk(short)];
          if (v == null) return fb;
          try { return JSON.parse(v) as T; } catch { return fb; }
        };
        setLogs(get(K.logs, []));
        setWins(get(K.wins, []));
        setRevenue(get(K.revenue, []));
        setExpenses(get(K.expenses, []));
        setMoneyGoalState(get(K.moneyGoal, 0));
        setHabits(get(K.habits, []));
        setHabitLog(get(K.habitLog, {}));
        setGoals(get(K.goals, []));
        setJournal(get(K.journal, []));
        setWorkouts(get(K.workouts, []));
        setCalendar(get(K.calendar, []));
        setProfile(get(K.profile, null));
        setMode(get(K.mode, ""));
        setReferrals(get(K.referrals, []));
        setRefCode(get(K.refCode, ""));
      } catch {
        /* start empty */
      } finally {
        setReady(true);
      }
    })();
  }, []);

  /* ── check-ins ── */
  const saveCheckin = useCallback((data: Omit<HealthLog, "date">) => {
    setLogs((cur) => {
      const entry: HealthLog = { date: today(), ...data };
      const idx = cur.findIndex((l) => l.date === entry.date);
      const next = idx !== -1 ? cur.map((l, i) => (i === idx ? entry : l)) : [...cur, entry];
      persist(K.logs, next);
      return next;
    });
  }, []);

  /* ── wins ── */
  const addWin = useCallback((text: string) => {
    const t = text.trim();
    if (!t) return;
    setWins((cur) => {
      const next = [{ id: uid(), text: t, date: today(), ts: Date.now() }, ...cur];
      persist(K.wins, next);
      return next;
    });
  }, []);
  const deleteWin = useCallback((id: string) => {
    setWins((cur) => { const next = cur.filter((w) => w.id !== id); persist(K.wins, next); return next; });
  }, []);

  /* ── money ── */
  const addRevenue = useCallback((amount: number, note: string, category?: string, recurring?: boolean) => {
    if (!amount) return;
    setRevenue((cur) => {
      const next = [{ id: uid(), amount, note: note.trim(), date: today(), ts: Date.now(), category, recurring }, ...cur];
      persist(K.revenue, next);
      return next;
    });
  }, []);
  const deleteRevenue = useCallback((id: string) => {
    setRevenue((cur) => { const next = cur.filter((r) => r.id !== id); persist(K.revenue, next); return next; });
  }, []);
  const addExpense = useCallback((amount: number, note: string, category?: string) => {
    if (!amount) return;
    setExpenses((cur) => {
      const next = [{ id: uid(), amount, note: note.trim(), date: today(), ts: Date.now(), category }, ...cur];
      persist(K.expenses, next);
      return next;
    });
  }, []);
  const deleteExpense = useCallback((id: string) => {
    setExpenses((cur) => { const next = cur.filter((e) => e.id !== id); persist(K.expenses, next); return next; });
  }, []);
  const setMoneyGoal = useCallback((n: number) => {
    const v = Math.max(0, Math.round(n));
    setMoneyGoalState(v);
    persist(K.moneyGoal, v);
  }, []);

  /* ── habits ── */
  const addHabit = useCallback((name: string, emoji: string) => {
    const t = name.trim();
    if (!t) return;
    setHabits((cur) => {
      const next = [...cur, { id: uid(), name: t, emoji: emoji || "✅", createdAt: Date.now() }];
      persist(K.habits, next);
      return next;
    });
  }, []);
  const deleteHabit = useCallback((id: string) => {
    setHabits((cur) => { const next = cur.filter((h) => h.id !== id); persist(K.habits, next); return next; });
    setHabitLog((cur) => {
      const next: HabitLog = {};
      for (const d of Object.keys(cur)) next[d] = cur[d].filter((x) => x !== id);
      persist(K.habitLog, next);
      return next;
    });
  }, []);
  const toggleHabit = useCallback((id: string, date = today()) => {
    setHabitLog((cur) => {
      const arr = cur[date] || [];
      const next = { ...cur, [date]: arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id] };
      persist(K.habitLog, next);
      return next;
    });
  }, []);

  /* ── goals ── */
  const addGoal = useCallback((g: Omit<Goal, "id" | "createdAt">) => {
    if (!g.title.trim()) return;
    setGoals((cur) => {
      const next = [...cur, { id: uid(), createdAt: Date.now(), ...g }];
      persist(K.goals, next);
      return next;
    });
  }, []);
  const setGoalProgress = useCallback((id: string, current: number) => {
    setGoals((cur) => {
      const next = cur.map((g) => (g.id === id ? { ...g, current: Math.max(0, current) } : g));
      persist(K.goals, next);
      return next;
    });
  }, []);
  const deleteGoal = useCallback((id: string) => {
    setGoals((cur) => { const next = cur.filter((g) => g.id !== id); persist(K.goals, next); return next; });
  }, []);

  /* ── journal ── */
  const addJournal = useCallback((text: string) => {
    const t = text.trim();
    if (!t) return;
    setJournal((cur) => {
      const next = [{ id: uid(), text: t, date: today(), ts: Date.now() }, ...cur];
      persist(K.journal, next);
      return next;
    });
  }, []);
  const deleteJournal = useCallback((id: string) => {
    setJournal((cur) => { const next = cur.filter((j) => j.id !== id); persist(K.journal, next); return next; });
  }, []);

  /* ── fitness ── */
  const addWorkout = useCallback((type: string, duration: number, note: string) => {
    setWorkouts((cur) => {
      const next = [{ id: uid(), type, duration: duration || 0, note: note.trim(), date: today(), ts: Date.now() }, ...cur];
      persist(K.workouts, next);
      return next;
    });
  }, []);
  const deleteWorkout = useCallback((id: string) => {
    setWorkouts((cur) => { const next = cur.filter((w) => w.id !== id); persist(K.workouts, next); return next; });
  }, []);

  /* ── focus timer → adds deep-work hours to today's log ── */
  const addFocusMinutes = useCallback((mins: number) => {
    if (mins <= 0) return;
    const extra = Math.round((mins / 60) * 100) / 100;
    setLogs((cur) => {
      const idx = cur.findIndex((l) => l.date === today());
      let next: HealthLog[];
      if (idx !== -1) {
        next = cur.map((l, i) =>
          i === idx ? { ...l, deepWork: Math.round((l.deepWork + extra) * 100) / 100 } : l
        );
      } else {
        next = [...cur, { date: today(), sleep: 0, water: 0, mood: 0, energy: 0, rituals: [], deepWork: extra }];
      }
      persist(K.logs, next);
      return next;
    });
  }, []);

  /* ── calendar ── */
  const addCalendarEvent = useCallback((title: string, date: string, priority: EventPriority) => {
    if (!title.trim() || !date) return;
    setCalendar((cur) => {
      const next = [...cur, { id: uid(), title: title.trim(), date, priority }];
      persist(K.calendar, next);
      return next;
    });
  }, []);
  const toggleCalendarEvent = useCallback((id: string) => {
    setCalendar((cur) => {
      const next = cur.map((e) => (e.id === id ? { ...e, done: !e.done } : e));
      persist(K.calendar, next);
      return next;
    });
  }, []);
  const removeCalendarEvent = useCallback((id: string) => {
    setCalendar((cur) => { const next = cur.filter((e) => e.id !== id); persist(K.calendar, next); return next; });
  }, []);

  /* ── referrals ── */
  const ensureRefCode = useCallback(() => {
    setRefCode((cur) => {
      if (cur) return cur;
      const code = "LIFE-" + Math.random().toString(36).slice(2, 7).toUpperCase();
      persist(K.refCode, code);
      return code;
    });
  }, []);
  const addReferral = useCallback((name: string) => {
    setReferrals((cur) => {
      const next = [{ id: uid(), name: name.trim() || "Friend", status: "invited" as const, joined: today(), monthlyEarn: 0 }, ...cur];
      persist(K.referrals, next);
      return next;
    });
  }, []);

  /* ── onboarding / mode ── */
  const setActiveMode = useCallback((id: string) => { setMode(id); persist(K.mode, id); }, []);
  const completeOnboarding = useCallback(
    (name: string, focusIds: string[], extras: Partial<Pick<Profile, "challenge" | "dailyTime" | "level" | "rhythm">> = {}) => {
      const chosen = FOCUS_AREAS.filter((f) => focusIds.includes(f.id));
      setGoals((cur) => {
        const next = [...cur];
        chosen.forEach((f) =>
          f.seedGoals.forEach((g) => {
            if (!next.some((e) => e.title === g.title))
              next.push({ id: uid(), createdAt: Date.now(), current: 0, ...g });
          })
        );
        persist(K.goals, next);
        return next;
      });
      const p: Profile = { name: name.trim() || undefined, focuses: focusIds, ...extras, onboardedAt: Date.now() };
      setProfile(p);
      persist(K.profile, p);
    },
    []
  );
  const resetOnboarding = useCallback(() => { setProfile(null); persist(K.profile, null); }, []);

  /* ── sync bridge ── */
  const exportRaw = useCallback((): Record<string, string> => {
    const snap: Record<string, unknown> = {
      [K.logs]: logs, [K.wins]: wins, [K.revenue]: revenue, [K.expenses]: expenses,
      [K.moneyGoal]: moneyGoal, [K.habits]: habits, [K.habitLog]: habitLog, [K.goals]: goals,
      [K.journal]: journal, [K.workouts]: workouts, [K.calendar]: calendar, [K.profile]: profile,
      [K.mode]: mode, [K.referrals]: referrals, [K.refCode]: refCode,
    };
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(snap)) out[k] = JSON.stringify(v);
    return out;
  }, [logs, wins, revenue, expenses, moneyGoal, habits, habitLog, goals, journal, workouts, calendar, profile, mode, referrals, refCode]);

  const importRaw = useCallback((data: Record<string, string>) => {
    const parse = <T,>(short: string, set: (v: T) => void) => {
      const raw = data[short];
      if (typeof raw !== "string") return;
      try {
        const v = JSON.parse(raw) as T;
        set(v);
        AsyncStorage.setItem(sk(short), raw).catch(() => {});
      } catch { /* skip bad key */ }
    };
    parse<HealthLog[]>(K.logs, setLogs);
    parse<Win[]>(K.wins, setWins);
    parse<RevenueEntry[]>(K.revenue, setRevenue);
    parse<Expense[]>(K.expenses, setExpenses);
    parse<number>(K.moneyGoal, setMoneyGoalState);
    parse<Habit[]>(K.habits, setHabits);
    parse<HabitLog>(K.habitLog, setHabitLog);
    parse<Goal[]>(K.goals, setGoals);
    parse<JournalEntry[]>(K.journal, setJournal);
    parse<Workout[]>(K.workouts, setWorkouts);
    parse<CalendarEvent[]>(K.calendar, setCalendar);
    parse<Profile | null>(K.profile, setProfile);
    parse<string>(K.mode, setMode);
    parse<Referral[]>(K.referrals, setReferrals);
    parse<string>(K.refCode, setRefCode);
  }, []);

  const resetAll = useCallback(() => {
    setLogs([]); setWins([]); setRevenue([]); setExpenses([]); setMoneyGoalState(0);
    setHabits([]); setHabitLog({}); setGoals([]); setJournal([]); setWorkouts([]);
    setCalendar([]); setReferrals([]);
    AsyncStorage.multiRemove(ALL_KEYS.filter((k) => k !== K.profile && k !== K.mode).map(sk)).catch(() => {});
  }, []);

  const value = useMemo<Store>(
    () => ({
      ready, logs, wins, revenue, expenses, moneyGoal, habits, habitLog, goals, journal,
      workouts, calendar, profile, mode, referrals, refCode,
      saveCheckin, addWin, deleteWin,
      addRevenue, deleteRevenue, addExpense, deleteExpense, setMoneyGoal,
      addHabit, deleteHabit, toggleHabit,
      addGoal, setGoalProgress, deleteGoal,
      addJournal, deleteJournal,
      addWorkout, deleteWorkout, addFocusMinutes,
      addCalendarEvent, toggleCalendarEvent, removeCalendarEvent,
      ensureRefCode, addReferral,
      setActiveMode, completeOnboarding, resetOnboarding,
      exportRaw, importRaw, resetAll,
    }),
    [
      ready, logs, wins, revenue, expenses, moneyGoal, habits, habitLog, goals, journal,
      workouts, calendar, profile, mode, referrals, refCode,
      saveCheckin, addWin, deleteWin, addRevenue, deleteRevenue, addExpense, deleteExpense, setMoneyGoal,
      addHabit, deleteHabit, toggleHabit, addGoal, setGoalProgress, deleteGoal, addJournal, deleteJournal,
      addWorkout, deleteWorkout, addFocusMinutes, addCalendarEvent, toggleCalendarEvent, removeCalendarEvent,
      ensureRefCode, addReferral, setActiveMode, completeOnboarding, resetOnboarding, exportRaw, importRaw, resetAll,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

/* ════════════ Pure selectors (operate on store arrays) ════════════ */
export const todayLog = (logs: HealthLog[]) => logs.find((l) => l.date === today());
export const getScore = (logs: HealthLog[], date = today()) =>
  scoreFor(logs.find((l) => l.date === date));
export function streak(logs: HealthLog[]): number {
  const dates = new Set(logs.map((l) => l.date));
  let s = 0; let d = today();
  if (!dates.has(d)) d = addDays(d, -1);
  while (dates.has(d)) { s++; d = addDays(d, -1); }
  return s;
}
export const winsToday = (wins: Win[]) => wins.filter((w) => w.date === today());
export const winsSorted = (wins: Win[]) => [...wins].sort((a, b) => b.ts - a.ts);
export function scoreHistory(logs: HealthLog[], days = 14): { date: string; score: number }[] {
  const byDate = new Map(logs.map((l) => [l.date, l]));
  return lastNDays(days).map((date) => ({ date, score: scoreFor(byDate.get(date)) }));
}
export function avgScore(logs: HealthLog[], days = 7): number {
  const live = scoreHistory(logs, days).filter((d) => d.score > 0);
  if (!live.length) return 0;
  return Math.round(live.reduce((a, b) => a + b.score, 0) / live.length);
}
export const isHabitDone = (habitLog: HabitLog, id: string, date = today()) =>
  (habitLog[date] || []).includes(id);
export function habitStreak(habitLog: HabitLog, id: string): number {
  let s = 0; let d = today();
  if (!(habitLog[d] || []).includes(id)) d = addDays(d, -1);
  while ((habitLog[d] || []).includes(id)) { s++; d = addDays(d, -1); }
  return s;
}
export function workoutStreak(workouts: Workout[]): number {
  const set = new Set(workouts.map((w) => w.date));
  let s = 0; let d = today();
  if (!set.has(d)) d = addDays(d, -1);
  while (set.has(d)) { s++; d = addDays(d, -1); }
  return s;
}
export const journalToday = (journal: JournalEntry[]) => journal.filter((j) => j.date === today());
export const monthRevenue = (revenue: RevenueEntry[]) => {
  const ym = today().slice(0, 7);
  return revenue.filter((r) => r.date.startsWith(ym)).reduce((s, r) => s + r.amount, 0);
};
export const monthExpenses = (expenses: Expense[]) => {
  const ym = today().slice(0, 7);
  return expenses.filter((e) => e.date.startsWith(ym)).reduce((s, e) => s + e.amount, 0);
};
export const mrr = (revenue: RevenueEntry[]) =>
  revenue.filter((r) => r.recurring).reduce((s, r) => s + r.amount, 0);
export interface MonthMoney { ym: string; label: string; revenue: number; expenses: number; net: number }
export function moneyByMonth(revenue: RevenueEntry[], expenses: Expense[], months = 6): MonthMoney[] {
  const out: MonthMoney[] = [];
  const d = new Date(today() + "T00:00:00");
  for (let i = months - 1; i >= 0; i--) {
    const dt = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const ym = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    const rev = revenue.filter((r) => r.date.startsWith(ym)).reduce((s, r) => s + r.amount, 0);
    const exp = expenses.filter((e) => e.date.startsWith(ym)).reduce((s, e) => s + e.amount, 0);
    out.push({ ym, label: dt.toLocaleString("en-US", { month: "short" }), revenue: rev, expenses: exp, net: rev - exp });
  }
  return out;
}
export function revenueByCategory(revenue: RevenueEntry[], ym = today().slice(0, 7)) {
  const map = new Map<string, number>();
  revenue.filter((r) => r.date.startsWith(ym)).forEach((r) => {
    const k = r.category || "Other";
    map.set(k, (map.get(k) || 0) + r.amount);
  });
  return Array.from(map.entries()).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
}
export const getFocuses = (profile: Profile | null): string[] => profile?.focuses ?? [];
export const isOnboarded = (profile: Profile | null) => !!profile?.onboardedAt;

export interface Achievement {
  id: string; label: string; description: string; icon: string; goal: number; current: number; unlocked: boolean;
}
export function getAchievements(s: {
  logs: HealthLog[]; wins: Win[]; workouts: Workout[]; journal: JournalEntry[]; goals: Goal[];
}): Achievement[] {
  const checkins = s.logs.length;
  const st = streak(s.logs);
  const winCount = s.wins.length;
  const workoutCount = s.workouts.length;
  const journalCount = s.journal.length;
  const goalsDone = s.goals.filter((g) => g.target > 0 && g.current >= g.target).length;
  const deepWork = Math.round(s.logs.reduce((a, l) => a + (l.deepWork || 0), 0));
  const bestScore = Math.max(0, ...s.logs.map((l) => scoreFor(l)));
  const defs: Omit<Achievement, "unlocked">[] = [
    { id: "first_checkin", label: "First step", description: "Complete your first check-in", icon: "flag", goal: 1, current: checkins },
    { id: "streak7", label: "On a roll", description: "Reach a 7-day streak", icon: "flame", goal: 7, current: st },
    { id: "streak30", label: "Unstoppable", description: "Reach a 30-day streak", icon: "flame", goal: 30, current: st },
    { id: "wins10", label: "Momentum", description: "Log 10 small wins", icon: "sparkles", goal: 10, current: winCount },
    { id: "wins50", label: "Win machine", description: "Log 50 small wins", icon: "sparkles", goal: 50, current: winCount },
    { id: "deepwork50", label: "Deep diver", description: "Log 50h of deep work", icon: "flash", goal: 50, current: deepWork },
    { id: "workouts10", label: "Getting strong", description: "Log 10 workouts", icon: "barbell", goal: 10, current: workoutCount },
    { id: "journal7", label: "Reflective", description: "Write 7 journal entries", icon: "book", goal: 7, current: journalCount },
    { id: "goal1", label: "Goal getter", description: "Complete a goal", icon: "flag", goal: 1, current: goalsDone },
    { id: "perfect", label: "Perfect day", description: "Hit a 90+ life score", icon: "star", goal: 90, current: bestScore },
  ];
  return defs.map((d) => ({ ...d, unlocked: d.current >= d.goal }));
}
export function memoriesFor(s: { logs: HealthLog[]; wins: Win[]; journal: JournalEntry[]; workouts: Workout[] }, daysAgo: number) {
  const date = addDays(today(), -daysAgo);
  return {
    date,
    score: scoreFor(s.logs.find((l) => l.date === date)),
    wins: s.wins.filter((w) => w.date === date),
    journal: s.journal.filter((j) => j.date === date),
    workouts: s.workouts.filter((w) => w.date === date),
  };
}
