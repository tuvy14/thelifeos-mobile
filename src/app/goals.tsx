import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { SubScreen } from "@/components/sub-screen";
import { Card, EmptyState, PrimaryButton } from "@/components/ui";
import { PressableScale, Reveal } from "@/components/anim";
import { useTheme, radius, fonts, type Palette } from "@/lib/theme";
import { useStore } from "@/lib/store";

const CATEGORIES = ["Money", "Body", "Audience", "Skill", "Mind", "Life"];

export default function GoalsScreen() {
  const { goals, addGoal, setGoalProgress, deleteGoal } = useStore();
  const { c } = useTheme();
  const s = makeStyles(c);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);

  const completed = goals.filter((g) => g.current >= g.target).length;

  const create = () => {
    if (!title.trim() || !+target) return;
    addGoal({ title, category, current: 0, target: +target, unit });
    setTitle(""); setTarget(""); setUnit(""); setOpen(false);
  };
  const step = (id: string, current: number, tgt: number, dir: number) => {
    const inc = Math.max(1, Math.round(tgt / 20));
    setGoalProgress(id, Math.min(Math.max(0, current + dir * inc), tgt));
  };

  return (
    <SubScreen eyebrow="Direction" title="Goals">
      <View style={s.headRow}>
        <Text style={s.sub}>
          {goals.length > 0 ? `${completed}/${goals.length} reached` : "Aim at something that matters."}
        </Text>
        <PressableScale style={[s.newBtn, { backgroundColor: c.ink }]} onPress={() => setOpen((o) => !o)}>
          <Ionicons name="add" size={16} color={c.obsidian} />
          <Text style={[s.newText, { color: c.obsidian }]}>New goal</Text>
        </PressableScale>
      </View>

      {open && (
        <Card style={{ marginTop: 14, gap: 12 }} padding={16}>
          <TextInput
            value={title} onChangeText={setTitle} placeholder="Goal (e.g. Reach 10k followers)"
            placeholderTextColor={c.inkFaint} style={s.input}
          />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TextInput
              value={target} onChangeText={setTarget} placeholder="Target" keyboardType="numeric"
              placeholderTextColor={c.inkFaint} style={[s.input, { width: 110 }]}
            />
            <TextInput
              value={unit} onChangeText={setUnit} placeholder="unit ($, kg, followers…)"
              placeholderTextColor={c.inkFaint} style={[s.input, { flex: 1 }]}
            />
          </View>
          <View style={s.catWrap}>
            {CATEGORIES.map((cat) => {
              const on = category === cat;
              return (
                <PressableScale
                  key={cat} onPress={() => setCategory(cat)}
                  style={[s.cat, { borderColor: on ? c.ink : c.line, backgroundColor: on ? c.ink : "transparent" }]}
                >
                  <Text style={[s.catText, { color: on ? c.obsidian : c.inkMuted }]}>{cat}</Text>
                </PressableScale>
              );
            })}
          </View>
          <PrimaryButton label="Add goal" onPress={create} />
        </Card>
      )}

      {goals.length === 0 && !open ? (
        <View style={{ marginTop: 12 }}>
          <EmptyState icon="flag-outline" text="Set a target you care about — progress feels good when it's visible." />
        </View>
      ) : (
        <View style={{ marginTop: 14, gap: 12 }}>
          {goals.map((g, idx) => {
            const pct = Math.min(Math.round((g.current / g.target) * 100) || 0, 100);
            const done = g.current >= g.target;
            return (
              <Reveal key={g.id} delay={idx * 50}>
              <Card padding={16}>
                <View style={s.goalTop}>
                  <View style={{ flex: 1 }}>
                    <View style={s.titleRow}>
                      <Text style={s.goalTitle} numberOfLines={1}>{g.title}</Text>
                      {done && (
                        <View style={[s.donePill, { backgroundColor: c.ink }]}>
                          <Text style={[s.donePillText, { color: c.obsidian }]}>DONE</Text>
                        </View>
                      )}
                    </View>
                    <View style={[s.catBadge, { borderColor: c.line }]}>
                      <Text style={s.catBadgeText}>{g.category}</Text>
                    </View>
                  </View>
                  <PressableScale hitSlop={10} onPress={() => deleteGoal(g.id)}>
                    <Ionicons name="trash-outline" size={15} color={c.inkFaint} />
                  </PressableScale>
                </View>

                <View style={s.numsRow}>
                  <Text style={s.nums}>
                    {g.current.toLocaleString()} / {g.target.toLocaleString()} {g.unit}
                  </Text>
                  <Text style={s.pct}>{pct}%</Text>
                </View>
                <View style={[s.track, { backgroundColor: c.fillStrong }]}>
                  <View style={[s.fill, { width: `${pct}%`, backgroundColor: c.ink }]} />
                </View>

                <View style={s.stepRow}>
                  <PressableScale style={[s.step, { borderColor: c.line }]} onPress={() => step(g.id, g.current, g.target, -1)}>
                    <Ionicons name="remove" size={16} color={c.inkMuted} />
                  </PressableScale>
                  <PressableScale style={[s.step, { borderColor: c.line }]} onPress={() => step(g.id, g.current, g.target, 1)}>
                    <Ionicons name="add" size={16} color={c.inkMuted} />
                  </PressableScale>
                  <TextInput
                    defaultValue={String(g.current)}
                    onEndEditing={(e) => setGoalProgress(g.id, +e.nativeEvent.text || 0)}
                    keyboardType="numeric" placeholder="set" placeholderTextColor={c.inkFaint}
                    style={[s.setInput, { borderColor: c.line, color: c.ink }]}
                  />
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
    headRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
    sub: { fontFamily: fonts.body, fontSize: 13, color: c.inkMuted, flex: 1 },
    newBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9 },
    newText: { fontFamily: fonts.bodyBold, fontSize: 13 },
    input: { borderWidth: 1, borderColor: c.line, borderRadius: radius.md, backgroundColor: c.fill, paddingHorizontal: 14, paddingVertical: 12, color: c.ink, fontFamily: fonts.body, fontSize: 14 },
    catWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    cat: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 13, paddingVertical: 7 },
    catText: { fontFamily: fonts.bodyBold, fontSize: 12 },
    goalTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    goalTitle: { fontFamily: fonts.display, fontSize: 16, color: c.ink, flexShrink: 1 },
    donePill: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
    donePillText: { fontFamily: fonts.monoSemibold, fontSize: 9, letterSpacing: 1 },
    catBadge: { alignSelf: "flex-start", borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, marginTop: 6 },
    catBadgeText: { fontFamily: fonts.body, fontSize: 11, color: c.inkMuted },
    numsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
    nums: { fontFamily: fonts.mono, fontSize: 13, color: c.inkMuted },
    pct: { fontFamily: fonts.displayBold, fontSize: 15, color: c.ink },
    track: { height: 8, borderRadius: 4, overflow: "hidden", marginTop: 8 },
    fill: { height: 8, borderRadius: 4 },
    stepRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 },
    step: { width: 34, height: 34, borderRadius: radius.sm, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    setInput: { width: 90, height: 34, borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 12, fontFamily: fonts.body, fontSize: 14 },
  });
