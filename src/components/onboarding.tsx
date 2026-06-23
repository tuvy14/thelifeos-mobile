import { useEffect, useRef, useState } from "react";
import { Animated, ScrollView, View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useTheme, radius, fonts, type Palette } from "@/lib/theme";
import { useStore, FOCUS_AREAS } from "@/lib/store";
import Logo from "@/components/logo";
import QuantumLoader from "@/components/quantum-loader";

const FOCUS_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  fitness: "barbell-outline", focus: "timer-outline", business: "trending-up-outline",
  creator: "videocam-outline", money: "cash-outline", mind: "leaf-outline",
  habits: "repeat-outline", learn: "book-outline",
};

const STEPS = ["welcome", "goals", "challenge", "dailyTime", "level", "rhythm", "generating", "ready"] as const;
type Step = (typeof STEPS)[number];

interface Question {
  key: "challenge" | "dailyTime" | "level" | "rhythm";
  title: string;
  subtitle: string;
  options: { id: string; label: string; emoji: string }[];
}
const QUESTIONS: Record<string, Question> = {
  challenge: {
    key: "challenge", title: "What's your biggest challenge right now?", subtitle: "We'll keep you on track where it's hardest.",
    options: [
      { id: "consistency", label: "Staying consistent", emoji: "🔁" },
      { id: "time", label: "Never enough time", emoji: "⏳" },
      { id: "motivation", label: "Low motivation or energy", emoji: "🔋" },
      { id: "scattered", label: "Too scattered, no system", emoji: "🧩" },
      { id: "progress", label: "Not seeing progress", emoji: "📉" },
    ],
  },
  dailyTime: {
    key: "dailyTime", title: "How much time can you give it a day?", subtitle: "We'll size your routine to fit your life.",
    options: [
      { id: "2", label: "About 2 minutes", emoji: "⚡" },
      { id: "10", label: "5–10 minutes", emoji: "☕" },
      { id: "30", label: "15–30 minutes", emoji: "🎯" },
      { id: "30+", label: "30+ minutes", emoji: "🚀" },
    ],
  },
  level: {
    key: "level", title: "Where are you on the journey?", subtitle: "Honest answers get a better plan.",
    options: [
      { id: "start", label: "Just getting started", emoji: "🌱" },
      { id: "momentum", label: "Building momentum", emoji: "📈" },
      { id: "disciplined", label: "Pretty disciplined", emoji: "💪" },
      { id: "optimizing", label: "Optimizing the last 10%", emoji: "🔬" },
    ],
  },
  rhythm: {
    key: "rhythm", title: "When do you want to check in?", subtitle: "We'll nudge you at the right time.",
    options: [
      { id: "morning", label: "Mornings", emoji: "☀️" },
      { id: "midday", label: "Midday reset", emoji: "🌤️" },
      { id: "evening", label: "Evenings", emoji: "🌙" },
    ],
  },
};
const GEN_MSGS = [
  "Analyzing your goals…", "Mapping your modules…", "Creating your starter goals…",
  "Tuning your daily check-in…", "Finalizing your plan…",
];

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const { completeOnboarding } = useStore();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const s = makeStyles(c);

  const [i, setI] = useState(0);
  const step: Step = STEPS[i];
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [subMsg, setSubMsg] = useState(0);
  const savedRef = useRef(false);

  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 360, useNativeDriver: true }).start();
  }, [i, fade]);

  const next = () => setI((v) => Math.min(STEPS.length - 1, v + 1));
  const back = () => setI((v) => Math.max(0, v - 1));
  const toggle = (id: string) => setSelected((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));
  const answer = (key: string, val: string) => {
    setAnswers((a) => ({ ...a, [key]: val }));
    setTimeout(next, 280);
  };

  useEffect(() => {
    if (step !== "generating") return;
    if (!savedRef.current) {
      savedRef.current = true;
      completeOnboarding(name, selected.length ? selected : ["habits"], {
        challenge: answers.challenge, dailyTime: answers.dailyTime, level: answers.level, rhythm: answers.rhythm,
      });
    }
    setSubMsg(0);
    const sub = setInterval(() => setSubMsg((m) => Math.min(GEN_MSGS.length - 1, m + 1)), 640);
    const done = setTimeout(() => setI(STEPS.indexOf("ready")), 3200);
    return () => { clearInterval(sub); clearTimeout(done); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const myFocus = FOCUS_AREAS.filter((f) => selected.includes(f.id));
  const seededGoals = myFocus.reduce((a, f) => a + f.seedGoals.length, 0);
  const showDots = i <= 5;

  const cta = (label: string, onPress: () => void, disabled?: boolean) => (
    <Pressable onPress={onPress} disabled={disabled} style={[s.cta, { backgroundColor: c.ink, opacity: disabled ? 0.4 : 1 }]}>
      <Text style={[s.ctaText, { color: c.obsidian }]}>{label}</Text>
      <Ionicons name="arrow-forward" size={16} color={c.obsidian} />
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.obsidian }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingTop: insets.top + 24, paddingHorizontal: 24, paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {showDots && (
          <View style={s.dots}>
            {STEPS.slice(0, 6).map((st, idx) => (
              <View key={st} style={[s.dot, { width: idx === i ? 30 : 16, backgroundColor: idx === i ? c.ink : idx < i ? c.inkFaint : c.fillStrong }]} />
            ))}
          </View>
        )}

        <Animated.View style={{ opacity: fade }}>
          {step === "welcome" && (
            <View style={{ alignItems: "center" }}>
              <Logo height={40} />
              <Text style={s.h1}>Welcome to TheLifeOS</Text>
              <Text style={s.lead}>Answer a few quick questions and we&apos;ll build a personal plan around your life. Takes about a minute.</Text>
              <TextInput
                value={name} onChangeText={setName} placeholder="Your first name (optional)" placeholderTextColor={c.inkFaint}
                style={s.nameInput} textAlign="center"
              />
              {cta("Let's go", next)}
            </View>
          )}

          {step === "goals" && (
            <View>
              <Text style={s.h2}>{name ? `What's your focus, ${name}?` : "What do you want to focus on?"}</Text>
              <Text style={[s.lead, { textAlign: "center" }]}>Pick what matters most. We&apos;ll tailor your dashboard and add starter goals. Choose as many as you like.</Text>
              <View style={s.optWrap}>
                {FOCUS_AREAS.map((f) => {
                  const on = selected.includes(f.id);
                  return (
                    <Pressable key={f.id} onPress={() => toggle(f.id)} style={[s.opt, { borderColor: on ? c.ink : c.line, backgroundColor: on ? c.fillStrong : c.card }]}>
                      <View style={[s.optIcon, { borderColor: c.line, backgroundColor: on ? c.ink : c.fill }]}>
                        <Ionicons name={FOCUS_ICON[f.id] ?? "ellipse-outline"} size={18} color={on ? c.obsidian : c.ink} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.optTitle}>{f.label}</Text>
                        <Text style={s.optDesc}>{f.description}</Text>
                      </View>
                      <View style={[s.check, { borderColor: on ? c.ink : c.line, backgroundColor: on ? c.ink : "transparent" }]}>
                        {on && <Ionicons name="checkmark" size={12} color={c.obsidian} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
              {cta(selected.length ? `Continue (${selected.length})` : "Pick at least one", next, !selected.length)}
              <Pressable onPress={back} style={s.backBtn}><Text style={s.backText}>← Back</Text></Pressable>
            </View>
          )}

          {(step === "challenge" || step === "dailyTime" || step === "level" || step === "rhythm") && (() => {
            const q = QUESTIONS[step];
            return (
              <View>
                <Text style={s.h2}>{q.title}</Text>
                <Text style={[s.lead, { textAlign: "center" }]}>{q.subtitle}</Text>
                <View style={[s.optWrap, { gap: 12 }]}>
                  {q.options.map((opt) => {
                    const on = answers[q.key] === opt.id;
                    return (
                      <Pressable key={opt.id} onPress={() => answer(q.key, opt.id)} style={[s.opt, { borderColor: on ? c.ink : c.line, backgroundColor: on ? c.fillStrong : c.card }]}>
                        <Text style={{ fontSize: 20 }}>{opt.emoji}</Text>
                        <Text style={[s.optTitle, { flex: 1 }]}>{opt.label}</Text>
                        <View style={[s.check, { borderColor: on ? c.ink : c.line, backgroundColor: on ? c.ink : "transparent" }]}>
                          {on && <Ionicons name="checkmark" size={12} color={c.obsidian} />}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
                <Pressable onPress={back} style={s.backBtn}><Text style={s.backText}>← Back</Text></Pressable>
              </View>
            );
          })()}

          {step === "generating" && (
            <View style={{ alignItems: "center", paddingVertical: 32 }}>
              <QuantumLoader text="Generating" />
              <Text style={s.genSub}>your personal plan</Text>
              <Text style={s.genMsg}>{GEN_MSGS[subMsg]}</Text>
            </View>
          )}

          {step === "ready" && (
            <View style={{ alignItems: "center" }}>
              <View style={[s.readyIcon, { borderColor: c.line, backgroundColor: c.fill }]}>
                <Ionicons name="sparkles" size={24} color={c.ink} />
              </View>
              <Text style={s.h1}>{name ? `You're all set, ${name}` : "Your plan is ready"}</Text>
              <Text style={s.lead}>We&apos;ve tailored your dashboard to what matters to you.</Text>
              <View style={s.readyCards}>
                {myFocus.length > 0 && (
                  <View style={[s.readyCard, { backgroundColor: c.card, borderColor: c.line }]}>
                    <Text style={s.readyLabel}>YOUR FOCUS</Text>
                    <View style={s.focusChips}>
                      {myFocus.map((f) => (
                        <View key={f.id} style={[s.focusChip, { borderColor: c.line, backgroundColor: c.fill }]}>
                          <Text style={s.focusChipText}>{f.label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                <View style={[s.readyRow, { backgroundColor: c.card, borderColor: c.line }]}>
                  <View style={[s.readyRowIcon, { borderColor: c.line, backgroundColor: c.fill }]}>
                    <Ionicons name="checkmark" size={16} color={c.ink} />
                  </View>
                  <Text style={s.readyRowText}>
                    <Text style={{ color: c.ink }}>{seededGoals} starter goal{seededGoals === 1 ? "" : "s"}</Text> added to keep you moving
                  </Text>
                </View>
              </View>
              {cta("Enter TheLifeOS", onDone)}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 28 },
    dot: { height: 6, borderRadius: 3 },
    h1: { fontFamily: fonts.displayBold, fontSize: 32, color: c.ink, letterSpacing: -0.8, textAlign: "center", marginTop: 22 },
    h2: { fontFamily: fonts.displayBold, fontSize: 26, color: c.ink, letterSpacing: -0.6, textAlign: "center" },
    lead: { fontFamily: fonts.body, fontSize: 14.5, color: c.inkMuted, lineHeight: 21, textAlign: "center", marginTop: 12, alignSelf: "center", maxWidth: 420 },
    nameInput: { width: "100%", maxWidth: 360, borderWidth: 1, borderColor: c.line, backgroundColor: c.fill, borderRadius: radius.lg, paddingHorizontal: 18, paddingVertical: 15, color: c.ink, fontFamily: fonts.body, fontSize: 17, marginTop: 28 },
    optWrap: { gap: 10, marginTop: 26 },
    opt: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: radius.lg, padding: 14 },
    optIcon: { width: 40, height: 40, borderRadius: radius.md, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    optTitle: { fontFamily: fonts.bodySemibold, fontSize: 14, color: c.ink },
    optDesc: { fontFamily: fonts.body, fontSize: 12, color: c.inkMuted, marginTop: 2 },
    check: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    cta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: radius.lg, paddingVertical: 16, marginTop: 26, alignSelf: "stretch" },
    ctaText: { fontFamily: fonts.displayBold, fontSize: 15 },
    backBtn: { alignSelf: "center", marginTop: 16, padding: 6 },
    backText: { fontFamily: fonts.body, fontSize: 12, color: c.inkFaint },
    genSub: { fontFamily: fonts.displayBold, fontSize: 18, color: c.ink, marginTop: 20 },
    genMsg: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.6, color: c.inkFaint, marginTop: 16, textTransform: "uppercase" },
    readyIcon: { width: 56, height: 56, borderRadius: radius.lg, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    readyCards: { gap: 10, marginTop: 26, alignSelf: "stretch" },
    readyCard: { borderWidth: 1, borderRadius: radius.lg, padding: 16 },
    readyLabel: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1.2, color: c.inkFaint, marginBottom: 10 },
    focusChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    focusChip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
    focusChipText: { fontFamily: fonts.body, fontSize: 13, color: c.ink },
    readyRow: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: radius.lg, padding: 16 },
    readyRowIcon: { width: 36, height: 36, borderRadius: radius.sm, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    readyRowText: { flex: 1, fontFamily: fonts.body, fontSize: 13.5, color: c.inkMuted, lineHeight: 19 },
  });
