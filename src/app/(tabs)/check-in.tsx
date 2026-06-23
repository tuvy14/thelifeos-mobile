import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/screen";
import { theme, radius } from "@/lib/theme";
import { useStore, scoreFor, todayLog, RITUALS } from "@/lib/store";

function Stepper({
  label,
  unit,
  value,
  onChange,
  step = 0.5,
}: {
  label: string;
  unit: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
}) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepLabel}>{label}</Text>
      <View style={styles.stepControls}>
        <Pressable style={styles.stepBtn} onPress={() => onChange(Math.max(0, round(value - step)))}>
          <Ionicons name="remove" size={18} color={theme.ink} />
        </Pressable>
        <Text style={styles.stepValue}>
          {round(value)}
          <Text style={styles.stepUnit}> {unit}</Text>
        </Text>
        <Pressable style={styles.stepBtn} onPress={() => onChange(round(value + step))}>
          <Ionicons name="add" size={18} color={theme.ink} />
        </Pressable>
      </View>
    </View>
  );
}

function Scale({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <View style={styles.scale}>
      <View style={styles.scaleHeader}>
        <Text style={styles.stepLabel}>{label}</Text>
        <Text style={styles.scaleValue}>{value || 1}/10</Text>
      </View>
      <Slider
        minimumValue={1}
        maximumValue={10}
        step={1}
        value={value || 1}
        onValueChange={onChange}
        minimumTrackTintColor={theme.ink}
        maximumTrackTintColor={theme.line}
        thumbTintColor={theme.ink}
      />
    </View>
  );
}

export default function CheckinScreen() {
  const { logs, saveCheckin } = useStore();
  const existing = todayLog(logs);

  const [sleep, setSleep] = useState(existing?.sleep ?? 0);
  const [water, setWater] = useState(existing?.water ?? 0);
  const [deepWork, setDeepWork] = useState(existing?.deepWork ?? 0);
  const [mood, setMood] = useState(existing?.mood ?? 0);
  const [energy, setEnergy] = useState(existing?.energy ?? 0);
  const [rituals, setRituals] = useState<string[]>(existing?.rituals ?? []);
  const [intention, setIntention] = useState(existing?.intention ?? "");
  const [saved, setSaved] = useState(false);

  const draft = { sleep, water, deepWork, mood, energy, rituals, intention: intention.trim() };
  const live = scoreFor({ date: "", ...draft });

  const toggle = (id: string) =>
    setRituals((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));

  const save = () => {
    saveCheckin(draft);
    setSaved(true);
    setTimeout(() => router.navigate("/"), 700);
  };

  return (
    <Screen>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>DAILY RITUAL</Text>
          <Text style={styles.title}>Check-in</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.live}>{live}</Text>
          <Text style={styles.liveLabel}>live score</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Stepper label="Sleep" unit="hrs" value={sleep} onChange={setSleep} />
        <Stepper label="Water" unit="L" value={water} onChange={setWater} step={0.25} />
        <Stepper label="Deep work" unit="hrs" value={deepWork} onChange={setDeepWork} />
      </View>

      <View style={styles.card}>
        <Scale label="Mood" value={mood} onChange={setMood} />
        <Scale label="Energy" value={energy} onChange={setEnergy} />
      </View>

      <Text style={styles.section}>RITUALS</Text>
      <View style={styles.ritualWrap}>
        {RITUALS.map((r) => {
          const on = rituals.includes(r.id);
          return (
            <Pressable
              key={r.id}
              onPress={() => toggle(r.id)}
              style={[styles.ritual, on && styles.ritualOn]}
            >
              <Text style={[styles.ritualText, on && styles.ritualTextOn]}>
                {r.emoji} {r.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.section}>TODAY&apos;S FOCUS</Text>
      <TextInput
        value={intention}
        onChangeText={setIntention}
        placeholder="The one thing that would make today a win…"
        placeholderTextColor={theme.inkFaint}
        style={styles.focusInput}
        multiline
      />

      <Pressable style={styles.save} onPress={save}>
        {saved ? (
          <>
            <Ionicons name="checkmark" size={18} color={theme.obsidian} />
            <Text style={styles.saveText}>Locked in</Text>
          </>
        ) : (
          <Text style={styles.saveText}>Save check-in</Text>
        )}
      </Pressable>
    </Screen>
  );
}

const round = (n: number) => Math.round(n * 100) / 100;

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 },
  eyebrow: { color: theme.inkFaint, fontSize: 11, fontWeight: "700", letterSpacing: 1.5 },
  title: { color: theme.ink, fontSize: 28, fontWeight: "800", marginTop: 4, letterSpacing: -0.5 },
  live: { color: theme.ink, fontSize: 26, fontWeight: "800" },
  liveLabel: { color: theme.inkFaint, fontSize: 11 },
  card: {
    backgroundColor: theme.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 18,
    marginBottom: 14,
    gap: 6,
  },
  stepper: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  stepLabel: { color: theme.ink, fontSize: 15, fontWeight: "600" },
  stepControls: { flexDirection: "row", alignItems: "center", gap: 14 },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: theme.line,
    alignItems: "center",
    justifyContent: "center",
  },
  stepValue: { color: theme.ink, fontSize: 18, fontWeight: "800", minWidth: 64, textAlign: "center" },
  stepUnit: { color: theme.inkFaint, fontSize: 12, fontWeight: "400" },
  scale: { paddingVertical: 6 },
  scaleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  scaleValue: { color: theme.ink, fontSize: 15, fontWeight: "700" },
  section: { color: theme.inkFaint, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 10, marginTop: 4 },
  ritualWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
  ritual: { borderWidth: 1, borderColor: theme.line, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9 },
  ritualOn: { backgroundColor: theme.ink, borderColor: theme.ink },
  ritualText: { color: theme.inkMuted, fontSize: 13, fontWeight: "600" },
  ritualTextOn: { color: theme.obsidian },
  focusInput: {
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: radius.md,
    padding: 14,
    color: theme.ink,
    fontSize: 14,
    minHeight: 56,
    marginBottom: 20,
  },
  save: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: theme.ink,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: theme.obsidian, fontSize: 15, fontWeight: "800" },
});
