import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme, fonts, radius } from "@/lib/theme";
import { PressableScale, CountUp, EASE } from "@/components/anim";
import { cheer, playSfx } from "@/lib/feedback";
import { getWeeklyRecap, type WeeklyRecap as Recap } from "@/lib/recap";
import type { HealthLog, Win, Habit, HabitLog } from "@/lib/store";

const SLIDE_MS = 4800;

interface Slide {
  id: string;
  eyebrow: string;
  icon: keyof typeof Ionicons.glyphMap;
  big: ReactNode;
  caption: string;
}

function buildSlides(r: Recap, c: { ink: string; inkFaint: string }): Slide[] {
  const bigStyle = { fontFamily: fonts.displayBold, fontSize: 72, color: c.ink, letterSpacing: -2 } as const;
  const s: Slide[] = [];
  s.push({ id: "intro", eyebrow: r.rangeLabel, icon: "sparkles", big: <Text style={[bigStyle, { fontSize: 46 }]}>Your week</Text>, caption: "Here's how it actually went." });
  s.push({
    id: "checkins",
    eyebrow: "You showed up",
    icon: "flame",
    big: <Text style={bigStyle}><CountUp value={r.checkins} style={bigStyle} /><Text style={{ color: c.inkFaint }}>/7</Text></Text>,
    caption: r.checkins >= 6 ? "Nearly perfect. That's momentum." : r.checkins >= 3 ? "Solid week of showing up." : "Every check-in counts.",
  });
  s.push({
    id: "score",
    eyebrow: "Average life score",
    icon: r.scoreDelta >= 0 ? "trending-up" : "trending-down",
    big: <CountUp value={r.avgScore} style={bigStyle} />,
    caption: r.scoreDelta === 0 ? "Holding steady." : `${r.scoreDelta > 0 ? "▲" : "▼"} ${Math.abs(r.scoreDelta)} vs the week before`,
  });
  if (r.wins > 0)
    s.push({ id: "wins", eyebrow: "Small wins logged", icon: "sparkles", big: <CountUp value={r.wins} style={bigStyle} />, caption: r.topWin ? `“${r.topWin}”` : "One win at a time." });
  if (r.deepWork > 0)
    s.push({ id: "deep", eyebrow: "Hours of deep work", icon: "flash", big: <Text style={bigStyle}><CountUp value={r.deepWork} style={bigStyle} /><Text style={{ color: c.inkFaint }}>h</Text></Text>, caption: "Focused time is where progress hides." });
  if (r.topHabit)
    s.push({ id: "habit", eyebrow: "Strongest habit", icon: "flame", big: <Text style={bigStyle}>{r.topHabit.emoji} <CountUp value={r.topHabit.streak} style={bigStyle} /></Text>, caption: `${r.topHabit.name} · ${r.topHabit.streak}-day streak` });
  s.push({ id: "xp", eyebrow: "XP earned this week", icon: "flash", big: <Text style={bigStyle}>+<CountUp value={r.xpGained} style={bigStyle} /></Text>, caption: `Now level ${r.level} · ${r.levelName}` });
  s.push({ id: "outro", eyebrow: "That's a wrap", icon: "trophy", big: <Text style={[bigStyle, { fontSize: 44 }]}>Keep going.</Text>, caption: "Next week is yours to write." });
  return s;
}

