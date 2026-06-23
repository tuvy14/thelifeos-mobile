import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import * as Speech from "expo-speech";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useTheme, radius, fonts, type Palette } from "@/lib/theme";
import { PressableScale, EASE } from "@/components/anim";
import { voiceSupported } from "@/lib/voice";
import { useStore, scoreFor, todayLog, streak, winsToday, monthRevenue } from "@/lib/store";

// Lazy-require voice capture so Expo Go never crashes on missing native module.
const VoiceCapture: React.ComponentType<{
  onTranscript: (t: string) => void;
  onDone: (final: string) => void;
}> | null = voiceSupported ? require("./voice-capture").default : null;

const { height: SCREEN_H } = Dimensions.get("window");
// Sheet occupies 88% of screen — feels like a proper chat surface, not a widget.
const SHEET_H = SCREEN_H * 0.88;

const SUGGESTIONS = [
  "How am I doing today?",
  "What should I focus on?",
  "How's my streak?",
  "How much did I earn?",
  "Any habits left?",
];

interface Msg { id: string; role: "bot" | "user"; text: string }

/* ── Animated chat bubble ── */
function Bubble({ m, c }: { m: Msg; c: Palette }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 300, easing: EASE, useNativeDriver: true }).start();
  }, [v]);
  const style = {
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
  };
  if (m.role === "user") {
    return (
      <Animated.View style={[style, bs.user, { backgroundColor: c.ink }]}>
        <Text style={{ color: c.obsidian, fontFamily: fonts.body, fontSize: 15, lineHeight: 22 }}>{m.text}</Text>
      </Animated.View>
    );
  }
  return (
    <Animated.View style={[style, bs.bot, { backgroundColor: c.fill, borderColor: c.line }]}>
      <Text style={{ color: c.ink, fontFamily: fonts.body, fontSize: 15, lineHeight: 22 }}>{m.text}</Text>
    </Animated.View>
  );
}

/* ── Bouncing typing dots ── */
function TypingDots({ c }: { c: Palette }) {
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;
  const cd = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const dot = (v: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, { toValue: 1, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 300, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.delay(300 - delay),
        ])
      );
    const anims = [dot(a, 0), dot(b, 130), dot(cd, 260)];
    anims.forEach((x) => x.start());
    return () => anims.forEach((x) => x.stop());
  }, [a, b, cd]);

  const dotStyle = (v: Animated.Value) => ({
    opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }],
  });
  return (
    <View style={[bs.bot, bs.dotRow, { backgroundColor: c.fill, borderColor: c.line }]}>
      {[a, b, cd].map((v, i) => (
        <Animated.View key={i} style={[bs.dot, { backgroundColor: c.inkMuted }, dotStyle(v)]} />
      ))}
    </View>
  );
}

