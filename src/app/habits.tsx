import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { SubScreen } from "@/components/sub-screen";
import { theme, radius } from "@/lib/theme";
import { useStore, habitDoneToday, habitStreak, HABIT_EMOJIS } from "@/lib/store";

export default function HabitsScreen() {
  const { habits, addHabit, toggleHabit, deleteHabit } = useStore();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(HABIT_EMOJIS[0]);

  const submit = () => {
    addHabit(name, emoji);
    setName("");
    setEmoji(HABIT_EMOJIS[0]);
  };

  return (
    <SubScreen eyebrow="DAILY REPS" title="Habits">
      <View style={styles.card}>
        <Text style={styles.cardLabel}>New habit</Text>
        <View style={styles.emojiRow}>
          {HABIT_EMOJIS.map((e) => (
            <Pressable
              key={e}
              onPress={() => setEmoji(e)}
              style={[styles.emoji, emoji === e && styles.emojiOn]}
            >
              <Text style={styles.emojiText}>{e}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.addRow}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Read 10 pages"
            placeholderTextColor={theme.inkFaint}
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={submit}
          />
          <Pressable style={styles.addBtn} onPress={submit}>
            <Ionicons name="add" size={22} color={theme.obsidian} />
          </Pressable>
        </View>
      </View>

      {habits.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="repeat-outline" size={28} color={theme.inkFaint} />
          <Text style={styles.emptyText}>No habits yet. Add one to start a streak.</Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {habits.map((h) => {
            const done = habitDoneToday(h);
            const s = habitStreak(h);
            return (
              <View key={h.id} style={styles.item}>
                <Pressable
                  onPress={() => toggleHabit(h.id)}
                  style={[styles.toggle, done && styles.toggleOn]}
                >
                  {done ? (
                    <Ionicons name="checkmark" size={18} color={theme.obsidian} />
                  ) : (
                    <Text style={styles.toggleEmoji}>{h.emoji}</Text>
                  )}
                </Pressable>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{h.name}</Text>
                  <Text style={styles.itemMeta}>
                    {s > 0 ? `🔥 ${s}-day streak` : "Tap to mark done"}
                  </Text>
                </View>
                <Pressable hitSlop={10} onPress={() => deleteHabit(h.id)}>
                  <Ionicons name="trash-outline" size={16} color={theme.inkFaint} />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
    </SubScreen>
  );
}

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
  emojiRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  emoji: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.line,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiOn: { borderColor: theme.ink, backgroundColor: theme.surfaceAlt },
  emojiText: { fontSize: 18 },
  addRow: { flexDirection: "row", gap: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.ink,
    fontSize: 14,
  },
  addBtn: {
    width: 46,
    backgroundColor: theme.ink,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { alignItems: "center", gap: 10, paddingVertical: 48 },
  emptyText: { color: theme.inkFaint, fontSize: 14, textAlign: "center" },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 14,
  },
  toggle: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.line,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleOn: { backgroundColor: theme.ink, borderColor: theme.ink },
  toggleEmoji: { fontSize: 20 },
  itemName: { color: theme.ink, fontSize: 15, fontWeight: "600" },
  itemMeta: { color: theme.inkFaint, fontSize: 12, marginTop: 2 },
});
