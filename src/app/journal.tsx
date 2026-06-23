import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { SubScreen } from "@/components/sub-screen";
import { Card, EmptyState, PrimaryButton } from "@/components/ui";
import { useTheme, radius, fonts } from "@/lib/theme";
import { useStore, today } from "@/lib/store";

export default function JournalScreen() {
  const { journal, addJournal, deleteJournal } = useStore();
  const { c } = useTheme();
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim()) return;
    addJournal(text);
    setText("");
  };

  const dateLabel = (date: string, ts: number) =>
    `${date === today() ? "Today" : new Date(date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · ${new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <SubScreen eyebrow="Reflect" title="Journal">
      <Card padding={16}>
        <Text style={[styles.label, { color: c.inkFaint }]}>WHAT&apos;S ON YOUR MIND?</Text>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Write freely. No one else sees this."
          placeholderTextColor={c.inkFaint}
          multiline
          style={[styles.input, { borderColor: c.line, backgroundColor: c.fill, color: c.ink }]}
        />
        <PrimaryButton label="Add entry" icon="add" onPress={submit} style={{ marginTop: 12 }} />
      </Card>

      {journal.length === 0 ? (
        <View style={{ marginTop: 12 }}>
          <EmptyState icon="book-outline" text="Nothing written yet. A sentence a day adds up." />
        </View>
      ) : (
        <View style={{ marginTop: 16, gap: 12 }}>
          {journal.map((j) => (
            <Card key={j.id} padding={16}>
              <View style={styles.head}>
                <Text style={[styles.date, { color: c.inkFaint }]}>{dateLabel(j.date, j.ts)}</Text>
                <Pressable hitSlop={10} onPress={() => deleteJournal(j.id)}>
                  <Ionicons name="trash-outline" size={15} color={c.inkFaint} />
                </Pressable>
              </View>
              <Text style={[styles.text, { color: c.ink }]}>{j.text}</Text>
            </Card>
          ))}
        </View>
      )}
    </SubScreen>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.2, marginBottom: 10 },
  input: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontFamily: fonts.body, fontSize: 14, minHeight: 96, textAlignVertical: "top" },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  date: { fontFamily: fonts.mono, fontSize: 11 },
  text: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21 },
});
