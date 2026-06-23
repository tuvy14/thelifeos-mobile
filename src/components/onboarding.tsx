import { useState } from "react";
import { ScrollView, View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useTheme, radius, fonts, type Palette } from "@/lib/theme";
import { useStore, FOCUS_AREAS } from "@/lib/store";

const FOCUS_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  fitness: "barbell-outline", focus: "timer-outline", business: "trending-up-outline",
  creator: "videocam-outline", money: "cash-outline", mind: "leaf-outline",
  habits: "repeat-outline", learn: "book-outline",
};

export default function Onboarding() {
  const { completeOnboarding } = useStore();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const s = makeStyles(c);
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const finish = () => completeOnboarding(name, picked.length ? picked : ["habits"]);

  return (
    <View style={{ flex: 1, backgroundColor: c.obsidian }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 32, paddingHorizontal: 24, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.wordmark}>TheLife<Text style={{ color: c.inkMuted }}>OS</Text></Text>
        <Text style={s.h1}>Run your life like an operating system.</Text>
        <Text style={s.lead}>One daily check-in. Small wins that compound. Everything in one private place.</Text>

        <Text style={s.label}>WHAT SHOULD WE CALL YOU?</Text>
        <TextInput
          value={name} onChangeText={setName} placeholder="Your name (optional)"
          placeholderTextColor={c.inkFaint}
          style={[s.input, { borderColor: c.line, backgroundColor: c.fill, color: c.ink }]}
        />

        <Text style={[s.label, { marginTop: 28 }]}>WHAT DO YOU WANT TO FOCUS ON?</Text>
        <Text style={s.labelSub}>Pick as many as you like — we&apos;ll tailor your check-in and seed a few starter goals.</Text>
        <View style={s.grid}>
          {FOCUS_AREAS.map((f) => {
            const on = picked.includes(f.id);
            return (
              <Pressable
                key={f.id}
                onPress={() => toggle(f.id)}
                style={[s.card, { borderColor: on ? c.ink : c.line, backgroundColor: on ? c.ink : c.card }]}
              >
                <View style={s.cardHead}>
                  <Ionicons name={FOCUS_ICON[f.id] ?? "ellipse-outline"} size={18} color={on ? c.obsidian : c.ink} />
                  {on && <Ionicons name="checkmark-circle" size={16} color={c.obsidian} />}
                </View>
                <Text style={[s.cardTitle, { color: on ? c.obsidian : c.ink }]}>{f.label}</Text>
                <Text style={[s.cardDesc, { color: on ? c.obsidian : c.inkFaint }]} numberOfLines={2}>{f.description}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[s.footer, { backgroundColor: c.obsidian, borderTopColor: c.line, paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={[s.cta, { backgroundColor: c.ink }]} onPress={finish}>
          <Text style={[s.ctaText, { color: c.obsidian }]}>
            {picked.length ? `Start with ${picked.length} focus${picked.length > 1 ? "es" : ""}` : "Start"}
          </Text>
          <Ionicons name="arrow-forward" size={16} color={c.obsidian} />
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    wordmark: { fontFamily: fonts.displayBold, fontSize: 18, color: c.ink, letterSpacing: -0.3 },
    h1: { fontFamily: fonts.displayBold, fontSize: 30, color: c.ink, letterSpacing: -0.8, lineHeight: 36, marginTop: 24 },
    lead: { fontFamily: fonts.body, fontSize: 15, color: c.inkMuted, lineHeight: 22, marginTop: 12 },
    label: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.6, color: c.inkFaint, marginTop: 32, marginBottom: 10 },
    labelSub: { fontFamily: fonts.body, fontSize: 13, color: c.inkMuted, marginTop: -4, marginBottom: 14, lineHeight: 18 },
    input: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14, fontFamily: fonts.body, fontSize: 15 },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    card: { flexGrow: 1, flexBasis: "46%", borderWidth: 1, borderRadius: radius.lg, padding: 16, minHeight: 104 },
    cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
    cardTitle: { fontFamily: fonts.display, fontSize: 15 },
    cardDesc: { fontFamily: fonts.body, fontSize: 12, marginTop: 3, lineHeight: 16 },
    footer: { position: "absolute", left: 0, right: 0, bottom: 0, borderTopWidth: 1, paddingHorizontal: 24, paddingTop: 14 },
    cta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: radius.lg, paddingVertical: 16 },
    ctaText: { fontFamily: fonts.displayBold, fontSize: 16 },
  });
