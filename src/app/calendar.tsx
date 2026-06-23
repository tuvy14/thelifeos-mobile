import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { SubScreen } from "@/components/sub-screen";
import { Card, EmptyState } from "@/components/ui";
import { PressableScale } from "@/components/anim";
import { useTheme, radius, fonts, type Palette } from "@/lib/theme";
import { useStore, today, type EventPriority } from "@/lib/store";

const PRIORITIES: EventPriority[] = ["low", "medium", "high"];
const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function CalendarScreen() {
  const { calendar, addCalendarEvent, toggleCalendarEvent, removeCalendarEvent } = useStore();
  const { c } = useTheme();
  const s = makeStyles(c);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(today());
  const [priority, setPriority] = useState<EventPriority>("medium");

  const next14 = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const add = () => {
    if (!title.trim()) return;
    addCalendarEvent(title, date, priority);
    setTitle("");
  };

  const sorted = [...calendar].sort((a, b) => (a.date < b.date ? -1 : 1));
  const groups = sorted.reduce<Record<string, typeof sorted>>((acc, e) => {
    (acc[e.date] = acc[e.date] || []).push(e);
    return acc;
  }, {});

  const dateLabel = (d: string) =>
    d === today() ? "Today" : new Date(d + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
  const prColor = (p: EventPriority) => (p === "high" ? c.danger : p === "medium" ? c.ink : c.inkFaint);

  return (
    <SubScreen eyebrow="Plan" title="Calendar">
      <Text style={s.sub}>Schedule what matters. Tap to mark done.</Text>

      <Card style={{ marginTop: 16 }}>
        <Text style={s.label}>WHEN</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }} contentContainerStyle={{ gap: 8 }}>
          {next14.map((d) => {
            const ds = ymd(d);
            const on = ds === date;
            return (
              <PressableScale key={ds} onPress={() => setDate(ds)} style={[s.dayChip, { borderColor: on ? c.ink : c.line, backgroundColor: on ? c.ink : "transparent" }]}>
                <Text style={[s.dayDow, { color: on ? c.obsidian : c.inkFaint }]}>{d.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase()}</Text>
                <Text style={[s.dayNum, { color: on ? c.obsidian : c.ink }]}>{d.getDate()}</Text>
              </PressableScale>
            );
          })}
        </ScrollView>
        <View style={s.formRow}>
          <TextInput value={title} onChangeText={setTitle} placeholder="Task or event…" placeholderTextColor={c.inkFaint} style={[s.input, { borderColor: c.line, backgroundColor: c.fill }]} returnKeyType="done" onSubmitEditing={add} />
          <PressableScale style={[s.addBtn, { backgroundColor: c.ink }]} onPress={add}>
            <Ionicons name="add" size={20} color={c.obsidian} />
          </PressableScale>
        </View>
        <View style={s.prRow}>
          {PRIORITIES.map((p) => {
            const on = priority === p;
            return (
              <PressableScale key={p} onPress={() => setPriority(p)} style={[s.prChip, { borderColor: on ? c.ink : c.line, backgroundColor: on ? c.ink : "transparent" }]}>
                <View style={[s.prDot, { backgroundColor: prColor(p) }]} />
                <Text style={[s.prText, { color: on ? c.obsidian : c.inkMuted }]}>{p}</Text>
              </PressableScale>
            );
          })}
        </View>
      </Card>

      {sorted.length === 0 ? (
        <View style={{ marginTop: 12 }}>
          <EmptyState icon="calendar-outline" text="Nothing scheduled. Add your first task above." />
        </View>
      ) : (
        <View style={{ marginTop: 20, gap: 18 }}>
          {Object.entries(groups).map(([d, items]) => (
            <View key={d}>
              <Text style={s.groupLabel}>{dateLabel(d).toUpperCase()}</Text>
              <View style={{ gap: 8 }}>
                {items.map((e) => (
                  <View key={e.id} style={[s.item, { borderColor: c.line, backgroundColor: c.card }]}>
                    <PressableScale onPress={() => toggleCalendarEvent(e.id)} style={[s.box, { borderColor: e.done ? c.ink : c.line, backgroundColor: e.done ? c.ink : "transparent" }]}>
                      {e.done && <Ionicons name="checkmark" size={13} color={c.obsidian} />}
                    </PressableScale>
                    <View style={[s.prDot, { backgroundColor: prColor(e.priority) }]} />
                    <Text style={[s.itemText, { color: c.ink, textDecorationLine: e.done ? "line-through" : "none", opacity: e.done ? 0.5 : 1 }]} numberOfLines={2}>{e.title}</Text>
                    <PressableScale hitSlop={8} onPress={() => removeCalendarEvent(e.id)}>
                      <Ionicons name="trash-outline" size={15} color={c.inkFaint} />
                    </PressableScale>
                  </View>
                ))}
              </View>
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
    label: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.2, color: c.inkFaint },
    dayChip: { alignItems: "center", borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8, minWidth: 48 },
    dayDow: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 0.5 },
    dayNum: { fontFamily: fonts.displayBold, fontSize: 16, marginTop: 2 },
    formRow: { flexDirection: "row", gap: 8 },
    input: { flex: 1, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, color: c.ink, fontFamily: fonts.body, fontSize: 14 },
    addBtn: { width: 46, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
    prRow: { flexDirection: "row", gap: 8, marginTop: 10 },
    prChip: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
    prDot: { width: 8, height: 8, borderRadius: 4 },
    prText: { fontFamily: fonts.bodyMedium, fontSize: 12, textTransform: "capitalize" },
    groupLabel: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.4, color: c.inkFaint, marginBottom: 10 },
    item: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12 },
    box: { width: 22, height: 22, borderRadius: 6, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    itemText: { flex: 1, fontFamily: fonts.body, fontSize: 14 },
  });
