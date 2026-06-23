import { useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useTheme, radius, fonts, type Palette } from "@/lib/theme";
import {
  useStore,
  scoreFor,
  todayLog,
  streak,
  winsToday,
  monthRevenue,
} from "@/lib/store";

interface Msg { role: "bot" | "user"; text: string }
const SUGGESTIONS = ["How am I doing?", "What should I focus on?", "How much did I earn?", "My streak?"];

export default function OttoChat() {
  const store = useStore();
  const { c } = useTheme();
  const s = makeStyles(c);
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "bot", text: "Hey — I'm your TheLifeOS coach. Ask me anything about your day." },
  ]);
  const scrollRef = useRef<ScrollView>(null);

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
    if (!text) return;
    setMsgs((m) => [...m, { role: "user", text }, { role: "bot", text: answer(text) }]);
    setInput("");
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[s.fab, { backgroundColor: c.ink, bottom: insets.bottom + 64 }]}
      >
        <Ionicons name="chatbubble-ellipses" size={22} color={c.obsidian} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setOpen(false)} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={s.sheetWrap}
        >
          <View style={[s.sheet, { backgroundColor: c.surface, borderColor: c.line, paddingBottom: insets.bottom + 12 }]}>
            <View style={[s.header, { borderBottomColor: c.line }]}>
              <View style={s.headerLeft}>
                <View style={[s.headerIcon, { backgroundColor: c.ink }]}>
                  <Ionicons name="chatbubble-ellipses" size={14} color={c.obsidian} />
                </View>
                <Text style={s.headerTitle}>TheLifeOS coach</Text>
              </View>
              <Pressable hitSlop={10} onPress={() => setOpen(false)}>
                <Ionicons name="close" size={20} color={c.inkMuted} />
              </Pressable>
            </View>

            <ScrollView ref={scrollRef} style={{ maxHeight: 320 }} contentContainerStyle={{ padding: 16, gap: 10 }}>
              {msgs.map((m, i) => (
                <View
                  key={i}
                  style={[
                    s.bubble,
                    m.role === "user"
                      ? { alignSelf: "flex-end", backgroundColor: c.ink }
                      : { alignSelf: "flex-start", backgroundColor: c.fill, borderWidth: 1, borderColor: c.line },
                  ]}
                >
                  <Text style={{ color: m.role === "user" ? c.obsidian : c.ink, fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19 }}>
                    {m.text}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.sugRow} contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}>
              {SUGGESTIONS.map((sug) => (
                <Pressable key={sug} onPress={() => ask(sug)} style={[s.sug, { borderColor: c.line, backgroundColor: c.fill }]}>
                  <Text style={[s.sugText, { color: c.inkMuted }]}>{sug}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={[s.inputRow, { borderTopColor: c.line }]}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Ask your coach…"
                placeholderTextColor={c.inkFaint}
                style={[s.input, { borderColor: c.line, backgroundColor: c.fill, color: c.ink }]}
                returnKeyType="send"
                onSubmitEditing={() => ask(input)}
              />
              <Pressable style={[s.send, { backgroundColor: c.ink }]} onPress={() => ask(input)}>
                <Ionicons name="send" size={16} color={c.obsidian} />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    fab: {
      position: "absolute", right: 16, width: 52, height: 52, borderRadius: 26,
      alignItems: "center", justifyContent: "center",
      shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 8,
    },
    backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)" },
    sheetWrap: { flex: 1, justifyContent: "flex-end" },
    sheet: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderWidth: 1 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
    headerIcon: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontFamily: fonts.display, fontSize: 14, color: c.ink },
    bubble: { maxWidth: "85%", borderRadius: 16, paddingHorizontal: 13, paddingVertical: 9 },
    sugRow: { paddingVertical: 8 },
    sug: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
    sugText: { fontFamily: fonts.body, fontSize: 12 },
    inputRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderTopWidth: 1 },
    input: { flex: 1, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 11, fontFamily: fonts.body, fontSize: 14 },
    send: { width: 42, height: 42, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  });
