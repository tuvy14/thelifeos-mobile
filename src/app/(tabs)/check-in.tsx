import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/screen";
import { Card, Eyebrow } from "@/components/ui";
import { useTheme, radius, fonts, type Palette } from "@/lib/theme";
import {
  useStore,
  scoreFor,
  todayLog,
  FOCUS_RITUALS,
  activeMode,
} from "@/lib/store";
import { useCelebrate } from "@/lib/celebrate";

const numState = (v?: number) => (v ? String(v) : "");

export default function CheckinScreen() {
  const { logs, mode, profile, saveCheckin } = useStore();
  const { celebrate } = useCelebrate();
  const { c } = useTheme();
  const s = makeStyles(c);
  const existing = todayLog(logs);

  // numeric
  const [sleep, setSleep] = useState(numState(existing?.sleep));
  const [water, setWater] = useState(numState(existing?.water));
  const [deepWork, setDeepWork] = useState(numState(existing?.deepWork));
  const [steps, setSteps] = useState(numState(existing?.steps));
  const [screenTime, setScreenTime] = useState(numState(existing?.screenTime));
  const [weight, setWeight] = useState(numState(existing?.weight));
  const [restingHR, setRestingHR] = useState(numState(existing?.restingHR));
  const [caffeine, setCaffeine] = useState(numState(existing?.caffeine));
  const [alcohol, setAlcohol] = useState(numState(existing?.alcohol));
  const [tasksDone, setTasksDone] = useState(numState(existing?.tasksDone));
  const [outdoors, setOutdoors] = useState(numState(existing?.outdoors));
  const [meditation, setMeditation] = useState(numState(existing?.meditation));
  // scales
  const [mood, setMood] = useState(existing?.mood || 0);
  const [energy, setEnergy] = useState(existing?.energy || 0);
  const [nutrition, setNutrition] = useState(existing?.nutrition || 0);
  const [sleepQuality, setSleepQuality] = useState(existing?.sleepQuality || 0);
  const [stress, setStress] = useState(existing?.stress || 0);
  const [social, setSocial] = useState(existing?.social || 0);
  const [productivity, setProductivity] = useState(existing?.productivity || 0);
  // text
  const [intention, setIntention] = useState(existing?.intention || "");
  const [gratitude, setGratitude] = useState(existing?.gratitude || "");
  const [highlight, setHighlight] = useState(existing?.highlight || "");
  const [improve, setImprove] = useState(existing?.improve || "");
  const [rituals, setRituals] = useState<string[]>(existing?.rituals || []);
  const [saved, setSaved] = useState(false);

  const ritualsForMode = FOCUS_RITUALS[activeMode(mode, profile)] ?? FOCUS_RITUALS.habits;

  const draft = {
    sleep: +sleep || 0, water: +water || 0, deepWork: +deepWork || 0, mood, energy, rituals,
    steps: +steps || 0, screenTime: +screenTime || 0, nutrition, intention: intention.trim(),
    gratitude: gratitude.trim(), weight: +weight || 0, restingHR: +restingHR || 0, sleepQuality,
    caffeine: +caffeine || 0, alcohol: +alcohol || 0, tasksDone: +tasksDone || 0,
    outdoors: +outdoors || 0, meditation: +meditation || 0, stress, social, productivity,
    highlight: highlight.trim(), improve: improve.trim(),
  };
  const liveScore = scoreFor({ date: "", ...draft });

  const toggleRitual = (id: string) =>
    setRituals((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));

  const save = () => {
    saveCheckin(draft);
    setSaved(true);
    celebrate("Checked in — today's win is logged 🔥");
    setTimeout(() => router.navigate("/"), 850);
  };

  const Num = ({ icon, label, unit, value, onChange }: {
    icon: keyof typeof Ionicons.glyphMap; label: string; unit: string; value: string; onChange: (v: string) => void;
  }) => (
    <View style={s.numCard}>
      <View style={s.numHead}>
        <Ionicons name={icon} size={14} color={c.inkMuted} />
        <Text style={s.numLabel}>{label.toUpperCase()}</Text>
      </View>
      <View style={s.numRow}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="0"
          placeholderTextColor={c.inkFaint}
          keyboardType="numeric"
          style={s.numInput}
        />
        <Text style={s.numUnit}>{unit}</Text>
      </View>
    </View>
  );

  const Scale = ({ label, value, onChange, low, high }: {
    label: string; value: number; onChange: (n: number) => void; low?: string; high?: string;
  }) => (
    <View style={s.scale}>
      <View style={s.scaleHead}>
        <Text style={s.numLabel}>{label.toUpperCase()}</Text>
        <Text style={s.scaleVal}>
          {value ? value : "—"}<Text style={s.scaleMax}> /10</Text>
        </Text>
      </View>
      <Slider
        minimumValue={1} maximumValue={10} step={1} value={value || 1}
        onValueChange={onChange}
        minimumTrackTintColor={c.ink} maximumTrackTintColor={c.line} thumbTintColor={c.ink}
      />
      {(low || high) && (
        <View style={s.scaleEnds}>
          <Text style={s.scaleEnd}>{low}</Text>
          <Text style={s.scaleEnd}>{high}</Text>
        </View>
      )}
    </View>
  );

  const TextRow = ({ icon, label, placeholder, value, onChange }: {
    icon: keyof typeof Ionicons.glyphMap; label: string; placeholder: string; value: string; onChange: (v: string) => void;
  }) => (
    <View>
      <View style={s.numHead}>
        <Ionicons name={icon} size={14} color={c.inkMuted} />
        <Text style={s.numLabel}>{label.toUpperCase()}</Text>
      </View>
      <TextInput
        value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={c.inkFaint}
        style={s.textField} multiline
      />
    </View>
  );

  return (
    <Screen>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Eyebrow>Daily ritual</Eyebrow>
          <Text style={s.title}>Daily check-in</Text>
          <Text style={s.sub}>The full picture. Log what you can — everything compounds.</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={s.live}>{liveScore}</Text>
          <Text style={s.liveLabel}>live score</Text>
        </View>
      </View>

      <Text style={s.section}>BODY</Text>
      <View style={s.grid}>
        <Num icon="moon-outline" label="Sleep" unit="hrs" value={sleep} onChange={setSleep} />
        <Num icon="water-outline" label="Water" unit="L" value={water} onChange={setWater} />
        <Num icon="barbell-outline" label="Weight" unit="kg" value={weight} onChange={setWeight} />
        <Num icon="heart-outline" label="Resting HR" unit="bpm" value={restingHR} onChange={setRestingHR} />
      </View>
      <Card style={{ marginTop: 12 }}><Scale label="Sleep quality" value={sleepQuality} onChange={setSleepQuality} low="poor" high="great" /></Card>

      <Text style={s.section}>INTAKE</Text>
      <View style={s.grid}>
        <Num icon="cafe-outline" label="Caffeine" unit="cups" value={caffeine} onChange={setCaffeine} />
        <Num icon="wine-outline" label="Alcohol" unit="drinks" value={alcohol} onChange={setAlcohol} />
      </View>
      <Card style={{ marginTop: 12 }}><Scale label="Nutrition" value={nutrition} onChange={setNutrition} low="junk" high="clean" /></Card>

      <Text style={s.section}>MOVEMENT & FOCUS</Text>
      <View style={s.grid}>
        <Num icon="walk-outline" label="Steps" unit="steps" value={steps} onChange={setSteps} />
        <Num icon="flash-outline" label="Deep work" unit="hrs" value={deepWork} onChange={setDeepWork} />
        <Num icon="checkbox-outline" label="Tasks done" unit="tasks" value={tasksDone} onChange={setTasksDone} />
        <Num icon="sunny-outline" label="Outdoors" unit="min" value={outdoors} onChange={setOutdoors} />
        <Num icon="happy-outline" label="Meditation" unit="min" value={meditation} onChange={setMeditation} />
        <Num icon="phone-portrait-outline" label="Screen time" unit="hrs" value={screenTime} onChange={setScreenTime} />
      </View>

      <Text style={s.section}>MIND</Text>
      <Card style={{ gap: 18 }}>
        <Scale label="Mood" value={mood} onChange={setMood} low="low" high="great" />
        <Scale label="Energy" value={energy} onChange={setEnergy} low="drained" high="wired" />
        <Scale label="Stress" value={stress} onChange={setStress} low="calm" high="frazzled" />
        <Scale label="Social connection" value={social} onChange={setSocial} low="isolated" high="connected" />
        <Scale label="Productivity" value={productivity} onChange={setProductivity} low="scattered" high="dialed in" />
      </Card>

      <Text style={s.section}>FOCUS RITUALS</Text>
      <Card>
        <View style={s.ritualWrap}>
          {ritualsForMode.map((r) => {
            const on = rituals.includes(r.id);
            return (
              <Pressable
                key={r.id}
                onPress={() => toggleRitual(r.id)}
                style={[s.ritual, { borderColor: on ? c.ink : c.line, backgroundColor: on ? c.ink : c.fill }]}
              >
                <Text style={[s.ritualText, { color: on ? c.obsidian : c.inkMuted }]}>{r.emoji} {r.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Text style={s.section}>REFLECT</Text>
      <Card style={{ gap: 18 }}>
        <TextRow icon="locate-outline" label="Today's focus" placeholder="The one thing that would make today a win…" value={intention} onChange={setIntention} />
        <TextRow icon="sparkles-outline" label="Highlight" placeholder="The best moment of your day…" value={highlight} onChange={setHighlight} />
        <TextRow icon="heart-outline" label="Grateful for" placeholder="One thing you're grateful for…" value={gratitude} onChange={setGratitude} />
        <TextRow icon="bulb-outline" label="Could improve" placeholder="What drained you, or could be better tomorrow…" value={improve} onChange={setImprove} />
      </Card>

      <Pressable style={[s.save, { backgroundColor: c.ink }]} onPress={save}>
        {saved ? (
          <>
            <Ionicons name="checkmark" size={18} color={c.obsidian} />
            <Text style={[s.saveText, { color: c.obsidian }]}>Locked in — great day!</Text>
          </>
        ) : (
          <Text style={[s.saveText, { color: c.obsidian }]}>Save check-in</Text>
        )}
      </Pressable>
    </Screen>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    header: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 12 },
    title: { fontFamily: fonts.displayBold, fontSize: 28, color: c.ink, letterSpacing: -0.5, marginTop: 8 },
    sub: { fontFamily: fonts.body, fontSize: 13, color: c.inkMuted, marginTop: 3, lineHeight: 18 },
    live: { fontFamily: fonts.displayBold, fontSize: 24, color: c.ink },
    liveLabel: { fontFamily: fonts.body, fontSize: 11, color: c.inkFaint },
    section: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.6, color: c.inkFaint, marginTop: 24, marginBottom: 12 },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    numCard: { flexGrow: 1, flexBasis: "46%", backgroundColor: c.card, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: 14 },
    numHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
    numLabel: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1, color: c.inkMuted },
    numRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
    numInput: { fontFamily: fonts.displayBold, fontSize: 24, color: c.ink, minWidth: 60, padding: 0 },
    numUnit: { fontFamily: fonts.mono, fontSize: 13, color: c.inkFaint },
    scale: { paddingVertical: 2 },
    scaleHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
    scaleVal: { fontFamily: fonts.displayBold, fontSize: 17, color: c.ink },
    scaleMax: { fontFamily: fonts.mono, fontSize: 11, color: c.inkFaint },
    scaleEnds: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
    scaleEnd: { fontFamily: fonts.mono, fontSize: 10, color: c.inkFaint },
    textField: { borderWidth: 1, borderColor: c.line, borderRadius: radius.md, backgroundColor: c.fill, paddingHorizontal: 14, paddingVertical: 12, color: c.ink, fontFamily: fonts.body, fontSize: 14, minHeight: 48, textAlignVertical: "top" },
    ritualWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    ritual: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9 },
    ritualText: { fontFamily: fonts.bodyMedium, fontSize: 13 },
    save: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", borderRadius: radius.lg, paddingVertical: 16, marginTop: 28 },
    saveText: { fontFamily: fonts.displayBold, fontSize: 15 },
  });
