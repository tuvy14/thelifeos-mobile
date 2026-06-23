import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { SubScreen } from "@/components/sub-screen";
import { Card, EmptyState } from "@/components/ui";
import { useTheme, radius, fonts, type Palette } from "@/lib/theme";
import { useStore, memoriesFor } from "@/lib/store";

const INTERVALS = [
  { days: 1, label: "Yesterday" },
  { days: 7, label: "A week ago" },
  { days: 30, label: "A month ago" },
  { days: 90, label: "3 months ago" },
  { days: 365, label: "A year ago" },
];

export default function MemoriesScreen() {
  const { logs, wins, journal, workouts } = useStore();
  const { c } = useTheme();
  const s = makeStyles(c);

  const cards = INTERVALS.map((iv) => ({ ...iv, ...memoriesFor({ logs, wins, journal, workouts }, iv.days) }))
    .filter((m) => m.score > 0 || m.wins.length || m.journal.length || m.workouts.length);

  return (
    <SubScreen eyebrow="On this day" title="Memories">
      <Text style={s.sub}>Look back at where you were. Progress is easy to forget.</Text>

      {cards.length === 0 ? (
        <View style={{ marginTop: 12 }}>
          <EmptyState icon="time-outline" text="Your memories will appear here as you check in over time." />
        </View>
      ) : (
        <View style={{ marginTop: 16, gap: 12 }}>
          {cards.map((m) => (
            <Card key={m.days}>
              <View style={s.head}>
                <Text style={s.label}>{m.label.toUpperCase()}</Text>
                <Text style={s.date}>{m.date}</Text>
              </View>
              <View style={s.statsRow}>
                <View style={s.stat}><Text style={s.statVal}>{m.score}</Text><Text style={s.statLabel}>score</Text></View>
                <View style={s.stat}><Text style={s.statVal}>{m.wins.length}</Text><Text style={s.statLabel}>wins</Text></View>
                <View style={s.stat}><Text style={s.statVal}>{m.workouts.length}</Text><Text style={s.statLabel}>workouts</Text></View>
              </View>
              {m.wins.slice(0, 2).map((w) => (
                <View key={w.id} style={s.line}>
                  <Ionicons name="sparkles-outline" size={13} color={c.inkMuted} />
                  <Text style={s.lineText} numberOfLines={1}>{w.text}</Text>
                </View>
              ))}
              {m.journal.slice(0, 1).map((j) => (
                <View key={j.id} style={s.line}>
                  <Ionicons name="book-outline" size={13} color={c.inkMuted} />
                  <Text style={s.lineText} numberOfLines={2}>{j.text}</Text>
                </View>
              ))}
            </Card>
          ))}
        </View>
      )}
    </SubScreen>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    sub: { fontFamily: fonts.body, fontSize: 13, color: c.inkMuted, marginTop: 4 },
    head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    label: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.2, color: c.ink },
    date: { fontFamily: fonts.mono, fontSize: 11, color: c.inkFaint },
    statsRow: { flexDirection: "row", gap: 24 },
    stat: { alignItems: "flex-start" },
    statVal: { fontFamily: fonts.displayBold, fontSize: 22, color: c.ink },
    statLabel: { fontFamily: fonts.body, fontSize: 11, color: c.inkFaint },
    line: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
    lineText: { fontFamily: fonts.body, fontSize: 13, color: c.inkMuted, flex: 1 },
  });
