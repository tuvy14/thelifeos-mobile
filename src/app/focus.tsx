import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { SubScreen } from "@/components/sub-screen";
import { Card } from "@/components/ui";
import { useTheme, radius, fonts, type Palette } from "@/lib/theme";
import { useStore, todayLog } from "@/lib/store";

const PRESETS = [25, 50, 90];

export default function FocusScreen() {
  const { logs, addFocusMinutes } = useStore();
  const { c } = useTheme();
  const s = makeStyles(c);
  const log = todayLog(logs);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [justLogged, setJustLogged] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) ref.current = setInterval(() => setSeconds((x) => x + 1), 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const reset = () => { setRunning(false); setSeconds(0); };
  const logSession = () => {
    addFocusMinutes(seconds / 60);
    reset();
    setJustLogged(true);
    setTimeout(() => setJustLogged(false), 2500);
  };

  return (
    <SubScreen eyebrow="Focus" title="Deep work">
      <Text style={s.sub}>Start a session. When you stop, log it to today.</Text>

      <Card style={{ marginTop: 16, alignItems: "center", gap: 28 }} padding={32} rounded={radius.xl}>
        <Text style={s.timer}>{mm}:{ss}</Text>
        <View style={s.controls}>
          <Pressable style={[s.primary, { backgroundColor: c.ink }]} onPress={() => setRunning((r) => !r)}>
            <Ionicons name={running ? "pause" : "play"} size={16} color={c.obsidian} />
            <Text style={[s.primaryText, { color: c.obsidian }]}>{running ? "Pause" : seconds > 0 ? "Resume" : "Start"}</Text>
          </Pressable>
          <Pressable style={[s.ghost, { borderColor: c.line }, seconds === 0 && { opacity: 0.4 }]} disabled={seconds === 0} onPress={reset}>
            <Ionicons name="refresh" size={15} color={c.ink} />
            <Text style={s.ghostText}>Reset</Text>
          </Pressable>
          <Pressable style={[s.ghost, { borderColor: c.line }, seconds < 60 && { opacity: 0.4 }]} disabled={seconds < 60} onPress={logSession}>
            <Ionicons name="checkmark" size={15} color={c.ink} />
            <Text style={s.ghostText}>Log</Text>
          </Pressable>
        </View>
        <View style={s.presets}>
          {PRESETS.map((m) => (
            <Pressable key={m} style={[s.preset, { borderColor: c.line }]} onPress={() => { setSeconds(m * 60); setRunning(false); }}>
              <Text style={s.presetText}>{m}m</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card style={{ marginTop: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View>
          <Text style={s.label}>DEEP WORK LOGGED TODAY</Text>
          <Text style={s.bigVal}>{log?.deepWork ?? 0}h</Text>
        </View>
        {justLogged && (
          <View style={[s.badge, { borderColor: c.line, backgroundColor: c.fill }]}>
            <Text style={s.badgeText}>✓ Session logged</Text>
          </View>
        )}
      </Card>
    </SubScreen>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    sub: { fontFamily: fonts.body, fontSize: 13, color: c.inkMuted, marginTop: 4 },
    timer: { fontFamily: fonts.mono, fontSize: 64, color: c.ink, letterSpacing: -2 },
    controls: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 10 },
    primary: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: radius.pill, paddingHorizontal: 22, paddingVertical: 13 },
    primaryText: { fontFamily: fonts.bodyBold, fontSize: 14 },
    ghost: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 13 },
    ghostText: { fontFamily: fonts.bodySemibold, fontSize: 14, color: c.ink },
    presets: { flexDirection: "row", gap: 8 },
    preset: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 7 },
    presetText: { fontFamily: fonts.mono, fontSize: 12, color: c.inkMuted },
    label: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1, color: c.inkFaint },
    bigVal: { fontFamily: fonts.displayBold, fontSize: 28, color: c.ink, marginTop: 4 },
    badge: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8 },
    badgeText: { fontFamily: fonts.body, fontSize: 12, color: c.ink },
  });
