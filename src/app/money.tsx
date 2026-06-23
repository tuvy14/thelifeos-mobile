import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { SubScreen } from "@/components/sub-screen";
import { theme, radius } from "@/lib/theme";
import { useStore, balance, today } from "@/lib/store";

export default function MoneyScreen() {
  const { money, addTxn, deleteTxn } = useStore();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isExpense, setIsExpense] = useState(true);

  const bal = balance(money);
  const income = money.filter((t) => t.amount > 0).reduce((a, t) => a + t.amount, 0);
  const spent = money.filter((t) => t.amount < 0).reduce((a, t) => a + t.amount, 0);

  const submit = () => {
    const n = parseFloat(amount);
    if (!Number.isFinite(n) || n <= 0) return;
    addTxn(isExpense ? -n : n, note);
    setAmount("");
    setNote("");
  };

  const todayStr = today();

  return (
    <SubScreen eyebrow="MONEY IN, MONEY OUT" title="Money">
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Net balance</Text>
        <Text style={[styles.balance, bal < 0 && { color: theme.inkMuted }]}>{fmtMoney(bal)}</Text>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceSub}>↑ {fmtMoney(income)} in</Text>
          <Text style={styles.balanceSub}>↓ {fmtMoney(Math.abs(spent))} out</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.segment}>
          <Pressable
            style={[styles.segBtn, isExpense && styles.segOn]}
            onPress={() => setIsExpense(true)}
          >
            <Text style={[styles.segText, isExpense && styles.segTextOn]}>Expense</Text>
          </Pressable>
          <Pressable
            style={[styles.segBtn, !isExpense && styles.segOn]}
            onPress={() => setIsExpense(false)}
          >
            <Text style={[styles.segText, !isExpense && styles.segTextOn]}>Income</Text>
          </Pressable>
        </View>
        <View style={styles.addRow}>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={theme.inkFaint}
            keyboardType="numeric"
            style={[styles.input, { flex: 1 }]}
          />
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Note"
            placeholderTextColor={theme.inkFaint}
            style={[styles.input, { flex: 1.6 }]}
            returnKeyType="done"
            onSubmitEditing={submit}
          />
          <Pressable style={styles.addBtn} onPress={submit}>
            <Ionicons name="add" size={22} color={theme.obsidian} />
          </Pressable>
        </View>
      </View>

      {money.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="wallet-outline" size={28} color={theme.inkFaint} />
          <Text style={styles.emptyText}>No transactions yet.</Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {money.map((t) => (
            <View key={t.id} style={styles.item}>
              <View style={styles.itemIcon}>
                <Ionicons
                  name={t.amount < 0 ? "arrow-down" : "arrow-up"}
                  size={15}
                  color={theme.inkMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemNote}>{t.note || (t.amount < 0 ? "Expense" : "Income")}</Text>
                <Text style={styles.itemDate}>{t.date === todayStr ? "Today" : t.date}</Text>
              </View>
              <Text style={[styles.itemAmt, t.amount > 0 && { color: theme.ink }]}>
                {t.amount < 0 ? "−" : "+"}${Math.abs(t.amount).toLocaleString()}
              </Text>
              <Pressable hitSlop={8} onPress={() => deleteTxn(t.id)} style={{ marginLeft: 10 }}>
                <Ionicons name="trash-outline" size={15} color={theme.inkFaint} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </SubScreen>
  );
}

function fmtMoney(n: number) {
  const sign = n < 0 ? "−" : "";
  return `${sign}$${Math.abs(n).toLocaleString()}`;
}

const styles = StyleSheet.create({
  balanceCard: {
    backgroundColor: theme.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 22,
    alignItems: "center",
    marginBottom: 14,
  },
  balanceLabel: { color: theme.inkFaint, fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
  balance: { color: theme.ink, fontSize: 40, fontWeight: "800", letterSpacing: -1, marginTop: 6 },
  balanceRow: { flexDirection: "row", gap: 18, marginTop: 10 },
  balanceSub: { color: theme.inkMuted, fontSize: 12, fontWeight: "600" },
  card: {
    backgroundColor: theme.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 16,
    marginBottom: 18,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: theme.obsidian,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 4,
    marginBottom: 12,
  },
  segBtn: { flex: 1, paddingVertical: 9, borderRadius: radius.sm, alignItems: "center" },
  segOn: { backgroundColor: theme.ink },
  segText: { color: theme.inkMuted, fontSize: 13, fontWeight: "700" },
  segTextOn: { color: theme.obsidian },
  addRow: { flexDirection: "row", gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.ink,
    fontSize: 14,
  },
  addBtn: {
    width: 46,
    backgroundColor: theme.ink,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { alignItems: "center", gap: 10, paddingVertical: 48 },
  emptyText: { color: theme.inkFaint, fontSize: 14 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 14,
  },
  itemIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: theme.line,
    alignItems: "center",
    justifyContent: "center",
  },
  itemNote: { color: theme.ink, fontSize: 14, fontWeight: "600" },
  itemDate: { color: theme.inkFaint, fontSize: 11, marginTop: 2 },
  itemAmt: { color: theme.inkMuted, fontSize: 15, fontWeight: "800" },
});
