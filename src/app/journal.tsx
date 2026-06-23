import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { SubScreen } from "@/components/sub-screen";
import { theme, radius } from "@/lib/theme";
import { useStore, today } from "@/lib/store";

export default function JournalScreen() {
  const { journal, addJournal, deleteJournal } = useStore();
  const [text, setText] = useState("");

  const submit = () => {
    addJournal(text);
    setText("");
  };

  const todayStr = today();

  return (
    <SubScreen eyebrow="CLEAR YOUR HEAD" title="Journal">
      <View style={styles.card}>
        <Text style={styles.cardLabel}>What&apos;s on your mind?</Text>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Write freely. No one else sees this."
          placeholderTextColor={theme.inkFaint}
          style={styles.input}
          multiline
        />
        <Pressable style={styles.addBtn} onPress={submit}>
          <Ionicons name="add" size={18} color={theme.obsidian} />
          <Text style={styles.addBtnText}>Add entry</Text>
        </Pressable>
      </View>

      {journal.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="book-outline" size={28} color={theme.inkFaint} />
          <Text style={styles.emptyText}>No entries yet. Start writing.</Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {journal.map((j) => (
            <View key={j.id} style={styles.entry}>
              <View style={styles.entryHead}>
                <Text style={styles.entryDate}>
                  {j.date === todayStr ? "Today" : j.date} ·{" "}
                  {new Date(j.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
                <Pressable hitSlop={10} onPress={() => deleteJournal(j.id)}>
                  <Ionicons name="trash-outline" size={16} color={theme.inkFaint} />
                </Pressable>
              </View>
              <Text style={styles.entryText}>{j.text}</Text>
            </View>
          ))}
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
  input: {
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.ink,
    fontSize: 14,
    minHeight: 96,
    textAlignVertical: "top",
  },
  addBtn: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: theme.ink,
    borderRadius: radius.md,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  addBtnText: { color: theme.obsidian, fontSize: 14, fontWeight: "800" },
  empty: { alignItems: "center", gap: 10, paddingVertical: 48 },
  emptyText: { color: theme.inkFaint, fontSize: 14, textAlign: "center" },
  entry: {
    backgroundColor: theme.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 16,
  },
  entryHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  entryDate: { color: theme.inkFaint, fontSize: 12, fontWeight: "600" },
  entryText: { color: theme.ink, fontSize: 14, lineHeight: 21 },
});
