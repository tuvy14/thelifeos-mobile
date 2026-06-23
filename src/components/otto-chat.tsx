import { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { BlurView } from "expo-blur";
import * as Speech from "expo-speech";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useTheme, radius, fonts, type Palette } from "@/lib/theme";
import { PressableScale, EASE } from "@/components/anim";
import { voiceSupported } from "@/lib/voice";
import {
  useStore,
  scoreFor,
  todayLog,
  streak,
  winsToday,
  monthRevenue,
} from "@/lib/store";

// Native speech recognition only exists in a dev build — require it lazily so
// the module never evaluates (and never crashes) inside Expo Go.
const VoiceCapture: React.ComponentType<{
  onTranscript: (t: string) => void;
  onDone: (final: string) => void;
}> | null = voiceSupported ? require("./voice-capture").default : null;

interface Msg { id: string; role: "bot" | "user"; text: string }
const SUGGESTIONS = ["How am I doing?", "What should I focus on?", "How much did I earn?", "My streak?"];

/* ── Bubble that animates in on mount ── */
function Bubble({ m, c }: { m: Msg; c: Palette }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 320, easing: EASE, useNativeDriver: true }).start();
  }, [v]);
  const style = {
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
  };
  if (m.role === "user") {
    return (
      <Animated.View style={[style, styles.bubbleUser, { backgroundColor: c.ink }]}>
        <Text style={{ color: c.obsidian, fontFamily: fonts.body, fontSize: 14, lineHeight: 20 }}>{m.text}</Text>
      </Animated.View>
    );
  }
  return (
    <Animated.View style={[style, styles.bubbleBot, { backgroundColor: c.fill, borderColor: c.line }]}>
      <Text style={{ color: c.ink, fontFamily: fonts.body, fontSize: 14, lineHeight: 20 }}>{m.text}</Text>
    </Animated.View>
  );
}

