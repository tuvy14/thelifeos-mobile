import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { SubScreen } from "@/components/sub-screen";
import { Card, EmptyState } from "@/components/ui";
import { PressableScale, Reveal } from "@/components/anim";
import { useTheme, radius, fonts, type Palette } from "@/lib/theme";
import { useStore, isHabitDone, habitStreak, lastNDays, today } from "@/lib/store";

export default function HabitsScreen() {
  const { habits, habitLog, addHabit, deleteHabit, toggleHabit } = useStore();
  const { c } = useTheme();
  const s = makeStyles(c);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");

  const days = lastNDays(7);
  const doneToday = habits.filter((h) => (habitLog[today()] || []).includes(h.id)).length;

  const add = () => {
    if (!name.trim()) return;
    addHabit(name, emoji);
    setName("");
    setEmoji("");
  };

  return (
    <SubScreen eyebrow="Discipline" title="Habits">
      <Text style={s.sub}>
        {habits.length > 0 ? `${doneToday}/${habits.length} done today` : "Build the small daily reps."}
      </Text>

      <Card style={{ marginTop: 16 }} padding={16}>
        <View style={s.addRow}>
          <TextInput
            value={emoji}
            onChangeText={(t) => setEmoji(t.slice(0, 2))}
            placeholder="🔥"
            placeholderTextColor={c.inkFaint}
            style={s.emojiInput}
          />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="New habit (e.g. Read 20 min)"
            placeholderTextColor={c.inkFaint}
            style={s.nameInput}
            returnKeyType="done"
            onSubmitEditing={add}
          />
          <PressableScale style={[s.addBtn, { backgroundColor: c.ink }]} onPress={add}>
            <Ionicons name="add" size={20} color={c.obsidian} />
          </PressableScale>
        </View>
      </Card>

      {habits.length === 0 ? (
        <View style={{ marginTop: 12 }}>
          <EmptyState icon="flame-outline" title="No habits yet" text="Add one small daily habit — streaks are where momentum lives." />
        </View>
      ) : (
        <View style={{ marginTop: 14, gap: 12 }}>
          {habits.map((h, idx) => {
            const done = isHabitDone(habitLog, h.id);
            const stk = habitStreak(habitLog, h.id);
            return (
              <Reveal key={h.id} delay={idx * 50}>
              <Card padding={14}>
                <View style={s.habitRow}>
                  <PressableScale
                    onPress={() => toggleHabit(h.id)}
                    style={[s.toggle, { borderColor: done ? c.ink : c.line, backgroundColor: done ? c.ink : c.fill }]}
                  >
                    {done ? (
                      <Ionicons name="checkmark" size={20} color={c.obsidian} />
                    ) : (
                      <Text style={{ fontSize: 18 }}>{h.emoji}</Text>
                    )}
                  </PressableScale>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.habitName} numberOfLines={1}>{h.name}</Text>
                    <View style={s.streakRow}>
                      <Ionicons name="flame" size={12} color={c.inkMuted} />
                      <Text style={s.streakText}>{stk}-day streak</Text>
                    </View>
                  </View>
                  <PressableScale hitSlop={10} onPress={() => deleteHabit(h.id)}>
                    <Ionicons name="trash-outline" size={15} color={c.inkFaint} />
                  </PressableScale>
                </View>
                <View style={s.weekRow}>
                  {days.map((d) => {
                    const did = (habitLog[d] || []).includes(h.id);
                    return (
                      <View
                        key={d}
                        style={{ flex: 1, height: 22, borderRadius: 5, backgroundColor: did ? c.ink : c.fillStrong }}
                      />
                    );
                  })}
                </View>
              </Card>
              </Reveal>
            );
          })}
        </View>
      )}
    </SubScreen>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    sub: { fontFamily: fonts.body, fontSize: 13, color: c.inkMuted, marginTop: 4 },
    addRow: { flexDirection: "row", gap: 8 },
    emojiInput: { width: 52, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, backgroundColor: c.fill, textAlign: "center", fontSize: 18, color: c.ink, paddingVertical: 12 },
    nameInput: { flex: 1, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, backgroundColor: c.fill, paddingHorizontal: 14, color: c.ink, fontFamily: fonts.body, fontSize: 14 },
    addBtn: { width: 46, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
    habitRow: { flexDirection: "row", alignItems: "center", gap: 14 },
    toggle: { width: 44, height: 44, borderRadius: radius.md, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    habitName: { fontFamily: fonts.bodySemibold, fontSize: 14, color: c.ink },
    streakRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
    streakText: { fontFamily: fonts.body, fontSize: 12, color: c.inkMuted },
    weekRow: { flexDirection: "row", gap: 5, marginTop: 14 },
  });
