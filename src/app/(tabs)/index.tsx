import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, useWindowDimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/screen";
import { Card, Eyebrow, IconBadge } from "@/components/ui";
import { PressableScale, Reveal, CountUp, Pulse, GrowBar } from "@/components/anim";
import ScoreRing from "@/components/score-ring";
import XpBar from "@/components/xp-bar";
import WeeklyRecap from "@/components/weekly-recap";
import { useTheme, radius, fonts } from "@/lib/theme";
import {
  useStore,
  scoreFor,
  todayLog,
  streak,
  winsToday,
  winsSorted,
  avgScore,
  scoreHistory,
  getFocuses,
  FOCUS_AREAS,
} from "@/lib/store";
import { useCelebrate } from "@/lib/celebrate";

const VIEW_ROUTE: Record<string, Href> = {
  checkin: "/check-in",
  wins: "/wins",
  habits: "/habits",
  goals: "/goals",
  journal: "/journal",
  fitness: "/fitness",
  focus: "/focus",
  money: "/money",
  insights: "/insights",
};
const routeFor = (view: string): Href => VIEW_ROUTE[view] ?? "/check-in";

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

export default function TodayScreen() {
  const { ready, logs, wins, profile, habits, habitLog } = useStore();
  const { celebrate } = useCelebrate();
  const { c } = useTheme();
  const { width } = useWindowDimensions();
  const [recapOpen, setRecapOpen] = useState(false);
  // Check-in hands the XP celebration here via params (fires once per nonce).
  const xpParams = useLocalSearchParams<{ xpGain?: string; lvlUp?: string; t?: string }>();

  const compact = width < 380;
  const ringSize = compact ? 96 : 116;

  // Celebrate streak milestones once each (mirrors web lifeos:celebrate).
  useEffect(() => {
    if (!ready) return;
    const stk = streak(logs);
    if (![3, 7, 14, 30, 50, 100, 200, 365].includes(stk)) return;
    (async () => {
      const prev = Number((await AsyncStorage.getItem("lifeos_celebratedStreak")) || 0);
      if (stk > prev) {
        await AsyncStorage.setItem("lifeos_celebratedStreak", String(stk));
        celebrate(`🔥 ${stk}-day streak — you're on fire!`);
      }
    })();
  }, [ready, logs, celebrate]);

  if (!ready) {
    return (
      <View style={[styles.loading, { backgroundColor: c.obsidian }]}>
        <ActivityIndicator color={c.ink} />
      </View>
    );
  }

  const log = todayLog(logs);
  const score = scoreFor(log);
  const stk = streak(logs);
  const todays = winsToday(wins);
  const myFocus = FOCUS_AREAS.filter((f) => getFocuses(profile).includes(f.id));

  // Overview stats
  const avg7 = avgScore(logs, 7);
  const week = scoreHistory(logs, 7);
  // Momentum: this week's average vs the previous 7 days.
  const prevWeek = scoreHistory(logs, 14).slice(0, 7).filter((d) => d.score > 0);
  const prevAvg = prevWeek.length ? Math.round(prevWeek.reduce((a, b) => a + b.score, 0) / prevWeek.length) : 0;
  const momentum = avg7 - prevAvg;
  const hasMomentum = avg7 > 0 && prevAvg > 0;
  const checkins = logs.length;
  const totalWins = wins.length;
  const deepWorkTotal = Math.round(logs.reduce((a, l) => a + (l.deepWork || 0), 0));
  const bestScore = logs.length ? Math.max(0, ...logs.map((l) => scoreFor(l))) : 0;
  const recentWins = winsSorted(wins).slice(0, 3);

  const label =
    score >= 80 ? "Crushing it" : score >= 55 ? "On track" : score >= 30 ? "Getting there" : log ? "Logged today" : "Start the day";
  const heroMsg = !log
    ? stk > 0
      ? `Check in to keep your ${stk}-day streak alive.`
      : "Run today's check-in to set your life score."
    : stk >= 3
      ? `${stk} days strong — keep it alive.`
      : "Logged today. See you tomorrow.";
  const onARoll = stk >= 3;
  const firstName = profile?.name ? profile.name.split(" ")[0] : null;

  const r1 = (n: number) => Math.round(n * 10) / 10;
  const int = (n: number) => String(Math.round(n));
  const dash = (real: number) => (n: number) => (real ? int(n) : "—");
  const stats: { icon: keyof typeof Ionicons.glyphMap; label: string; value: number; format: (n: number) => string }[] = [
    { icon: "flame-outline", label: "Day streak", value: stk, format: int },
    { icon: "pulse-outline", label: "Avg score · 7d", value: avg7, format: dash(avg7) },
    { icon: "calendar-outline", label: "Check-ins", value: checkins, format: int },
    { icon: "sparkles-outline", label: "Total wins", value: totalWins, format: int },
    { icon: "flash-outline", label: "Deep work", value: deepWorkTotal, format: (n) => `${int(n)}h` },
    { icon: "trophy-outline", label: "Best score", value: bestScore, format: dash(bestScore) },
  ];

  const quickActions: { icon: keyof typeof Ionicons.glyphMap; label: string; route: Href }[] = [
    { icon: "create-outline", label: "Check-in", route: "/check-in" },
    { icon: "add-circle-outline", label: "Log win", route: "/wins" },
    { icon: "stats-chart-outline", label: "Insights", route: "/insights" },
    { icon: "repeat-outline", label: "Habits", route: "/habits" },
  ];

  const todayMetrics = [
    { icon: "moon-outline" as const, label: "Sleep", value: log ? `${r1(log.sleep)}h` : "—" },
    { icon: "water-outline" as const, label: "Water", value: log ? `${r1(log.water)}L` : "—" },
    { icon: "flash-outline" as const, label: "Deep work", value: log ? `${r1(log.deepWork)}h` : "—" },
    { icon: "happy-outline" as const, label: "Mood", value: log ? `${log.mood}/10` : "—" },
  ];

  const weekMax = Math.max(100, ...week.map((d) => d.score));

  return (
    <Screen>
      {/* Greeting */}
      <Reveal delay={0}>
        <Text style={[styles.kicker, { color: c.inkFaint }]}>{greeting().toUpperCase()}{firstName ? "" : ""}</Text>
        <Text style={[styles.hi, { color: c.ink }]} numberOfLines={1} adjustsFontSizeToFit>
          {firstName ? `Hey, ${firstName}` : "Your overview"}
        </Text>
      </Reveal>

      {/* Hero — life score */}
      <Reveal delay={70} style={{ marginTop: 16 }}>
        <Card padding={compact ? 18 : 22} rounded={radius.xl}>
          <View style={styles.hero}>
            <ScoreRing score={score} size={ringSize} />
            <View style={styles.heroRight}>
              <Eyebrow>Life score · today</Eyebrow>
              <Text style={[styles.h2, { color: c.ink, fontSize: compact ? 22 : 27 }]} numberOfLines={1} adjustsFontSizeToFit>
                {label}
              </Text>
              <Text style={[styles.heroMsg, { color: c.inkMuted }]}>{heroMsg}</Text>
              <View style={styles.chipRow}>
                <View style={[styles.chip, { borderColor: onARoll ? c.chipBorder : c.line, backgroundColor: onARoll ? c.chipBg : c.fill }]}>
                  <Text style={[styles.chipText, { color: c.ink }]}>🔥 {stk}-day</Text>
                </View>
                <View style={[styles.chip, { borderColor: c.line, backgroundColor: c.fill }]}>
                  <Text style={[styles.chipText, { color: c.ink }]}>✦ {todays.length} today</Text>
                </View>
              </View>
            </View>
          </View>
          <Pulse active={!log} style={{ marginTop: 18 }}>
            <PressableScale
              style={[styles.ctaPill, { backgroundColor: log ? c.fill : c.ink, borderColor: c.line, borderWidth: log ? 1 : 0 }]}
              onPress={() => router.navigate("/check-in")}
              haptics="medium"
            >
              <Text style={[styles.ctaText, { color: log ? c.ink : c.obsidian }]}>
                {log ? "Edit today's check-in" : "Start daily check-in"}
              </Text>
              <Ionicons name="arrow-forward" size={15} color={log ? c.ink : c.obsidian} />
            </PressableScale>
          </Pulse>
        </Card>
      </Reveal>

      {/* Level / XP */}
      <Reveal delay={85} style={{ marginTop: 14 }}>
        <XpBar
          variant="full"
          fireKey={xpParams.t}
          gain={Number(xpParams.xpGain) || 0}
          levelUpName={xpParams.lvlUp || undefined}
        />
      </Reveal>

      {/* Weekly recap */}
      <Reveal delay={92} style={{ marginTop: 14 }}>
        <PressableScale
          onPress={() => setRecapOpen(true)}
          style={[styles.recapCard, { borderColor: c.line, backgroundColor: c.card }]}
        >
          <View style={[styles.recapIcon, { borderColor: c.line, backgroundColor: c.fill }]}>
            <Ionicons name="sparkles" size={20} color={c.ink} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.recapTitle, { color: c.ink }]}>Your week, wrapped</Text>
            <Text style={[styles.recapSub, { color: c.inkMuted }]}>Replay your last 7 days ✨</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={c.inkFaint} />
        </PressableScale>
      </Reveal>

      <WeeklyRecap
        visible={recapOpen}
        onClose={() => setRecapOpen(false)}
        data={{ logs, wins, habits, habitLog }}
      />

      {/* Quick actions */}
      <Reveal delay={95} style={{ marginTop: 14 }}>
        <View style={styles.quickRow}>
          {quickActions.map((q) => (
            <PressableScale
              key={q.label}
              style={[styles.quickItem, { backgroundColor: c.card, borderColor: c.line }]}
              onPress={() => router.navigate(q.route)}
            >
              <View style={[styles.quickIcon, { backgroundColor: c.fill, borderColor: c.line }]}>
                <Ionicons name={q.icon} size={18} color={c.ink} />
              </View>
              <Text style={[styles.quickLabel, { color: c.inkMuted }]}>{q.label}</Text>
            </PressableScale>
          ))}
        </View>
      </Reveal>

      {/* This week */}
      <Reveal delay={130} style={{ marginTop: 14 }}>
        <Card padding={18}>
          <View style={styles.weekHead}>
            <View style={styles.rowCenter}>
              <Ionicons name="bar-chart-outline" size={15} color={c.inkMuted} />
              <Text style={[styles.sectionLabel, { color: c.inkMuted }]}>THIS WEEK</Text>
            </View>
            <View style={styles.rowCenter}>
              {hasMomentum && (
                <View style={[styles.momentum, { borderColor: c.line, backgroundColor: c.fill }]}>
                  <Ionicons name={momentum >= 0 ? "trending-up" : "trending-down"} size={12} color={c.ink} />
                  <Text style={[styles.momentumText, { color: c.ink }]}>
                    {momentum >= 0 ? "+" : ""}{momentum} vs last wk
                  </Text>
                </View>
              )}
              <Text style={[styles.weekAvg, { color: c.inkFaint }]}>
                avg <Text style={{ color: c.ink, fontFamily: fonts.displayBold }}>{avg7 || 0}</Text>
              </Text>
            </View>
          </View>
          <View style={styles.bars}>
            {week.map((d, i) => {
              const day = new Date(d.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "narrow" });
              const isToday = i === week.length - 1;
              return (
                <View key={d.date} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <GrowBar
                      pct={Math.max(d.score ? 8 : 0, (d.score / weekMax) * 100)}
                      color={d.score ? c.ink : "transparent"}
                      rounded={radius.sm}
                      delay={i * 55}
                      style={{ opacity: isToday ? 1 : 0.55 }}
                    />
                  </View>
                  <Text style={[styles.barDay, { color: isToday ? c.ink : c.inkFaint }]}>{day}</Text>
                </View>
              );
            })}
          </View>
        </Card>
      </Reveal>

      {/* Overview stat grid */}
      <View style={styles.statGrid}>
        {stats.map((m, idx) => (
          <Reveal key={m.label} delay={150 + idx * 50} style={styles.statCard}>
            <Card padding={15}>
              <IconBadge name={m.icon} />
              <CountUp value={m.value} format={m.format} duration={1000} style={[styles.statValue, { color: c.ink }]} />
              <Text style={[styles.statLabel, { color: c.inkFaint }]}>{m.label}</Text>
            </Card>
          </Reveal>
        ))}
      </View>

      {/* Your focus */}
      {myFocus.length > 0 && (
        <Reveal delay={260} style={{ marginTop: 14 }}>
          <Card>
            <View style={styles.rowCenter}>
              <Ionicons name="locate-outline" size={15} color={c.inkMuted} />
              <Text style={[styles.sectionLabel, { color: c.inkMuted }]}>YOUR FOCUS</Text>
            </View>
            <View style={styles.focusWrap}>
              {myFocus.map((f) => (
                <PressableScale
                  key={f.id}
                  onPress={() => router.navigate(routeFor(f.views[0]))}
                  style={[styles.focusChip, { borderColor: c.line, backgroundColor: c.fill }]}
                >
                  <Text style={[styles.focusChipText, { color: c.ink }]}>{f.label}</Text>
                  <Ionicons name="arrow-forward" size={13} color={c.inkFaint} />
                </PressableScale>
              ))}
            </View>
          </Card>
        </Reveal>
      )}

      {/* Today snapshot */}
      <Reveal delay={300} style={{ marginTop: 14 }}>
        <Card padding={18}>
          <View style={styles.rowCenter}>
            <Ionicons name="today-outline" size={15} color={c.inkMuted} />
            <Text style={[styles.sectionLabel, { color: c.inkMuted }]}>TODAY</Text>
          </View>
          <View style={styles.todayRow}>
            {todayMetrics.map((m) => (
              <View key={m.label} style={styles.todayItem}>
                <Text style={[styles.todayValue, { color: c.ink }]}>{m.value}</Text>
                <Text style={[styles.todayLabel, { color: c.inkFaint }]}>{m.label}</Text>
              </View>
            ))}
          </View>
        </Card>
      </Reveal>

      {/* Recent wins (read-only — log them in check-in) */}
      <Reveal delay={340} style={{ marginTop: 14 }}>
        <Card padding={18}>
          <View style={styles.winsHead}>
            <View style={styles.rowCenter}>
              <Ionicons name="ribbon-outline" size={15} color={c.inkMuted} />
              <Text style={[styles.sectionLabel, { color: c.inkMuted }]}>RECENT WINS</Text>
            </View>
            <PressableScale onPress={() => router.navigate("/wins")} scaleTo={0.9}>
              <Text style={[styles.viewAll, { color: c.inkMuted }]}>View all →</Text>
            </PressableScale>
          </View>
          {recentWins.length > 0 ? (
            <View style={{ marginTop: 12, gap: 8 }}>
              {recentWins.map((w) => (
                <View key={w.id} style={[styles.winItem, { borderColor: c.line }]}>
                  <View style={[styles.winCheck, { backgroundColor: c.ink }]}>
                    <Ionicons name="checkmark" size={11} color={c.obsidian} />
                  </View>
                  <Text style={[styles.winText, { color: c.ink }]} numberOfLines={1}>{w.text}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.empty, { color: c.inkFaint }]}>No wins yet — add one on your check-in.</Text>
          )}
        </Card>
      </Reveal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  kicker: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.6 },
  hi: { fontFamily: fonts.displayBold, fontSize: 28, letterSpacing: -0.7, marginTop: 4 },
  hero: { flexDirection: "row", alignItems: "center", gap: 18 },
  heroRight: { flex: 1 },
  h2: { fontFamily: fonts.displayBold, fontSize: 27, letterSpacing: -0.6, marginTop: 6 },
  heroMsg: { fontFamily: fonts.body, fontSize: 13, marginTop: 3, lineHeight: 18 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  chip: { borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 6 },
  chipText: { fontFamily: fonts.monoMedium, fontSize: 11 },
  ctaPill: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7,
    borderRadius: radius.pill, paddingVertical: 13,
  },
  ctaText: { fontFamily: fonts.bodyBold, fontSize: 14 },
  rowCenter: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionLabel: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.2 },
  quickRow: { flexDirection: "row", gap: 10 },
  quickItem: { flex: 1, alignItems: "center", gap: 8, borderWidth: 1, borderRadius: radius.lg, paddingVertical: 14 },
  quickIcon: { width: 38, height: 38, borderRadius: radius.md, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  quickLabel: { fontFamily: fonts.bodyMedium, fontSize: 11.5 },
  momentum: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4 },
  momentumText: { fontFamily: fonts.monoMedium, fontSize: 10.5 },
  weekHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  weekAvg: { fontFamily: fonts.mono, fontSize: 12 },
  bars: { flexDirection: "row", alignItems: "flex-end", gap: 8, height: 92, marginTop: 16 },
  barCol: { flex: 1, alignItems: "center", gap: 8 },
  barTrack: { flex: 1, width: "100%", borderRadius: radius.sm, justifyContent: "flex-end", overflow: "hidden" },
  barFill: { width: "100%", borderRadius: radius.sm, minHeight: 4 },
  barDay: { fontFamily: fonts.mono, fontSize: 10 },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 14 },
  statCard: { flexGrow: 1, flexBasis: "30%" },
  statValue: { fontFamily: fonts.displayBold, fontSize: 23, marginTop: 10, letterSpacing: -0.5 },
  statLabel: { fontFamily: fonts.body, fontSize: 11.5, marginTop: 2 },
  focusWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  focusChip: {
    flexDirection: "row", alignItems: "center", gap: 6, borderRadius: radius.pill,
    borderWidth: 1, paddingHorizontal: 13, paddingVertical: 8,
  },
  focusChipText: { fontFamily: fonts.bodyMedium, fontSize: 14 },
  todayRow: { flexDirection: "row", marginTop: 14 },
  todayItem: { flex: 1, alignItems: "center", gap: 3 },
  todayValue: { fontFamily: fonts.displayBold, fontSize: 20, letterSpacing: -0.5 },
  todayLabel: { fontFamily: fonts.body, fontSize: 11 },
  winsHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  viewAll: { fontFamily: fonts.body, fontSize: 12 },
  winItem: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10 },
  winCheck: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  winText: { fontFamily: fonts.body, fontSize: 14, flex: 1 },
  empty: { fontFamily: fonts.body, fontSize: 13, marginTop: 12 },
  recapCard: { flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, borderRadius: radius.lg, padding: 16 },
  recapIcon: { width: 46, height: 46, borderRadius: radius.md, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  recapTitle: { fontFamily: fonts.displayBold, fontSize: 16, letterSpacing: -0.3 },
  recapSub: { fontFamily: fonts.body, fontSize: 12.5, marginTop: 2 },
});