export default function WeeklyRecap({
  visible,
  onClose,
  data,
}: {
  visible: boolean;
  onClose: () => void;
  data: { logs: HealthLog[]; wins: Win[]; habits: Habit[]; habitLog: HabitLog };
}) {
  const { c } = useTheme();
  const recap = useMemo(() => getWeeklyRecap(data), [data]);
  const slides = useMemo(() => buildSlides(recap, c), [recap, c]);
  const last = slides.length - 1;
  const [idx, setIdx] = useState(0);

  const enter = useRef(new Animated.Value(0)).current; // slide content fade/rise
  const prog = useRef(new Animated.Value(0)).current; // active progress bar fill

  // On open: reset + sound.
  useEffect(() => {
    if (visible) {
      setIdx(0);
      cheer("celebrate", "success");
    }
  }, [visible]);

  // Animate the slide content + restart the progress bar on each slide.
  useEffect(() => {
    if (!visible) return;
    enter.setValue(0);
    Animated.timing(enter, { toValue: 1, duration: 480, easing: EASE, useNativeDriver: true }).start();
    prog.setValue(0);
    const bar = Animated.timing(prog, { toValue: 1, duration: SLIDE_MS, useNativeDriver: false });
    bar.start();
    if (idx === last) playSfx("celebrate");
    if (idx < last) {
      const t = setTimeout(() => setIdx((i) => Math.min(i + 1, last)), SLIDE_MS);
      return () => {
        clearTimeout(t);
        bar.stop();
      };
    }
    return () => bar.stop();
  }, [visible, idx, last]);

  if (!visible || slides.length === 0) return null;
  const slide = slides[idx];
  const next = () => setIdx((i) => Math.min(i + 1, last));
  const prev = () => setIdx((i) => Math.max(i - 1, 0));
  const opacity = enter;
  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.fill, { backgroundColor: c.obsidian }]}>
        {/* progress bars */}
        <View style={styles.bars}>
          {slides.map((sl, i) => (
            <View key={sl.id} style={[styles.barTrack, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              {i < idx && <View style={[styles.barFill, { backgroundColor: c.ink, width: "100%" }]} />}
              {i === idx && (
                <Animated.View
                  style={[styles.barFill, { backgroundColor: c.ink, width: prog.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]}
                />
              )}
            </View>
          ))}
        </View>

        {/* close */}
        <Pressable onPress={onClose} style={[styles.close, { borderColor: c.line }]} hitSlop={10}>
          <Ionicons name="close" size={18} color={c.inkMuted} />
        </Pressable>

        {/* tap zones */}
        <Pressable style={styles.tapLeft} onPress={prev} />
        <Pressable style={styles.tapRight} onPress={next} />

        {/* slide */}
        <View style={styles.center} pointerEvents="box-none">
          <Animated.View style={{ opacity, transform: [{ translateY }], alignItems: "center", paddingHorizontal: 28 }}>
            <View style={[styles.icon, { borderColor: c.line, backgroundColor: c.fill }]}>
              <Ionicons name={slide.icon} size={20} color={c.ink} />
            </View>
            <Text style={[styles.eyebrow, { color: c.inkFaint }]}>{slide.eyebrow.toUpperCase()}</Text>
            <View style={styles.bigWrap}>{slide.big}</View>
            <Text style={[styles.caption, { color: c.inkMuted }]}>{slide.caption}</Text>

            {idx === last && (
              <View style={styles.actions} pointerEvents="auto">
                <PressableScale style={[styles.replay, { borderColor: c.line }]} onPress={() => setIdx(0)}>
                  <Ionicons name="refresh" size={15} color={c.ink} />
                  <Text style={[styles.replayText, { color: c.ink }]}>Replay</Text>
                </PressableScale>
                <PressableScale style={[styles.done, { backgroundColor: c.ink }]} onPress={onClose} haptics="medium">
                  <Text style={[styles.doneText, { color: c.obsidian }]}>Done</Text>
                  <Ionicons name="sparkles" size={15} color={c.obsidian} />
                </PressableScale>
              </View>
            )}
          </Animated.View>
        </View>

        <Text style={[styles.brand, { color: c.inkFaint }]}>TheLifeOS</Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  bars: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", gap: 6, paddingTop: 56, paddingHorizontal: 14, zIndex: 20 },
  barTrack: { flex: 1, height: 3, borderRadius: 2, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 2 },
  close: { position: "absolute", top: 70, right: 18, width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center", zIndex: 30 },
  tapLeft: { position: "absolute", top: 0, bottom: 0, left: 0, width: "33%", zIndex: 10 },
  tapRight: { position: "absolute", top: 0, bottom: 0, right: 0, width: "67%", zIndex: 10 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", zIndex: 15 },
  icon: { width: 48, height: 48, borderRadius: radius.lg, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 22 },
  eyebrow: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 2, marginBottom: 16 },
  bigWrap: { alignItems: "center" },
  caption: { fontFamily: fonts.body, fontSize: 16, textAlign: "center", marginTop: 26, lineHeight: 23, maxWidth: 300 },
  actions: { flexDirection: "row", gap: 12, marginTop: 36 },
  replay: { flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 18, paddingVertical: 11 },
  replayText: { fontFamily: fonts.bodyBold, fontSize: 14 },
  done: { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: radius.pill, paddingHorizontal: 20, paddingVertical: 11 },
  doneText: { fontFamily: fonts.bodyBold, fontSize: 14 },
  brand: { position: "absolute", bottom: 28, alignSelf: "center", fontFamily: fonts.displayBold, fontSize: 14, letterSpacing: -0.3 },
});
