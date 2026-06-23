import { View, Text, Pressable, StyleSheet } from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/screen";
import { theme, radius } from "@/lib/theme";
import {
  useStore,
  balance,
  habitDoneToday,
  journalToday,
} from "@/lib/store";
import { useSync } from "@/lib/sync";

type Item = {
  href: Href;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
};

export default function MoreScreen() {
  const { habits, goals, journal, money } = useStore();
  const { configured, email, status } = useSync();

  const syncSub = !configured
    ? "Local only"
    : email
      ? status === "syncing"
        ? "Syncing…"
        : `Synced · ${email}`
      : "Sign in to sync devices";

  const habitsDone = habits.filter(habitDoneToday).length;
  const items: Item[] = [
    {
      href: "/habits",
      icon: "repeat-outline",
      title: "Habits",
      subtitle: habits.length
        ? `${habitsDone}/${habits.length} done today`
        : "Build a daily streak",
    },
    {
      href: "/goals",
      icon: "flag-outline",
      title: "Goals",
      subtitle: goals.length ? `${goals.length} in progress` : "Set something to aim at",
    },
    {
      href: "/journal",
      icon: "book-outline",
      title: "Journal",
      subtitle: journalToday(journal).length
        ? "Entry logged today"
        : journal.length
          ? `${journal.length} entries`
          : "Reflect on your day",
    },
    {
      href: "/money",
      icon: "wallet-outline",
      title: "Money",
      subtitle: money.length ? `Balance ${fmtMoney(balance(money))}` : "Track in & out",
    },
    {
      href: "/account",
      icon: email ? "cloud-done-outline" : "cloud-outline",
      title: "Cloud sync",
      subtitle: syncSub,
    },
    {
      href: "/settings",
      icon: "settings-outline",
      title: "Settings",
      subtitle: "Data, about & reset",
    },
  ];

  return (
    <Screen>
      <Text style={styles.eyebrow}>YOUR LIFE OS</Text>
      <Text style={styles.title}>More</Text>
      <Text style={styles.sub}>Every part of the system, one tap away.</Text>

      <View style={{ gap: 10 }}>
        {items.map((it) => (
          <Pressable
            key={it.title}
            style={styles.row}
            onPress={() => router.navigate(it.href)}
          >
            <View style={styles.iconWrap}>
              <Ionicons name={it.icon} size={20} color={theme.ink} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{it.title}</Text>
              <Text style={styles.rowSub}>{it.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.inkFaint} />
          </Pressable>
        ))}
      </View>

      <Text style={styles.footer}>TheLifeOS · v1.0</Text>
    </Screen>
  );
}

function fmtMoney(n: number) {
  const sign = n < 0 ? "−" : "";
  return `${sign}$${Math.abs(n).toLocaleString()}`;
}

const styles = StyleSheet.create({
  eyebrow: { color: theme.inkFaint, fontSize: 11, fontWeight: "700", letterSpacing: 1.5 },
  title: { color: theme.ink, fontSize: 28, fontWeight: "800", marginTop: 4, letterSpacing: -0.5 },
  sub: { color: theme.inkMuted, fontSize: 14, marginTop: 2, marginBottom: 18 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: theme.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 16,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.line,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { color: theme.ink, fontSize: 16, fontWeight: "700" },
  rowSub: { color: theme.inkFaint, fontSize: 12, marginTop: 2 },
  footer: { color: theme.inkFaint, fontSize: 12, textAlign: "center", marginTop: 28 },
});
