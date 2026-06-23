import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { SubScreen } from "@/components/sub-screen";
import { Card, EmptyState } from "@/components/ui";
import { PressableScale } from "@/components/anim";
import { useTheme, radius, fonts, type Palette } from "@/lib/theme";
import { useStore, workoutStreak, lastNDays, today } from "@/lib/store";

const TYPES = ["Gym", "Run", "Cycle", "Lift", "Yoga", "Sport", "Walk", "Other"];

export default function FitnessScreen() {
  const { workouts, addWorkout, deleteWorkout } = useStore();
  const { c } = useTheme();
  const s = makeStyles(c);
  const [type, setType] = useState(TYPES[0]);
  const [duration, setDuration] = useState("");
  const [note, setNote] = useState("");

  const streak = workoutStreak(workouts);
  const weekAgo = Date.now() - 7 * 864e5;
  const weekCount = workouts.filter((w) => w.ts >= weekAgo).length;
  const days = lastNDays(7);
  const workoutDates = new Set(workouts.map((w) => w.date));

  const add = () => {
    addWorkout(type, parseFloat(duration) || 0, note);
    setDuration(""); setNote("");
  };

  const stats = [
    { label: "Sessions", value: String(workouts.length) },
    { label: "This week", value: String(weekCount) },
    { label: "Streak", value: String(streak) },
  ];

  return (
    <SubScreen eyebrow="Body" title="Fitness">
      <Text style={s.sub}>Log every session. Showing up is the win.</Text>

      <View style={s.statRow}>
        {stats.map((st) => (
          <Card key={st.label} style={{ flex: 1 }} padding={14}>
            <Text style={s.statValue}>{st.value}</Text>
            <Text style={s.statLabel}>{st.label}</Text>
          </Card>
        ))}
      </View>

      {/* Week dots */}
      <Card style={{ marginTop: 14, flexDirection: "row", justifyContent: "space-between" }} padding={16}>
        {days.map((d) => {
          const done = workoutDates.has(d);
          return (
            <View key={d} style={{ alignItems: "center", gap: 8 }}>
              <View style={[s.dot, { borderColor: done ? c.ink : c.line, backgroundColor: done ? c.ink : c.fill }]}>
                {done && <Ionicons name="barbell" size={14} color={c.obsidian} />}
              </View>
              <Text style={s.dotLabel}>{new Date(d + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1)}</Text>
            </View>
          );
        })}
      </Card>

      <Card style={{ marginTop: 14 }}>
        <Text style={s.label}>LOG A WORKOUT</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }} contentContainerStyle={{ gap: 8 }}>
          {TYPES.map((t) => {
            const on = type === t;
            return (
              <PressableScale key={t} onPress={() => setType(t)} style={[s.typeChip, { borderColor: on ? c.ink : c.line, backgroundColor: on ? c.ink : "transparent" }]}>
                <Text style={[s.typeChipText, { color: on ? c.obsidian : c.inkMuted }]}>{t}</Text>
              </PressableScale>
            );
          })}
        </ScrollView>
        <View style={s.formRow}>
          <View style={[s.durBox, { borderColor: c.line, backgroundColor: c.fill }]}>
            <TextInput value={duration} onChangeText={setDuration} keyboardType="numeric" placeholder="0" placeholderTextColor={c.inkFaint} style={s.durInput} />
            <Text style={s.durUnit}>min</Text>
          </View>
          <TextInput value={note} onChangeText={setNote} placeholder="Note (optional)" placeholderTextColor={c.inkFaint} style={[s.noteInput, { borderColor: c.line, backgroundColor: c.fill }]} />
          <PressableScale style={[s.addBtn, { backgroundColor: c.ink }]} onPress={add}>
            <Ionicons name="add" size={20} color={c.obsidian} />
          </PressableScale>
        </View>
      </Card>

      {workouts.length === 0 ? (
        <View style={{ marginTop: 12 }}>
          <EmptyState icon="barbell-outline" text="No workouts yet. Log your first session above." />
        </View>
      ) : (
        <View style={{ marginTop: 16, gap: 8 }}>
          {workouts.map((w) => (
            <View key={w.id} style={[s.item, { borderColor: c.line, backgroundColor: c.card }]}>
              <View style={[s.itemIcon, { borderColor: c.line, backgroundColor: c.fill }]}>
                <Ionicons name="barbell-outline" size={16} color={c.ink} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.itemType}>{w.type}{w.duration ? ` · ${w.duration} min` : ""}</Text>
                <Text style={s.itemSub}>{w.note ? w.note + " · " : ""}{w.date === today() ? "Today" : w.date}</Text>
              </View>
              <PressableScale hitSlop={8} onPress={() => deleteWorkout(w.id)}>
                <Ionicons name="trash-outline" size={15} color={c.inkFaint} />
              </PressableScale>
            </View>
          ))}
        </View>
      )}
    </SubScreen>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    sub: { fontFamily: fonts.body, fontSize: 13, color: c.inkMuted, marginTop: 4 },
    statRow: { flexDirection: "row", gap: 10, marginTop: 16 },
    statValue: { fontFamily: fonts.displayBold, fontSize: 22, color: c.ink },
    statLabel: { fontFamily: fonts.body, fontSize: 11, color: c.inkFaint, marginTop: 2 },
    dot: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    dotLabel: { fontFamily: fonts.mono, fontSize: 10, color: c.inkFaint },
    label: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.2, color: c.inkFaint },
    typeChip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
    typeChipText: { fontFamily: fonts.bodyMedium, fontSize: 13 },
    formRow: { flexDirection: "row", gap: 8 },
    durBox: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 12 },
    durInput: { width: 44, paddingVertical: 12, color: c.ink, fontFamily: fonts.body, fontSize: 14 },
    durUnit: { fontFamily: fonts.mono, fontSize: 12, color: c.inkFaint },
    noteInput: { flex: 1, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, color: c.ink, fontFamily: fonts.body, fontSize: 14 },
    addBtn: { width: 46, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
    item: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 11 },
    itemIcon: { width: 36, height: 36, borderRadius: radius.sm, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    itemType: { fontFamily: fonts.bodySemibold, fontSize: 14, color: c.ink },
    itemSub: { fontFamily: fonts.body, fontSize: 12, color: c.inkFaint, marginTop: 2 },
  });
