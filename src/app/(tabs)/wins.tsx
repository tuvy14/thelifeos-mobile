import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/screen";
import { Card, Eyebrow, Field, EmptyState } from "@/components/ui";
import { PressableScale, Reveal } from "@/components/anim";
import { useTheme, radius, fonts } from "@/lib/theme";
import { useStore, winsSorted, today } from "@/lib/store";
import { cheer } from "@/lib/feedback";

export default function WinsScreen() {
  const { wins, addWin, deleteWin } = useStore();
  const { c } = useTheme();
  const [input, setInput] = useState("");

  const sorted = winsSorted(wins);
  const weekAgo = Date.now() - 7 * 864e5;
  const weekCount = sorted.filter((w) => w.ts >= weekAgo).length;
  const todayCount = sorted.filter((w) => w.date === today()).length;

  const submit = () => {
    if (!input.trim()) return;
    addWin(input);
    setInput("");
    cheer("win", "medium"); // small win, real feedback
  };

  const groups = sorted.reduce<Record<string, typeof sorted>>((acc, w) => {
    (acc[w.date] = acc[w.date] || []).push(w);
    return acc;
  }, {});

  const dateLabel = (date: string) =>
    date === today()
      ? "Today"
      : new Date(date + "T00:00:00").toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        });

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Eyebrow>Momentum</Eyebrow>
          <Text style={[styles.title, { color: c.ink }]}>Small wins</Text>
          <Text style={[styles.sub, { color: c.inkMuted }]}>
            <Text style={{ color: c.ink }}>{todayCount}</Text> today ·{" "}
            <Text style={{ color: c.ink }}>{weekCount}</Text> this week ·{" "}
            <Text style={{ color: c.ink }}>{sorted.length}</Text> all time
          </Text>
        </View>
        <Ionicons name="sparkles-outline" size={26} color={c.inkFaint} />
      </View>

      <Card style={{ marginTop: 18 }}>
        <View style={styles.row}>
          <Field
            value={input}
            onChangeText={setInput}
            placeholder="Log a small win…"
            style={{ flex: 1 }}
            returnKeyType="done"
            onSubmitEditing={submit}
          />
          <PressableScale style={[styles.addBtn, { backgroundColor: c.ink }]} onPress={submit}>
            <Ionicons name="add" size={20} color={c.obsidian} />
          </PressableScale>
        </View>
      </Card>

      {sorted.length === 0 ? (
        <View style={{ marginTop: 12 }}>
          <EmptyState icon="sparkles-outline" title="No wins yet" text="Start with one small thing that went well today — momentum compounds from here." />
        </View>
      ) : (
        <View style={{ marginTop: 20, gap: 20 }}>
          {Object.entries(groups).map(([date, items]) => (
            <View key={date}>
              <Text style={[styles.groupLabel, { color: c.inkFaint }]}>{dateLabel(date).toUpperCase()}</Text>
              <View style={{ gap: 8 }}>
                {items.map((w, idx) => (
                  <Reveal key={w.id} delay={idx * 45}>
                    <View style={[styles.item, { borderColor: c.line, backgroundColor: c.card }]}>
                      <View style={[styles.check, { backgroundColor: c.ink }]}>
                        <Ionicons name="checkmark" size={11} color={c.obsidian} />
                      </View>
                      <Text style={[styles.itemText, { color: c.ink }]}>{w.text}</Text>
                      <PressableScale hitSlop={10} scaleTo={0.85} onPress={() => deleteWin(w.id)}>
                        <Ionicons name="trash-outline" size={15} color={c.inkFaint} />
                      </PressableScale>
                    </View>
                  </Reveal>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  title: { fontFamily: fonts.displayBold, fontSize: 28, letterSpacing: -0.5, marginTop: 8 },
  sub: { fontFamily: fonts.body, fontSize: 13, marginTop: 4 },
  row: { flexDirection: "row", gap: 10 },
  addBtn: { width: 46, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  groupLabel: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.4, marginBottom: 10 },
  item: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12 },
  check: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  itemText: { fontFamily: fonts.body, fontSize: 14, flex: 1 },
});