export default function OttoChat() {
  const store = useStore();
  const { c, isDark } = useTheme();
  const s = makeStyles(c);
  const insets = useSafeAreaInsets();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [speakOn, setSpeakOn] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: "intro", role: "bot", text: "Hey — I'm Otto, your TheLifeOS coach. Ask me anything about your day, score, habits, or what to focus on." },
  ]);

  const scrollRef = useRef<ScrollView>(null);
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  // FAB pulse ring
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  const openSheet = () => {
    setOpen(true);
    Animated.spring(sheetAnim, { toValue: 1, useNativeDriver: true, speed: 16, bounciness: 4 }).start();
  };
  const closeSheet = () => {
    try { Speech.stop(); } catch { /* ignore */ }
    Animated.timing(sheetAnim, { toValue: 0, duration: 240, easing: EASE, useNativeDriver: true }).start(({ finished }) => {
      if (finished) setOpen(false);
    });
  };

  const answer = (q: string): string => {
    const str = q.toLowerCase();
    const log = todayLog(store.logs);
    const score = scoreFor(log);
    const stk = streak(store.logs);
    const winsT = winsToday(store.wins).length;
    if (/(focus on|what should|advice|improve|next)/.test(str)) {
      if (!log) return "Start with today's check-in — it sets your whole score. Two minutes.";
      const gaps: string[] = [];
      if (log.sleep < 7) gaps.push("get to 7h+ sleep tonight");
      if (log.water < 2.5) gaps.push("drink more water");
      if (log.deepWork < 2) gaps.push("block time for deep work");
      if (winsT === 0) gaps.push("log one small win");
      return gaps.length
        ? `Today: ${gaps[0]}. ${gaps.length > 1 ? "Then " + gaps[1] + "." : "You're close to a great day."}`
        : "You're dialled in — protect the momentum and don't break the streak.";
    }
    if (/(how am i|score|doing|day)/.test(str))
      return `Life score: ${score}/100${stk ? ` · ${stk}-day streak` : ""}. ${score >= 70 ? "Crushing it 🔥" : score >= 40 ? "Solid — keep building." : "Check in to push this up."}`;
    if (/(streak)/.test(str))
      return stk ? `You're on a ${stk}-day streak. Keep it alive 🔥` : "No streak yet — check in today to start one.";
    if (/(win)/.test(str))
      return `${winsT} small win${winsT === 1 ? "" : "s"} today. ${winsT < 3 ? "Log another — they compound." : "Great momentum. Keep going."}`;
    if (/(money|earn|revenue|income|\$)/.test(str))
      return `You've logged $${monthRevenue(store.revenue).toLocaleString()} in revenue this month.`;
    if (/(habit)/.test(str)) {
      const done = (store.habitLog[new Date().toISOString().slice(0, 10)] || []).length;
      return store.habits.length
        ? `${done}/${store.habits.length} habits done today.${done < store.habits.length ? " Finish them." : " Full house 💯"}`
        : "No habits set yet — add a few from the Habits tab.";
    }
    if (/(gym|workout|fitness|train)/.test(str)) {
      const wk = store.workouts.filter((w) => w.ts >= Date.now() - 7 * 864e5).length;
      return `${wk} workout${wk === 1 ? "" : "s"} this week. Showing up is the win.`;
    }
    if (/(deep work|deep-work|focus time)/.test(str)) return `${log?.deepWork ?? 0}h deep work logged today.`;
    if (/(sleep)/.test(str)) return log ? `You slept ${log.sleep}h. ${log.sleep >= 7 ? "Nice." : "Aim for 7h+."}` : "No sleep logged today yet.";
    if (/(goal)/.test(str)) {
      if (!store.goals.length) return "No goals set — add one from the Goals tab.";
      const g = store.goals[0];
      return `"${g.title}" is at ${Math.round((g.current / g.target) * 100)}% of target.`;
    }
    if (/(mood|energy|feel)/.test(str)) return log ? `Mood ${log.mood}/10 · Energy ${log.energy}/10 today.` : "Check in to log your mood.";
    if (/(hello|hey|hi\b|yo\b)/.test(str)) return "Hey! Ask me about your score, streak, wins, habits, money, sleep — or what to focus on.";
    return "I can help with your life score, streak, wins, habits, goals, sleep, money and focus. Try one of the quick buttons.";
  };

  const ask = (q: string) => {
    const text = q.trim();
    if (!text || typing) return;
    setMsgs((m) => [...m, { id: String(Date.now()), role: "user", text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    const reply = answer(text);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { id: String(Date.now() + 1), role: "bot", text: reply }]);
      if (speakOn) { try { Speech.stop(); Speech.speak(reply, { rate: 1.0, pitch: 1.02 }); } catch { /* ignore */ } }
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }, 700);
  };

  const startVoice = () => {
    if (!voiceSupported || !VoiceCapture) {
      setMsgs((m) => [...m, { id: String(Date.now()), role: "bot", text: "Voice needs a dev build (npx expo run:ios on your Mac). I'm text-only in Expo Go, but I still speak replies." }]);
      return;
    }
    setTranscript("");
    setListening(true);
  };
  const onVoiceDone = (final: string) => {
    setListening(false);
    setTranscript("");
    if (final) ask(final);
  };

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0] });
  const sheetY = sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [SHEET_H, 0] });

  return (
    <>
      {/* FAB */}
      <View pointerEvents="box-none" style={[s.fabWrap, { bottom: insets.bottom + 68 }]}>
        <Animated.View style={[s.ring, { backgroundColor: c.ink, transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
        <PressableScale onPress={openSheet} scaleTo={0.88} style={[s.fab, { backgroundColor: c.ink }]}>
          <Ionicons name="sparkles" size={22} color={c.obsidian} />
        </PressableScale>
      </View>

      <Modal visible={open} transparent animationType="none" statusBarTranslucent onRequestClose={closeSheet}>
        {/* Backdrop */}
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.55)", opacity: sheetAnim }]}>
          <Pressable style={{ flex: 1 }} onPress={closeSheet} />
        </Animated.View>

        {/* Sheet — note: BlurView must NOT have overflow:hidden when animated.
            We clip with an outer View instead to avoid the iOS render crash. */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={s.sheetWrap}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[s.sheetOuter, { transform: [{ translateY: sheetY }], height: SHEET_H, paddingBottom: insets.bottom }]}
          >
            {/* The clip wrapper prevents blur bleed without being on BlurView itself */}
            <View style={[s.clipWrap, { borderColor: c.line }]}>
              <BlurView intensity={isDark ? 55 : 75} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />

              {/* Grabber */}
              <View style={[s.grabber, { backgroundColor: c.lineStrong }]} />

              {/* Header */}
              <View style={[s.header, { borderBottomColor: c.line }]}>
                <View style={s.headerLeft}>
                  <View style={[s.avatar, { backgroundColor: c.ink }]}>
                    <Ionicons name="sparkles" size={17} color={c.obsidian} />
                  </View>
                  <View>
                    <Text style={[s.headerTitle, { color: c.ink }]}>Otto</Text>
                    <View style={s.statusRow}>
                      <View style={s.statusDot} />
                      <Text style={[s.headerSub, { color: c.inkFaint }]}>your life coach</Text>
                    </View>
                  </View>
                </View>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <PressableScale onPress={() => setSpeakOn((v) => !v)} scaleTo={0.88} style={[s.headerBtn, { borderColor: c.line }]}>
                    <Ionicons name={speakOn ? "volume-high" : "volume-mute"} size={17} color={speakOn ? c.ink : c.inkFaint} />
                  </PressableScale>
                  <PressableScale onPress={closeSheet} scaleTo={0.88} style={[s.headerBtn, { borderColor: c.line }]}>
                    <Ionicons name="close" size={19} color={c.inkMuted} />
                  </PressableScale>
                </View>
              </View>

              {/* Messages — flex:1 so they fill all available space */}
              <ScrollView
                ref={scrollRef}
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 18, gap: 12, paddingBottom: 8 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {msgs.map((m) => <Bubble key={m.id} m={m} c={c} />)}
                {typing && <TypingDots c={c} />}
              </ScrollView>

              {/* Quick reply chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={s.chips}
                contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 10 }}
              >
                {SUGGESTIONS.map((sug) => (
                  <PressableScale key={sug} onPress={() => ask(sug)} style={[s.chip, { borderColor: c.line, backgroundColor: c.fill }]}>
                    <Text style={[s.chipText, { color: c.inkMuted }]}>{sug}</Text>
                  </PressableScale>
                ))}
              </ScrollView>

              {/* Input row */}
              {listening ? (
                <View style={[s.inputRow, { borderTopColor: c.line }]}>
                  {VoiceCapture && <VoiceCapture onTranscript={setTranscript} onDone={onVoiceDone} />}
                  <Text style={[s.listeningText, { color: transcript ? c.ink : c.inkFaint }]} numberOfLines={2}>
                    {transcript || "Listening… speak now"}
                  </Text>
                  <PressableScale style={[s.sendBtn, { backgroundColor: c.ink }]} onPress={() => onVoiceDone(transcript)} scaleTo={0.9}>
                    <Ionicons name="stop" size={17} color={c.obsidian} />
                  </PressableScale>
                </View>
              ) : (
                <View style={[s.inputRow, { borderTopColor: c.line }]}>
                  <PressableScale style={[s.micBtn, { borderColor: c.line, backgroundColor: c.fill }]} onPress={startVoice} scaleTo={0.9}>
                    <Ionicons name="mic" size={20} color={c.inkMuted} />
                  </PressableScale>
                  <TextInput
                    value={input}
                    onChangeText={setInput}
                    placeholder="Ask Otto anything…"
                    placeholderTextColor={c.inkFaint}
                    style={[s.textInput, { borderColor: c.line, backgroundColor: c.fill, color: c.ink }]}
                    returnKeyType="send"
                    onSubmitEditing={() => ask(input)}
                    multiline
                    maxLength={400}
                  />
                  <PressableScale
                    style={[s.sendBtn, { backgroundColor: input.trim() ? c.ink : c.fillStrong }]}
                    onPress={() => ask(input)}
                    scaleTo={0.9}
                    disabled={!input.trim()}
                  >
                    <Ionicons name="arrow-up" size={20} color={input.trim() ? c.obsidian : c.inkFaint} />
                  </PressableScale>
                </View>
              )}
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

/* Bubble styles (shared) */
const bs = StyleSheet.create({
  user: { alignSelf: "flex-end", maxWidth: "85%", borderRadius: 20, borderBottomRightRadius: 5, paddingHorizontal: 16, paddingVertical: 11 },
  bot: { alignSelf: "flex-start", maxWidth: "85%", borderRadius: 20, borderBottomLeftRadius: 5, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 11 },
  dotRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, paddingVertical: 16 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
});

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    fabWrap: { position: "absolute", right: 18, width: 58, height: 58, alignItems: "center", justifyContent: "center" },
    ring: { position: "absolute", width: 58, height: 58, borderRadius: 29 },
    fab: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
    sheetWrap: { flex: 1, justifyContent: "flex-end" },
    sheetOuter: { justifyContent: "flex-end" },
    // Clip wrapper — carries borderRadius + overflow:hidden so BlurView doesn't need it.
    clipWrap: { flex: 1, borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, overflow: "hidden" },
    grabber: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, marginTop: 10, marginBottom: 2, opacity: 0.5 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    avatar: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontFamily: fonts.displayBold, fontSize: 17 },
    statusRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
    statusDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#3fcf6e" },
    headerSub: { fontFamily: fonts.body, fontSize: 12 },
    headerBtn: { width: 36, height: 36, borderRadius: radius.sm, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    chips: { flexShrink: 0 },
    chip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
    chipText: { fontFamily: fonts.bodyMedium, fontSize: 13 },
    inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 10, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10, borderTopWidth: StyleSheet.hairlineWidth },
    micBtn: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    textInput: { flex: 1, borderWidth: 1, borderRadius: 22, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 12, fontFamily: fonts.body, fontSize: 15, maxHeight: 120 },
    sendBtn: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
    listeningText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 15, paddingVertical: 12 },
  });
