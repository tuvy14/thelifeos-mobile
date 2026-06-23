import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { SubScreen } from "@/components/sub-screen";
import { theme, radius } from "@/lib/theme";
import { useStore } from "@/lib/store";

export default function GoalsScreen() {
  const { goals, addGoal, setGoalProgress, deleteGoal } = useStore();
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("");

  const submit = () => {
    const t = parseFloat(target);
    addGoal(title, Number.isFinite(t) ? t : 1, unit);
    setTitle("");
    setTarget("");
    setUnit("");
  };

  return (
    <SubScreen eyebrow="WHERE YOU'RE HEADED" title="Goals">
      <View style={styles.card}>
        <Text style={styles.cardLabel}>New goal</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Run 100 km this month"
          placeholderTextColor={theme.inkFaint}
          style={styles.input}
        />
        <View style={styles.twoCol}>
          <TextInput
            value={target}
            onChangeText={setTarget}
            placeholder="Target"
            placeholderTextColor={theme.inkFaint}
            keyboardType="numeric"
            style={[styles.input, { flex: 1, marginTop: 0 }]}
          />
          <TextInput
            value={unit}
            onChangeText={setUnit}
            placeholder="Unit (km, books…)"
            placeholderTextColor={theme.inkFaint}
            style={[styles.input, { flex: 1.4, marginTop: 0 }]}
          />
        </View>
        <Pressable style={styles.addBtn} onPress={submit}>
          <Text style={styles.addBtnText}>Add goal</Text>
        </Pressable>
      </View>

      {goals.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="flag-outline" size={28} color={theme.inkFaint} />
          <Text style={styles.emptyText}>No goals yet. Aim at something.</Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {goals.map((g) => {
            const pct = Math.min(1, g.current / (g.target || 1));
            const done = g.current >= g.target;
            return (
              <View key={g.id} style={styles.goal}>
                <View style={styles.goalHead}>
                  <Text style={styles.goalTitle}>{g.title}</Text>
                  <Pressable hitSlop={10} onPress={() => deleteGoal(g.id)}>
                    <Ionicons name="trash-outline" size={16} color={theme.inkFaint} />
                  </Pressable>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${pct * 100}%` }]} />
                </View>
                <View style={styles.goalFoot}>
                  <Text style={[styles.goalNums, done && { color: theme.ink }]}>
                    {round(g.current)} / {round(g.target)} {g.unit}
                    {done ? "  ✓" : ""}
                  </Text>
                  <View style={styles.stepRow}>
                    <Pressable
                      style={styles.step}
                      onPress={() => setGoalProgress(g.id, g.current - stepFor(g.target))}
                    >
                      <Ionicons name="remove" size={16} color={theme.ink} />
                    </Pressable>
                    <Pressable
                      style={styles.step}
                      onPress={() => setGoalProgress(g.id, g.current + stepFor(g.target))}
                    >
                      <Ionicons name="add" size={16} color={theme.ink} />
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </SubScreen>
  );
}

const round = (n: number) => Math.round(n * 100) / 100;
const stepFor = (target: number) => (target >= 50 ? 5 : target >= 10 ? 1 : 0.5);

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 16,
    marginBottom: 18,
  },
  cardLabel: { color: theme.inkFaint, fontSize: 11, fontWeight: "700", letterSpacing: 1.2, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.ink,
    fontSize: 14,
    marginTop: 10,
  },
  twoCol: { flexDirection: "row", gap: 10, marginTop: 10 },
  addBtn: {
    backgroundColor: theme.ink,
    borderRadius: radius.md,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 12,
  },
  addBtnText: { color: theme.obsidian, fontSize: 14, fontWeight: "800" },
  empty: { alignItems: "center", gap: 10, paddingVertical: 48 },
  emptyText: { color: theme.inkFaint, fontSize: 14, textAlign: "center" },
  goal: {
    backgroundColor: theme.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 16,
  },
  goalHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  goalTitle: { color: theme.ink, fontSize: 15, fontWeight: "700", flex: 1, paddingRight: 10 },
  track: { height: 8, borderRadius: 4, backgroundColor: theme.line, overflow: "hidden" },
  fill: { height: 8, borderRadius: 4, backgroundColor: theme.ink },
  goalFoot: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  goalNums: { color: theme.inkMuted, fontSize: 13, fontWeight: "600" },
  stepRow: { flexDirection: "row", gap: 8 },
  step: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: theme.line,
    alignItems: "center",
    justifyContent: "center",
  },
});
