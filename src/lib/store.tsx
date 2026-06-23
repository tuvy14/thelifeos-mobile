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

/* ── Types ── */
export interface HealthLog {
  date: string; // yyyy-MM-dd (local)
  sleep: number;
  water: number;
  mood: number; // 1–10
  energy: number; // 1–10
  deepWork: number; // hours
  rituals: string[];
  intention?: string;
}
export interface Win {
  id: string;
  text: string;
  date: string;
  ts: number;
}
export interface Habit {
  id: string;
  name: string;
  emoji: string;
  createdTs: number;
  log: string[]; // dates (yyyy-MM-dd) the habit was completed
}
export interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  createdTs: number;
}
export interface JournalEntry {
  id: string;
  date: string;
  text: string;
  ts: number;
}
export interface Txn {
  id: string;
  date: string;
  amount: number; // signed: + income, − expense
  note: string;
  ts: number;
}

export const RITUALS = [
  { id: "sunlight", label: "Sunlight", emoji: "☀️" },
  { id: "move", label: "Move", emoji: "🏃" },
  { id: "read", label: "Read", emoji: "📖" },
  { id: "meditate", label: "Meditate", emoji: "🧘" },
  { id: "no_phone", label: "No phone AM", emoji: "📵" },
  { id: "water", label: "Hydrate", emoji: "💧" },
];

export const HABIT_EMOJIS = ["🔥", "📖", "🏃", "🧘", "💧", "🥗", "💤", "✍️", "🎯", "🌱", "💪", "🎨"];

/* ── Local date helpers (not UTC) ── */
const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
export const today = () => ymd(new Date());
const addDays = (d: string, n: number) => {
  const date = new Date(d + "T00:00:00");
  date.setDate(date.getDate() + n);
  return ymd(date);
};
/** Last N day-strings, oldest → newest, ending today. */
export function lastNDays(n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDays(today(), -i));
  return out;
}

/* ── Life score (0–100) — same formula as the web app ── */
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

const K_LOGS = "lifeos_health_logs";
const K_WINS = "lifeos_wins";
const K_HABITS = "lifeos_habits";
const K_GOALS = "lifeos_goals";
const K_JOURNAL = "lifeos_journal";
const K_MONEY = "lifeos_money";

const uid = () => String(Date.now()) + Math.random().toString(36).slice(2, 6);
const persist = (key: string, value: unknown) =>
  AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});

interface Store {
  ready: boolean;
  logs: HealthLog[];
  wins: Win[];
  habits: Habit[];
  goals: Goal[];
  journal: JournalEntry[];
  money: Txn[];
  // check-ins + wins
  saveCheckin: (data: Omit<HealthLog, "date">) => void;
  addWin: (text: string) => void;
  deleteWin: (id: string) => void;
  // habits
  addHabit: (name: string, emoji: string) => void;
  toggleHabit: (id: string, date?: string) => void;
  deleteHabit: (id: string) => void;
  // goals
  addGoal: (title: string, target: number, unit: string) => void;
  setGoalProgress: (id: string, current: number) => void;
  deleteGoal: (id: string) => void;
  // journal
  addJournal: (text: string) => void;
  deleteJournal: (id: string) => void;
  // money
  addTxn: (amount: number, note: string) => void;
  deleteTxn: (id: string) => void;
  // cloud sync bridge (short keys match the web app's snapshot format)
  exportRaw: () => Record<string, string>;
  importRaw: (data: Record<string, string>) => void;
  // utility
  resetAll: () => void;
}

