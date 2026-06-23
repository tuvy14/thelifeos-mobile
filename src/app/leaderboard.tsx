import { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { SubScreen } from "@/components/sub-screen";
import { Card } from "@/components/ui";
import { useTheme, radius, fonts, type Palette } from "@/lib/theme";
import { useStore, scoreFor, todayLog, streak, scoreHistory, monthRevenue } from "@/lib/store";

const NAMES = [
  "Alex R.", "Sam K.", "Jordan P.", "Maya L.", "Chris D.", "Riley B.", "Nina V.", "Leo M.",
  "Ava S.", "Max T.", "Zoe H.", "Kai W.", "Ivy C.", "Noah G.", "Eli F.", "Mia J.", "Theo A.",
  "Luca N.", "Remy O.", "Juno P.", "Wren S.", "Nico B.", "Dax M.", "Cleo R.", "Aria L.",
  "Finn H.", "Iris K.", "Reed T.", "Sage D.", "Vera M.", "Ezra P.", "Lara V.", "Otto K.",
  "Nova S.", "Beau R.", "Indy L.", "Cody M.", "Tess H.", "Rune B.", "Skye D.", "Jax P.",
];
type Row = { name: string; points: number; streak: number; isYou?: boolean; delta: number };

export default function LeaderboardScreen() {
  const { logs, wins, revenue } = useStore();
  const { c } = useTheme();
  const s = makeStyles(c);
  const [mode, setMode] = useState<"week" | "all">("week");

  const score = scoreFor(todayLog(logs));
  const stk = streak(logs);
  const history = scoreHistory(logs, 30);
  const rev = monthRevenue(revenue);
  const bestScore = Math.max(score, ...history.map((h) => h.score), 0);
  const winsWeek = wins.filter((w) => w.ts >= Date.now() - 7 * 864e5).length;

  const board = useMemo<Row[]>(() => {
    let seed = mode === "week" ? 8123 : 4471;
    const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const youPoints = mode === "week"
      ? Math.round(bestScore + stk * 4 + winsWeek * 3)
      : Math.round(bestScore + wins.length * 4 + Math.min(rev / 20, 80));
    const rows: Row[] = NAMES.map((name) => {
      const base = mode === "week" ? 60 + rand() * 110 : 90 + rand() * 240;
      const st = Math.floor(rand() * 40);
      return { name, points: Math.round(base), streak: st, delta: Math.round((rand() - 0.5) * 6) };
    });
    rows.push({ name: "You", points: youPoints, streak: stk, isYou: true, delta: 2 });
    rows.sort((a, b) => b.points - a.points);
    return rows;
  }, [mode, bestScore, stk, winsWeek, wins.length, rev]);

  const yourRank = board.findIndex((r) => r.isYou) + 1;
  const top = board.slice(0, 12);
  const youInTop = top.some((r) => r.isYou);

  const Delta = ({ d }: { d: number }) =>
    d > 0 ? (
      <View style={s.deltaRow}><Ionicons name="arrow-up" size={11} color={c.ink} /><Text style={[s.deltaText, { color: c.ink }]}>{d}</Text></View>
    ) : d < 0 ? (
      <View style={s.deltaRow}><Ionicons name="arrow-down" size={11} color={c.inkFaint} /><Text style={[s.deltaText, { color: c.inkFaint }]}>{Math.abs(d)}</Text></View>
    ) : (
      <Ionicons name="remove" size={11} color={c.inkFaint} />
    );

  const RowItem = ({ r, rank }: { r: Row; rank: number }) => (
    <View style={[s.row, { borderColor: r.isYou ? c.chipBorder : c.line, backgroundColor: r.isYou ? c.chipBg : c.card }]}>
      <Text style={s.rank}>{rank}</Text>
      <View style={[s.avatar, { borderColor: c.line, backgroundColor: r.isYou ? c.ink : c.fill }]}>
        <Text style={[s.avatarText, { color: r.isYou ? c.obsidian : c.ink }]}>{r.name[0]}</Text>
      </View>
      <View style={s.nameWrap}>
        <Text style={s.name} numberOfLines={1}>{r.name}</Text>
        {r.isYou && <View style={[s.youPill, { backgroundColor: c.ink }]}><Text style={[s.youText, { color: c.obsidian }]}>YOU</Text></View>}
      </View>
      <View style={s.streakWrap}><Ionicons name="flame" size={11} color={c.inkMuted} /><Text style={s.streakText}>{r.streak}</Text></View>
      <View style={s.deltaWrap}><Delta d={r.delta} /></View>
      <Text style={s.points}>{r.points.toLocaleString()}</Text>
    </View>
  );

  return (
    <SubScreen eyebrow="Leaderboard" title="Where you stand">
      <Text style={s.sub}>Momentum, ranked. Show up daily to climb.</Text>

      <View style={[s.segment, { borderColor: c.line, backgroundColor: c.fill }]}>
        {(["week", "all"] as const).map((m) => (
          <Pressable key={m} onPress={() => setMode(m)} style={[s.segBtn, mode === m && { backgroundColor: c.ink }]}>
            <Text style={[s.segText, { color: mode === m ? c.obsidian : c.inkMuted }]}>{m === "week" ? "This week" : "All time"}</Text>
          </Pressable>
        ))}
      </View>

      <Card style={{ marginTop: 14, flexDirection: "row", justifyContent: "space-between" }}>
        <View>
          <Text style={s.miniLabel}>YOUR RANK</Text>
          <Text style={s.rankBig}>#{yourRank}<Text style={s.rankOf}> of {board.length}</Text></Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={s.miniLabel}>MOMENTUM</Text>
          <Text style={s.momentum}>{board[yourRank - 1]?.points.toLocaleString()}</Text>
        </View>
      </Card>

      <View style={{ marginTop: 14, gap: 8 }}>
        {top.map((r, i) => <RowItem key={r.name} r={r} rank={i + 1} />)}
        {!youInTop && (
          <>
            <Text style={s.dots}>···</Text>
            <RowItem r={board[yourRank - 1]} rank={yourRank} />
          </>
        )}
      </View>
    </SubScreen>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    sub: { fontFamily: fonts.body, fontSize: 13, color: c.inkMuted, marginTop: 4 },
    segment: { flexDirection: "row", alignSelf: "flex-start", borderWidth: 1, borderRadius: radius.pill, padding: 4, marginTop: 16 },
    segBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: radius.pill },
    segText: { fontFamily: fonts.bodyBold, fontSize: 13 },
    miniLabel: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1, color: c.inkFaint },
    rankBig: { fontFamily: fonts.displayBold, fontSize: 36, color: c.ink, letterSpacing: -1, marginTop: 4 },
    rankOf: { fontFamily: fonts.body, fontSize: 15, color: c.inkMuted },
    momentum: { fontFamily: fonts.displayBold, fontSize: 28, color: c.ink, marginTop: 4 },
    row: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10 },
    rank: { width: 22, textAlign: "center", fontFamily: fonts.displayBold, fontSize: 13, color: c.inkFaint },
    avatar: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    avatarText: { fontFamily: fonts.displayBold, fontSize: 14 },
    nameWrap: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
    name: { fontFamily: fonts.bodyMedium, fontSize: 14, color: c.ink, flexShrink: 1 },
    youPill: { borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 2 },
    youText: { fontFamily: fonts.monoSemibold, fontSize: 8, letterSpacing: 1 },
    streakWrap: { flexDirection: "row", alignItems: "center", gap: 3 },
    streakText: { fontFamily: fonts.body, fontSize: 12, color: c.inkMuted },
    deltaWrap: { width: 28, alignItems: "flex-end" },
    deltaRow: { flexDirection: "row", alignItems: "center", gap: 1 },
    deltaText: { fontFamily: fonts.mono, fontSize: 11 },
    points: { width: 54, textAlign: "right", fontFamily: fonts.displayBold, fontSize: 15, color: c.ink },
    dots: { textAlign: "center", fontFamily: fonts.mono, fontSize: 12, color: c.inkFaint, paddingVertical: 2 },
  });
