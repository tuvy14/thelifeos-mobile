import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/screen";
import { Card, Eyebrow, IconBadge, Field } from "@/components/ui";
import { PressableScale, Reveal } from "@/components/anim";
import ScoreRing from "@/components/score-ring";
import { useTheme, radius, fonts } from "@/lib/theme";
import {
  useStore,
  scoreFor,
  todayLog,
  streak,
  winsToday,
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

export default function TodayScreen() {
  const { ready, logs, wins, profile, addWin } = useStore();
  const { celebrate } = useCelebrate();
  const { c } = useTheme();
  const [winInput, setWinInput] = useState("");

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
  const s = streak(logs);
  const todays = winsToday(wins);
  const myFocus = FOCUS_AREAS.filter((f) => getFocuses(profile).includes(f.id));

  const label =
    score >= 80 ? "Crushing it" : score >= 55 ? "On track" : score >= 30 ? "Getting there" : "Start the day";
  const heroMsg = !log
    ? "You haven't checked in yet today."
    : s >= 3
      ? `${s} days strong — come back tomorrow to keep it alive.`
      : "Logged today. See you tomorrow.";
  const onARoll = s >= 3;

  const r1 = (n: number) => Math.round(n * 10) / 10;
  const metrics = [
    { icon: "moon-outline" as const, label: "Sleep", value: log ? `${r1(log.sleep)}h` : "—" },
    { icon: "water-outline" as const, label: "Water", value: log ? `${r1(log.water)}L` : "—" },
    { icon: "flash-outline" as const, label: "Deep work", value: log ? `${r1(log.deepWork)}h` : "—" },
    { icon: "happy-outline" as const, label: "Mood", value: log ? `${log.mood}/10` : "—" },
  ];

  const submitWin = () => {
    if (!winInput.trim()) return;
    addWin(winInput);
    setWinInput("");
  };

  return (
    <Screen>
      {/* Hero */}
      <Card padding={24} rounded={radius.xl} style={styles.hero}>
        <ScoreRing score={score} size={128} />
        <View style={styles.heroRight}>
          <Eyebrow>Life score · today</Eyebrow>
          <Text style={[styles.h2, { color: c.ink }]}>{label}</Text>
          <Text style={[styles.heroMsg, { color: c.inkMuted }]}>{heroMsg}</Text>
          <View style={styles.chipRow}>
            <View
              style={[
                styles.chip,
                { borderColor: onARoll ? c.chipBorder : c.line, backgroundColor: onARoll ? c.chipBg : c.fill },
              ]}
            >
              <Text style={[styles.chipText, { color: c.ink }]}>
                🔥 {s}-day streak{onARoll ? " · on a roll" : ""}
              </Text>
            </View>
            <View style={[styles.chip, { borderColor: c.line, backgroundColor: c.fill }]}>
              <Text style={[styles.chipText, { color: c.ink }]}>✦ {todays.length} wins today</Text>
            </View>
          </View>
          {!log && (
            <PressableScale
              style={[styles.ctaPill, { backgroundColor: c.ink }]}
              onPress={() => router.navigate("/check-in")}
            >
              <Text style={[styles.ctaText, { color: c.obsidian }]}>Check in</Text>
              <Ionicons name="arrow-forward" size={14} color={c.obsidian} />
            </PressableScale>
          )}
        </View>
      </Card>

      {/* Your focus */}
      {myFocus.length > 0 && (
        <Card style={{ marginTop: 16 }}>
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
      )}

      {/* Today's focus intention */}
      {log?.intention ? (
        <Card style={{ marginTop: 16 }} padding={16}>
          <View style={styles.rowCenter}>
            <IconBadge name="locate-outline" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.tinyLabel, { color: c.inkFaint }]}>TODAY&apos;S FOCUS</Text>
              <Text style={[styles.intention, { color: c.ink }]}>{log.intention}</Text>
            </View>
          </View>
        </Card>
      ) : null}

      {/* Metrics */}
      <View style={styles.metricGrid}>
        {metrics.map((m, idx) => (
          <Reveal key={m.label} delay={120 + idx * 70} style={styles.metricCard}>
            <Card padding={16}>
              <IconBadge name={m.icon} />
              <Text style={[styles.metricValue, { color: c.ink }]}>{m.value}</Text>
              <Text style={[styles.metricLabel, { color: c.inkFaint }]}>{m.label}</Text>
            </Card>
          </Reveal>
        ))}
      </View>

      {/* Small wins */}
      <Card style={{ marginTop: 16 }} padding={20}>
        <View style={styles.winsHead}>
          <View>
            <Text style={[styles.cardTitle, { color: c.ink }]}>Small wins</Text>
            <Text style={[styles.cardSub, { color: c.inkMuted }]}>The day is built from these.</Text>
          </View>
          <PressableScale onPress={() => router.navigate("/wins")} scaleTo={0.9}>
            <Text style={[styles.viewAll, { color: c.inkMuted }]}>View all →</Text>
          </PressableScale>
        </View>
        <View style={styles.winRow}>
          <Field
            value={winInput}
            onChangeText={setWinInput}
            placeholder="What went well? Log a small win…"
            style={{ flex: 1 }}
            returnKeyType="done"
            onSubmitEditing={submitWin}
          />
          <PressableScale style={[styles.addBtn, { backgroundColor: c.ink }]} onPress={submitWin}>
            <Ionicons name="add" size={20} color={c.obsidian} />
          </PressableScale>
        </View>
        {todays.length > 0 && (
          <View style={{ marginTop: 14, gap: 8 }}>
            {todays.map((w) => (
              <View key={w.id} style={[styles.winItem, { borderColor: c.line }]}>
                <View style={[styles.winCheck, { backgroundColor: c.ink }]}>
                  <Ionicons name="checkmark" size={11} color={c.obsidian} />
                </View>
                <Text style={[styles.winText, { color: c.ink }]}>{w.text}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: { flexDirection: "row", alignItems: "center", gap: 18 },
  heroRight: { flex: 1 },
  h2: { fontFamily: fonts.displayBold, fontSize: 26, letterSpacing: -0.6, marginTop: 8 },
  heroMsg: { fontFamily: fonts.body, fontSize: 13, marginTop: 3, lineHeight: 18 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  chip: { borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 6 },
  chipText: { fontFamily: fonts.monoMedium, fontSize: 11 },
  ctaPill: {
    flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start",
    borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9, marginTop: 12,
  },
  ctaText: { fontFamily: fonts.bodyBold, fontSize: 13 },
  rowCenter: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionLabel: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.2 },
  focusWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  focusChip: {
    flexDirection: "row", alignItems: "center", gap: 6, borderRadius: radius.pill,
    borderWidth: 1, paddingHorizontal: 13, paddingVertical: 8,
  },
  focusChipText: { fontFamily: fonts.bodyMedium, fontSize: 14 },
  tinyLabel: { fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 1 },
  intention: { fontFamily: fonts.bodyMedium, fontSize: 14, marginTop: 2 },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 16 },
  metricCard: { flexGrow: 1, flexBasis: "46%" },
  metricValue: { fontFamily: fonts.displayBold, fontSize: 24, marginTop: 10, letterSpacing: -0.5 },
  metricLabel: { fontFamily: fonts.body, fontSize: 12, marginTop: 2 },
  winsHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  cardTitle: { fontFamily: fonts.display, fontSize: 17 },
  cardSub: { fontFamily: fonts.body, fontSize: 12, marginTop: 2 },
  viewAll: { fontFamily: fonts.body, fontSize: 12 },
  winRow: { flexDirection: "row", gap: 10 },
  addBtn: { width: 46, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  winItem: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10 },
  winCheck: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  winText: { fontFamily: fonts.body, fontSize: 14, flex: 1 },
});