/** Short key (matches web `snapshotState`) → AsyncStorage key. */
const SYNC_KEYS: Record<string, string> = {
  health_logs: K_LOGS,
  wins: K_WINS,
  habits: K_HABITS,
  goals: K_GOALS,
  journal: K_JOURNAL,
  money: K_MONEY,
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [wins, setWins] = useState<Win[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [money, setMoney] = useState<Txn[]>([]);

  // Hydrate once from AsyncStorage.
  useEffect(() => {
    (async () => {
      try {
        const pairs = await AsyncStorage.multiGet([
          K_LOGS,
          K_WINS,
          K_HABITS,
          K_GOALS,
          K_JOURNAL,
          K_MONEY,
        ]);
        const map = Object.fromEntries(pairs);
        if (map[K_LOGS]) setLogs(JSON.parse(map[K_LOGS]!));
        if (map[K_WINS]) setWins(JSON.parse(map[K_WINS]!));
        if (map[K_HABITS]) setHabits(JSON.parse(map[K_HABITS]!));
        if (map[K_GOALS]) setGoals(JSON.parse(map[K_GOALS]!));
        if (map[K_JOURNAL]) setJournal(JSON.parse(map[K_JOURNAL]!));
        if (map[K_MONEY]) setMoney(JSON.parse(map[K_MONEY]!));
      } catch {
        /* ignore — start empty */
      } finally {
        setReady(true);
      }
    })();
  }, []);

  /* ── check-ins ── */
  const saveCheckin = useCallback((data: Omit<HealthLog, "date">) => {
    const entry: HealthLog = { date: today(), ...data };
    setLogs((cur) => {
      const idx = cur.findIndex((x) => x.date === entry.date);
      const next = idx !== -1 ? cur.map((x, i) => (i === idx ? entry : x)) : [...cur, entry];
      persist(K_LOGS, next);
      return next;
    });
  }, []);

  /* ── wins ── */
  const addWin = useCallback((text: string) => {
    const t = text.trim();
    if (!t) return;
    setWins((cur) => {
      const next = [{ id: uid(), text: t, date: today(), ts: Date.now() }, ...cur];
      persist(K_WINS, next);
      return next;
    });
  }, []);
  const deleteWin = useCallback((id: string) => {
    setWins((cur) => {
      const next = cur.filter((w) => w.id !== id);
      persist(K_WINS, next);
      return next;
    });
  }, []);

  /* ── habits ── */
  const addHabit = useCallback((name: string, emoji: string) => {
    const t = name.trim();
    if (!t) return;
    setHabits((cur) => {
      const next = [...cur, { id: uid(), name: t, emoji, createdTs: Date.now(), log: [] }];
      persist(K_HABITS, next);
      return next;
    });
  }, []);
  const toggleHabit = useCallback((id: string, date = today()) => {
    setHabits((cur) => {
      const next = cur.map((h) => {
        if (h.id !== id) return h;
        const on = h.log.includes(date);
        return { ...h, log: on ? h.log.filter((d) => d !== date) : [...h.log, date] };
      });
      persist(K_HABITS, next);
      return next;
    });
  }, []);
  const deleteHabit = useCallback((id: string) => {
    setHabits((cur) => {
      const next = cur.filter((h) => h.id !== id);
      persist(K_HABITS, next);
      return next;
    });
  }, []);

  /* ── goals ── */
  const addGoal = useCallback((title: string, target: number, unit: string) => {
    const t = title.trim();
    if (!t) return;
    setGoals((cur) => {
      const next = [
        ...cur,
        { id: uid(), title: t, target: target || 1, current: 0, unit: unit.trim(), createdTs: Date.now() },
      ];
      persist(K_GOALS, next);
      return next;
    });
  }, []);
  const setGoalProgress = useCallback((id: string, current: number) => {
    setGoals((cur) => {
      const next = cur.map((g) => (g.id === id ? { ...g, current: Math.max(0, current) } : g));
      persist(K_GOALS, next);
      return next;
    });
  }, []);
  const deleteGoal = useCallback((id: string) => {
    setGoals((cur) => {
      const next = cur.filter((g) => g.id !== id);
      persist(K_GOALS, next);
      return next;
    });
  }, []);

  /* ── journal ── */
  const addJournal = useCallback((text: string) => {
    const t = text.trim();
    if (!t) return;
    setJournal((cur) => {
      const next = [{ id: uid(), date: today(), text: t, ts: Date.now() }, ...cur];
      persist(K_JOURNAL, next);
      return next;
    });
  }, []);
  const deleteJournal = useCallback((id: string) => {
    setJournal((cur) => {
      const next = cur.filter((j) => j.id !== id);
      persist(K_JOURNAL, next);
      return next;
    });
  }, []);

  /* ── money ── */
  const addTxn = useCallback((amount: number, note: string) => {
    if (!amount || Number.isNaN(amount)) return;
    setMoney((cur) => {
      const next = [{ id: uid(), date: today(), amount, note: note.trim(), ts: Date.now() }, ...cur];
      persist(K_MONEY, next);
      return next;
    });
  }, []);
  const deleteTxn = useCallback((id: string) => {
    setMoney((cur) => {
      const next = cur.filter((t) => t.id !== id);
      persist(K_MONEY, next);
      return next;
    });
  }, []);

  /* ── cloud sync bridge ── */
  const exportRaw = useCallback(
    (): Record<string, string> => ({
      health_logs: JSON.stringify(logs),
      wins: JSON.stringify(wins),
      habits: JSON.stringify(habits),
      goals: JSON.stringify(goals),
      journal: JSON.stringify(journal),
      money: JSON.stringify(money),
    }),
    [logs, wins, habits, goals, journal, money]
  );
  const importRaw = useCallback((data: Record<string, string>) => {
    // Overlay only the keys we own; never delete unknown keys (web may have more).
    for (const [short, asKey] of Object.entries(SYNC_KEYS)) {
      const raw = data[short];
      if (typeof raw !== "string") continue;
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        continue;
      }
      if (!Array.isArray(parsed)) continue;
      switch (short) {
        case "health_logs": setLogs(parsed as HealthLog[]); break;
        case "wins": setWins(parsed as Win[]); break;
        case "habits": setHabits(parsed as Habit[]); break;
        case "goals": setGoals(parsed as Goal[]); break;
        case "journal": setJournal(parsed as JournalEntry[]); break;
        case "money": setMoney(parsed as Txn[]); break;
      }
      AsyncStorage.setItem(asKey, raw).catch(() => {});
    }
  }, []);

  /* ── utility ── */
  const resetAll = useCallback(() => {
    setLogs([]); setWins([]); setHabits([]); setGoals([]); setJournal([]); setMoney([]);
    AsyncStorage.multiRemove([K_LOGS, K_WINS, K_HABITS, K_GOALS, K_JOURNAL, K_MONEY]).catch(() => {});
  }, []);

  const value = useMemo<Store>(
    () => ({
      ready, logs, wins, habits, goals, journal, money,
      saveCheckin, addWin, deleteWin,
      addHabit, toggleHabit, deleteHabit,
      addGoal, setGoalProgress, deleteGoal,
      addJournal, deleteJournal,
      addTxn, deleteTxn,
      exportRaw, importRaw,
      resetAll,
    }),
    [
      ready, logs, wins, habits, goals, journal, money,
      saveCheckin, addWin, deleteWin,
      addHabit, toggleHabit, deleteHabit,
      addGoal, setGoalProgress, deleteGoal,
      addJournal, deleteJournal,
      addTxn, deleteTxn,
      exportRaw, importRaw,
      resetAll,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

/* ── Derived selectors ── */
export function todayLog(logs: HealthLog[]): HealthLog | undefined {
  return logs.find((l) => l.date === today());
}
export function streak(logs: HealthLog[]): number {
  const dates = new Set(logs.map((l) => l.date));
  let s = 0;
  let d = today();
  if (!dates.has(d)) d = addDays(d, -1);
  while (dates.has(d)) {
    s++;
    d = addDays(d, -1);
  }
  return s;
}
export function winsToday(wins: Win[]): Win[] {
  return wins.filter((w) => w.date === today());
}

/** Score for each of the last n days (oldest→newest). */
export function scoreTrend(logs: HealthLog[], n = 7): { date: string; score: number }[] {
  const byDate = new Map(logs.map((l) => [l.date, l]));
  return lastNDays(n).map((date) => ({ date, score: scoreFor(byDate.get(date)) }));
}
export function avgScore(logs: HealthLog[], n = 7): number {
  const t = scoreTrend(logs, n);
  const live = t.filter((d) => d.score > 0);
  if (!live.length) return 0;
  return Math.round(live.reduce((a, b) => a + b.score, 0) / live.length);
}
export function habitDoneToday(h: Habit): boolean {
  return h.log.includes(today());
}
export function habitStreak(h: Habit): number {
  const set = new Set(h.log);
  let s = 0;
  let d = today();
  if (!set.has(d)) d = addDays(d, -1);
  while (set.has(d)) {
    s++;
    d = addDays(d, -1);
  }
  return s;
}
export function balance(money: Txn[]): number {
  return money.reduce((a, t) => a + t.amount, 0);
}
export function journalToday(journal: JournalEntry[]): JournalEntry[] {
  return journal.filter((j) => j.date === today());
}
