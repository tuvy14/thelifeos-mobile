import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { SubScreen } from "@/components/sub-screen";
import { Card } from "@/components/ui";
import { useTheme, radius, fonts, type Palette } from "@/lib/theme";
import {
  useStore,
  monthRevenue,
  monthExpenses,
  mrr,
  moneyByMonth,
  revenueByCategory,
  REVENUE_CATEGORIES,
  EXPENSE_CATEGORIES,
  type RevenueEntry,
  type Expense,
} from "@/lib/store";

const money = (n: number) => (n < 0 ? "-$" : "$") + Math.abs(n).toLocaleString();

export default function MoneyScreen() {
  const store = useStore();
  const { revenue, expenses, moneyGoal, addRevenue, addExpense, deleteRevenue, deleteExpense, setMoneyGoal } = store;
  const { c } = useTheme();
  const s = makeStyles(c);

  const [tab, setTab] = useState<"income" | "expense">("income");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState(REVENUE_CATEGORIES[0]);
  const [recurring, setRecurring] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");

  const month = monthRevenue(revenue);
  const monthExp = monthExpenses(expenses);
  const mrrVal = mrr(revenue);
  const byMonth = moneyByMonth(revenue, expenses, 6);
  const byCat = revenueByCategory(revenue);
  const net = month - monthExp;
  const allTime = revenue.reduce((a, e) => a + e.amount, 0);
  const goalPct = moneyGoal > 0 ? Math.min(100, Math.round((month / moneyGoal) * 100)) : 0;
  const chartMax = Math.max(1, ...byMonth.map((m) => Math.max(m.revenue, m.expenses)));
  const catTotal = byCat.reduce((a, x) => a + x.amount, 0);
  const cats = tab === "income" ? REVENUE_CATEGORIES : EXPENSE_CATEGORIES;

  const submit = () => {
    const a = parseFloat(amount);
    if (!a) return;
    if (tab === "income") addRevenue(a, note, category, recurring);
    else addExpense(a, note, category);
    setAmount(""); setNote(""); setRecurring(false);
  };
  const saveGoal = () => { setMoneyGoal(parseFloat(goalInput) || 0); setEditingGoal(false); };

  const stats = [
    { label: "Revenue · mo", value: money(month), icon: "trending-up-outline" as const },
    { label: "Expenses · mo", value: money(monthExp), icon: "receipt-outline" as const },
    { label: "Net · mo", value: money(net), icon: "wallet-outline" as const },
    { label: "MRR", value: money(mrrVal), icon: "repeat-outline" as const },
  ];
  const list: (RevenueEntry | Expense)[] = tab === "income" ? revenue : expenses;

  return (
    <SubScreen eyebrow="Business" title="Money">
      <Text style={s.sub}>Revenue, expenses, recurring income and goals — the business side of your life.</Text>

      {/* Stats */}
      <View style={s.statGrid}>
        {stats.map((st) => (
          <Card key={st.label} style={s.statCard} padding={16}>
            <View style={s.statHead}>
              <Ionicons name={st.icon} size={13} color={c.inkFaint} />
              <Text style={s.statLabel}>{st.label.toUpperCase()}</Text>
            </View>
            <Text style={s.statValue}>{st.value}</Text>
          </Card>
        ))}
      </View>

      {/* Goal */}
      <Card style={{ marginTop: 14 }}>
        <View style={s.rowBetween}>
          <View style={s.rowCenter}>
            <Ionicons name="locate-outline" size={16} color={c.ink} />
            <Text style={s.cardTitle}>Monthly revenue goal</Text>
          </View>
          {editingGoal ? (
            <View style={s.rowCenter}>
              <Text style={s.dollar}>$</Text>
              <TextInput
                autoFocus value={goalInput} onChangeText={setGoalInput} keyboardType="numeric"
                placeholder="5000" placeholderTextColor={c.inkFaint} onBlur={saveGoal} onSubmitEditing={saveGoal}
                style={s.goalInput}
              />
            </View>
          ) : (
            <Pressable onPress={() => { setGoalInput(moneyGoal ? String(moneyGoal) : ""); setEditingGoal(true); }}>
              <Text style={s.link}>{moneyGoal ? "Edit" : "Set goal"}</Text>
            </Pressable>
          )}
        </View>
        {moneyGoal > 0 ? (
          <>
            <View style={[s.track, { backgroundColor: c.fillStrong, marginTop: 12 }]}>
              <View style={[s.fill, { width: `${goalPct}%`, backgroundColor: c.ink }]} />
            </View>
            <View style={[s.rowBetween, { marginTop: 8 }]}>
              <Text style={s.muted}>{money(month)} of {money(moneyGoal)}</Text>
              <Text style={s.ink}>{goalPct}%</Text>
            </View>
          </>
        ) : (
          <Text style={[s.muted, { marginTop: 8 }]}>Set a monthly target to track your progress.</Text>
        )}
      </Card>

      {/* 6-month trend */}
      <Card style={{ marginTop: 14 }}>
        <View style={s.rowCenter}>
          <Ionicons name="bar-chart-outline" size={16} color={c.ink} />
          <Text style={s.cardTitle}>Last 6 months</Text>
        </View>
        <View style={s.chart}>
          {byMonth.map((m) => (
            <View key={m.ym} style={s.barCol}>
              <View style={s.barPair}>
                <View style={{ flex: 1, alignItems: "center", justifyContent: "flex-end" }}>
                  <View style={{ width: "70%", height: `${(m.revenue / chartMax) * 100}%`, minHeight: m.revenue ? 4 : 0, backgroundColor: c.ink, borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
                </View>
                <View style={{ flex: 1, alignItems: "center", justifyContent: "flex-end" }}>
                  <View style={{ width: "70%", height: `${(m.expenses / chartMax) * 100}%`, minHeight: m.expenses ? 4 : 0, backgroundColor: c.chipBorder, borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
                </View>
              </View>
              <Text style={s.barLabel}>{m.label}</Text>
            </View>
          ))}
        </View>
        <View style={[s.rowCenter, { marginTop: 14, gap: 16 }]}>
          <View style={s.legendItem}><View style={[s.swatch, { backgroundColor: c.ink }]} /><Text style={s.muted}>Revenue</Text></View>
          <View style={s.legendItem}><View style={[s.swatch, { backgroundColor: c.chipBorder }]} /><Text style={s.muted}>Expenses</Text></View>
          <Text style={[s.muted, { marginLeft: "auto" }]}>All time · {money(allTime)}</Text>
        </View>
      </Card>

      {/* By source */}
      {byCat.length > 0 && (
        <Card style={{ marginTop: 14, gap: 12 }}>
          <View style={s.rowCenter}>
            <Ionicons name="pie-chart-outline" size={16} color={c.ink} />
            <Text style={s.cardTitle}>Revenue by source · this month</Text>
          </View>
          {byCat.map((x) => (
            <View key={x.category}>
              <View style={[s.rowBetween, { marginBottom: 5 }]}>
                <Text style={s.ink}>{x.category}</Text>
                <Text style={s.muted}>{money(x.amount)} · {Math.round((x.amount / catTotal) * 100)}%</Text>
              </View>
              <View style={[s.track, { backgroundColor: c.fillStrong }]}>
                <View style={[s.fill, { width: `${(x.amount / catTotal) * 100}%`, backgroundColor: c.ink }]} />
              </View>
            </View>
          ))}
        </Card>
      )}

      {/* Log form */}
      <Card style={{ marginTop: 14 }}>
        <View style={[s.segment, { borderColor: c.line, backgroundColor: c.fill }]}>
          {(["income", "expense"] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => { setTab(t); setCategory((t === "income" ? REVENUE_CATEGORIES : EXPENSE_CATEGORIES)[0]); }}
              style={[s.segBtn, tab === t && { backgroundColor: c.ink }]}
            >
              <Text style={[s.segText, { color: tab === t ? c.obsidian : c.inkMuted }]}>{t[0].toUpperCase() + t.slice(1)}</Text>
            </Pressable>
          ))}
        </View>
        <View style={s.formRow}>
          <View style={[s.amountBox, { borderColor: c.line, backgroundColor: c.fill }]}>
            <Text style={s.dollar}>$</Text>
            <TextInput value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" placeholderTextColor={c.inkFaint} style={s.amountInput} />
          </View>
          <TextInput
            value={note} onChangeText={setNote}
            placeholder={tab === "income" ? "What from? (client, sale…)" : "What for? (ads, tools…)"}
            placeholderTextColor={c.inkFaint} style={[s.noteInput, { borderColor: c.line, backgroundColor: c.fill }]}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }} contentContainerStyle={{ gap: 8 }}>
          {cats.map((cat) => {
            const on = category === cat;
            return (
              <Pressable key={cat} onPress={() => setCategory(cat)} style={[s.catChip, { borderColor: on ? c.ink : c.line, backgroundColor: on ? c.ink : "transparent" }]}>
                <Text style={[s.catChipText, { color: on ? c.obsidian : c.inkMuted }]}>{cat}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={[s.rowCenter, { marginTop: 12, justifyContent: "space-between" }]}>
          {tab === "income" ? (
            <Pressable onPress={() => setRecurring((r) => !r)} style={[s.recurring, { borderColor: recurring ? c.ink : c.line, backgroundColor: recurring ? c.ink : c.fill }]}>
              <Ionicons name="repeat-outline" size={14} color={recurring ? c.obsidian : c.inkMuted} />
              <Text style={[s.recurringText, { color: recurring ? c.obsidian : c.inkMuted }]}>Recurring</Text>
            </Pressable>
          ) : <View />}
          <Pressable style={[s.addBtn, { backgroundColor: c.ink }]} onPress={submit}>
            <Ionicons name="add" size={16} color={c.obsidian} />
            <Text style={[s.addText, { color: c.obsidian }]}>Add {tab}</Text>
          </Pressable>
        </View>
      </Card>

      {/* Entries */}
      <View style={{ marginTop: 14, gap: 8 }}>
        {list.length === 0 ? (
          <Card style={{ alignItems: "center", paddingVertical: 40 }}>
            <Text style={s.muted}>No {tab} logged yet.</Text>
          </Card>
        ) : (
          list.map((e) => (
            <View key={e.id} style={[s.entry, { borderColor: c.line, backgroundColor: c.card }]}>
              <Text style={s.entryAmt}>{tab === "expense" ? "-" : ""}${e.amount.toLocaleString()}</Text>
              <View style={s.entryMid}>
                <Text style={s.entryNote} numberOfLines={1}>{e.note || "—"}</Text>
                {e.category ? (
                  <View style={[s.tag, { borderColor: c.line }]}><Text style={s.tagText}>{e.category}</Text></View>
                ) : null}
                {tab === "income" && (e as RevenueEntry).recurring ? (
                  <View style={[s.mrrTag, { backgroundColor: c.ink }]}><Text style={[s.mrrText, { color: c.obsidian }]}>MRR</Text></View>
                ) : null}
              </View>
              <Pressable hitSlop={8} onPress={() => (tab === "income" ? deleteRevenue(e.id) : deleteExpense(e.id))}>
                <Ionicons name="trash-outline" size={14} color={c.inkFaint} />
              </Pressable>
            </View>
          ))
        )}
      </View>
    </SubScreen>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    sub: { fontFamily: fonts.body, fontSize: 13, color: c.inkMuted, marginTop: 4, lineHeight: 18 },
    statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 16 },
    statCard: { flexGrow: 1, flexBasis: "46%" },
    statHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
    statLabel: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.8, color: c.inkFaint },
    statValue: { fontFamily: fonts.displayBold, fontSize: 24, color: c.ink, letterSpacing: -0.5 },
    rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    rowCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
    cardTitle: { fontFamily: fonts.bodySemibold, fontSize: 14, color: c.ink },
    link: { fontFamily: fonts.body, fontSize: 12, color: c.inkMuted },
    dollar: { fontFamily: fonts.mono, fontSize: 14, color: c.inkFaint },
    goalInput: { width: 80, borderWidth: 1, borderColor: c.line, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 4, color: c.ink, fontFamily: fonts.body, fontSize: 14 },
    track: { height: 9, borderRadius: 5, overflow: "hidden" },
    fill: { height: 9, borderRadius: 5 },
    muted: { fontFamily: fonts.body, fontSize: 12, color: c.inkMuted },
    ink: { fontFamily: fonts.bodyMedium, fontSize: 12, color: c.ink },
    chart: { flexDirection: "row", alignItems: "flex-end", height: 150, gap: 10, marginTop: 18 },
    barCol: { flex: 1, alignItems: "center", gap: 6, height: "100%" },
    barPair: { flexDirection: "row", flex: 1, width: "100%", gap: 3 },
    barLabel: { fontFamily: fonts.mono, fontSize: 10, color: c.inkFaint },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    swatch: { width: 10, height: 10, borderRadius: 3 },
    segment: { flexDirection: "row", alignSelf: "flex-start", borderWidth: 1, borderRadius: radius.pill, padding: 4, marginBottom: 14 },
    segBtn: { paddingHorizontal: 18, paddingVertical: 7, borderRadius: radius.pill },
    segText: { fontFamily: fonts.bodyBold, fontSize: 13 },
    formRow: { flexDirection: "row", gap: 8 },
    amountBox: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 12 },
    amountInput: { width: 70, paddingVertical: 12, paddingHorizontal: 6, color: c.ink, fontFamily: fonts.body, fontSize: 14 },
    noteInput: { flex: 1, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, color: c.ink, fontFamily: fonts.body, fontSize: 14 },
    catChip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 13, paddingVertical: 7 },
    catChipText: { fontFamily: fonts.bodyMedium, fontSize: 12 },
    recurring: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 9 },
    recurringText: { fontFamily: fonts.bodyMedium, fontSize: 13 },
    addBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: radius.md, paddingHorizontal: 18, paddingVertical: 10 },
    addText: { fontFamily: fonts.bodyBold, fontSize: 13 },
    entry: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 11 },
    entryAmt: { fontFamily: fonts.displayBold, fontSize: 17, color: c.ink },
    entryMid: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
    entryNote: { fontFamily: fonts.body, fontSize: 13, color: c.inkMuted, flexShrink: 1 },
    tag: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
    tagText: { fontFamily: fonts.mono, fontSize: 10, color: c.inkFaint },
    mrrTag: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
    mrrText: { fontFamily: fonts.mono, fontSize: 10 },
  });