/* ── "Otto is thinking" bouncing dots ── */
function TypingDots({ c }: { c: Palette }) {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    const anims = dots.map((d, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 140),
          Animated.timing(d, { toValue: 1, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(d, { toValue: 0, duration: 320, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.delay((2 - i) * 140),
        ])
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View style={[styles.bubbleBot, styles.typing, { backgroundColor: c.fill, borderColor: c.line }]}>
      {dots.map((d, i) => (
        <Animated.View
          key={i}
          style={{
            width: 6, height: 6, borderRadius: 3, backgroundColor: c.inkMuted,
            transform: [{ translateY: d.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }],
            opacity: d.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
          }}
        />
      ))}
    </View>
  );
}

export default function OttoChat() {
  const store = useStore();
  const { c, isDark } = useTheme();
  const s = makeStyles(c);
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [speakOn, setSpeakOn] = useState(true);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: "intro", role: "bot", text: "Hey — I'm Otto, your TheLifeOS coach. Ask me anything about your day." },
  ]);
  const scrollRef = useRef<ScrollView>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  const open = () => {
    setMounted(true);
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 9, tension: 70 }).start();
  };
  const close = () => {
    try { Speech.stop(); } catch { /* ignore */ }
    Animated.timing(anim, { toValue: 0, duration: 220, easing: EASE, useNativeDriver: true }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  };

  const answer = (q: string): string => {
    const str = q.toLowerCase();
    const log = todayLog(store.logs);
    const score = scoreFor(log);
    const stk = streak(store.logs);
    const winsT = winsToday(store.wins).length;
    if (/(focus on|what should|advice|improve)/.test(str)) {
      if (!log) return "Start with today's check-in — it sets your whole score. Two minutes.";
      const gaps: string[] = [];
      if (log.sleep < 7) gaps.push("get to 7h+ sleep");
      if (log.water < 2.5) gaps.push("drink more water");
      if (log.deepWork < 2) gaps.push("get a deep-work block in");
      if (winsT === 0) gaps.push("log one small win");
      return gaps.length
        ? `Today, ${gaps[0]}. ${gaps.length > 1 ? "Then " + gaps[1] + "." : "You're close to a great day."}`
        : "You're dialed in today — protect the momentum.";
    }
    if (/(how am i|score|doing|day)/.test(str))
      return `Your life score is ${score}/100${stk ? ` with a ${stk}-day streak` : ""}. ${score >= 70 ? "Crushing it." : score >= 40 ? "Solid — keep building." : "Let's get a check-in in."}`;
    if (/(streak)/.test(str))
      return stk ? `You're on a ${stk}-day check-in streak. Don't break it. 🔥` : "No streak yet — check in today to start one.";
    if (/(win)/.test(str))
      return `${winsT} small win${winsT === 1 ? "" : "s"} logged today. ${winsT < 3 ? "Log another — they compound." : "Great momentum."}`;
    if (/(money|earn|revenue|income|\$)/.test(str))
      return `You've logged $${monthRevenue(store.revenue).toLocaleString()} this month.`;
    if (/(habit)/.test(str)) {
      const done = (store.habitLog[new Date().toISOString().slice(0, 10)] || []).length;
      return store.habits.length ? `${done}/${store.habits.length} habits done today.` : "No habits set yet — add a few to build streaks.";
    }
    if (/(gym|workout|fitness|train)/.test(str)) {
      const wk = store.workouts.filter((w) => w.ts >= Date.now() - 7 * 864e5).length;
      return `${wk} workout${wk === 1 ? "" : "s"} this week. Showing up is the win.`;
    }
    if (/(focus|deep work)/.test(str)) return `You've logged ${log?.deepWork ?? 0}h of deep work today.`;
    if (/(sleep)/.test(str)) return log ? `You slept ${log.sleep}h. ${log.sleep >= 7 ? "Nice." : "Aim for 7h+."}` : "No sleep logged today yet.";
    if (/(goal)/.test(str)) {
      if (!store.goals.length) return "No goals set — add one in the Goals tab.";
      const g = store.goals[0];
      return `"${g.title}" is at ${Math.round((g.current / g.target) * 100)}%.`;
    }
    if (/(hello|hey|hi|yo)/.test(str)) return "Hey — ask me about your score, streak, wins, money, habits or what to focus on.";
    return "I can tell you your life score, streak, wins, money, habits, focus, sleep and what to work on. Try a chip.";
  };

  const ask = (q: string) => {
    const text = q.trim();
    if (!text || typing) return;
    const reply = answer(text);
    setMsgs((m) => [...m, { id: String(Date.now()), role: "user", text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { id: String(Date.now() + 1), role: "bot", text: reply }]);
      if (speakOn) { try { Speech.stop(); Speech.speak(reply, { rate: 1.0, pitch: 1.02 }); } catch { /* ignore */ } }
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }, 650);
  };

  const startVoice = () => {
    if (!voiceSupported || !VoiceCapture) {
      setMsgs((m) => [
        ...m,
        { id: String(Date.now()), role: "bot", text: "Voice needs the full app build (run npx expo run:ios on your Mac). In Expo Go I'm text-only — but I still speak my replies." },
      ]);
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

  const backdropOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const sheetTranslate = anim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] });
  const sheetScale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] });
  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  return (
    <>
      {/* FAB with a soft pulse ring */}
      <View pointerEvents="box-none" style={[s.fabWrap, { bottom: insets.bottom + 64 }]}>
        <Animated.View style={[s.ring, { backgroundColor: c.ink, transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
        <PressableScale onPress={open} scaleTo={0.88} style={[s.fab, { backgroundColor: c.ink }]}>
          <Ionicons name="sparkles" size={20} color={c.obsidian} />
        </PressableScale>
      </View>

      <Modal visible={mounted} transparent statusBarTranslucent onRequestClose={close}>
        <Animated.View style={[s.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={{ flex: 1 }} onPress={close} />
        </Animated.View>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.sheetWrap} pointerEvents="box-none">
          <Animated.View style={{ transform: [{ translateY: sheetTranslate }, { scale: sheetScale }], opacity: anim }}>
            <BlurView intensity={isDark ? 50 : 70} tint={isDark ? "dark" : "light"} style={[s.sheet, { borderColor: c.line, paddingBottom: insets.bottom + 12 }]}>
              {/* grabber */}
              <View style={[s.grabber, { backgroundColor: c.lineStrong }]} />
              {/* header */}
              <View style={[s.header, { borderBottomColor: c.line }]}>
                <View style={s.headerLeft}>
                  <View style={[s.avatar, { backgroundColor: c.ink }]}>
                    <Ionicons name="sparkles" size={15} color={c.obsidian} />
                  </View>
                  <View>
                    <Text style={s.headerTitle}>Otto</Text>
                    <View style={s.onlineRow}>
                      <View style={s.onlineDot} />
                      <Text style={s.headerSub}>your coach</Text>
                    </View>
                  </View>
                </View>
                <View style={s.headerActions}>
                  <PressableScale onPress={() => setSpeakOn((v) => !v)} scaleTo={0.85} style={[s.headerBtn, { borderColor: c.line }]}>
                    <Ionicons name={speakOn ? "volume-high" : "volume-mute"} size={16} color={speakOn ? c.ink : c.inkFaint} />
                  </PressableScale>
                  <PressableScale onPress={close} scaleTo={0.85} style={[s.headerBtn, { borderColor: c.line }]}>
                    <Ionicons name="close" size={18} color={c.inkMuted} />
                  </PressableScale>
                </View>
              </View>

              {/* messages */}
              <ScrollView ref={scrollRef} style={{ maxHeight: 360 }} contentContainerStyle={{ padding: 16, gap: 10 }} keyboardShouldPersistTaps="handled">
                {msgs.map((m) => <Bubble key={m.id} m={m} c={c} />)}
                {typing && <TypingDots c={c} />}
              </ScrollView>

              {/* suggestions */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.sugRow} contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}>
                {SUGGESTIONS.map((sug) => (
                  <PressableScale key={sug} onPress={() => ask(sug)} style={[s.sug, { borderColor: c.line, backgroundColor: c.fill }]}>
                    <Text style={[s.sugText, { color: c.inkMuted }]}>{sug}</Text>
                  </PressableScale>
                ))}
              </ScrollView>

              {/* input / voice */}
              {listening ? (
                <View style={[s.listening, { borderTopColor: c.line }]}>
                  {VoiceCapture && <VoiceCapture onTranscript={setTranscript} onDone={onVoiceDone} />}
                  <Text style={[s.listeningText, { color: transcript ? c.ink : c.inkFaint }]} numberOfLines={2}>
                    {transcript || "Listening… speak now"}
                  </Text>
                  <PressableScale style={[s.send, { backgroundColor: c.ink }]} onPress={() => onVoiceDone(transcript)} scaleTo={0.9}>
                    <Ionicons name="stop" size={16} color={c.obsidian} />
                  </PressableScale>
                </View>
              ) : (
                <View style={[s.inputRow, { borderTopColor: c.line }]}>
                  <PressableScale style={[s.mic, { borderColor: c.line, backgroundColor: c.fill }]} onPress={startVoice} scaleTo={0.9}>
                    <Ionicons name="mic" size={18} color={c.inkMuted} />
                  </PressableScale>
                  <TextInput
                    value={input}
                    onChangeText={setInput}
                    placeholder="Ask Otto…"
                    placeholderTextColor={c.inkFaint}
                    style={[s.input, { borderColor: c.line, backgroundColor: c.fill, color: c.ink }]}
                    returnKeyType="send"
                    onSubmitEditing={() => ask(input)}
                  />
                  <PressableScale style={[s.send, { backgroundColor: c.ink }]} onPress={() => ask(input)} scaleTo={0.9}>
                    <Ionicons name="arrow-up" size={18} color={c.obsidian} />
                  </PressableScale>
                </View>
              )}
            </BlurView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    fabWrap: { position: "absolute", right: 16, width: 54, height: 54, alignItems: "center", justifyContent: "center" },
    ring: { position: "absolute", width: 54, height: 54, borderRadius: 27 },
    fab: {
      width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center",
      shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8,
    },
    backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.55)" },
    sheetWrap: { flex: 1, justifyContent: "flex-end" },
    sheet: {
      borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, overflow: "hidden",
      shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 30, shadowOffset: { width: 0, height: -10 },
    },
    grabber: { alignSelf: "center", width: 38, height: 4, borderRadius: 2, marginTop: 8, marginBottom: 4, opacity: 0.6 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 11 },
    avatar: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontFamily: fonts.displayBold, fontSize: 16, color: c.ink },
    onlineRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 1 },
    onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#3fcf6e" },
    headerSub: { fontFamily: fonts.body, fontSize: 12, color: c.inkFaint },
    headerActions: { flexDirection: "row", gap: 8 },
    headerBtn: { width: 34, height: 34, borderRadius: radius.sm, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    bubbleUser: { alignSelf: "flex-end", maxWidth: "84%", borderRadius: 18, borderBottomRightRadius: 6, paddingHorizontal: 14, paddingVertical: 10 },
    bubbleBot: { alignSelf: "flex-start", maxWidth: "84%", borderRadius: 18, borderBottomLeftRadius: 6, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
    typing: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 13 },
    sugRow: { paddingVertical: 8 },
    sug: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 13, paddingVertical: 7 },
    sugText: { fontFamily: fonts.bodyMedium, fontSize: 12 },
    inputRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1 },
    input: { flex: 1, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 11, fontFamily: fonts.body, fontSize: 14 },
    send: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
    mic: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    listening: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingTop: 12, borderTopWidth: 1 },
    listeningText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14 },
  });

const styles = StyleSheet.create({
  bubbleUser: { alignSelf: "flex-end", maxWidth: "84%", borderRadius: 18, borderBottomRightRadius: 6, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleBot: { alignSelf: "flex-start", maxWidth: "84%", borderRadius: 18, borderBottomLeftRadius: 6, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  typing: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 13 },
});
