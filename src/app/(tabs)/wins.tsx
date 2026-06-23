import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/screen";
import { theme, radius } from "@/lib/theme";
import { useStore, today } from "@/lib/store";

export default function WinsScreen() {
  const { wins, addWin, deleteWin } = useStore();
  const [text, setText] = useState("");

  const submit = () => {
    addWin(text);
    setText("");
  };

  const todayStr = today();

  return (
    <Screen>
      <Text style={styles.eyebrow}>MOMENTUM</Text>
      <Text style={styles.title}>Small wins</Text>
      <Text style={styles.sub}>Log the little things. They compound.</Text>

      <View style={styles.row}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="What went well today?"
          placeholderTextColor={theme.inkFaint}
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={submit}
        />
        <Pressable style={styles.addBtn} onPress={submit}>
          <Ionicons name="add" size={22} color={theme.obsidian} />
        </Pressable>
      </View>

      {wins.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="sparkles-outline" size={28} color={theme.inkFaint} />
          <Text style={styles.emptyText}>No wins yet. Add your first one above.</Text>
        </View>
      ) : (
        <View style={{ marginTop: 18, gap: 10 }}>
          {wins.map((w) => (
            <View key={w.id} style={styles.item}>
              <View style={styles.check}>
                <Ionicons name="checkmark" size={13} color={theme.obsidian} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemText}>{w.text}</Text>
                <Text style={styles.itemDate}>
                  {w.date === todayStr ? "Today" : w.date}
                </Text>
              </View>
              <Pressable hitSlop={10} onPress={() => deleteWin(w.id)}>
                <Ionicons name="trash-outline" size={16} color={theme.inkFaint} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: theme.inkFaint, fontSize: 11, fontWeight: "700", letterSpacing: 1.5 },
  title: { color: theme.ink, fontSize: 28, fontWeight: "800", marginTop: 4, letterSpacing: -0.5 },
  sub: { color: theme.inkMuted, fontSize: 14, marginTop: 2, marginBottom: 18 },
  row: { flexDirection: "row", gap: 10 },
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
  emptyText: { color: theme.inkFaint, fontSize: 14 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: radius.md,
    padding: 14,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: { color: theme.ink, fontSize: 14 },
  itemDate: { color: theme.inkFaint, fontSize: 11, marginTop: 2 },
});
