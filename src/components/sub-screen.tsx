import { ScrollView, View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";

import { theme, radius } from "@/lib/theme";

/** Stack screen wrapper: safe-area scroll + back chevron + eyebrow/title header. */
export function SubScreen({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.obsidian }}
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingHorizontal: 20,
        paddingBottom: 48,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        style={styles.back}
        hitSlop={10}
        onPress={() => (router.canGoBack() ? router.back() : router.navigate("/more"))}
      >
        <Ionicons name="chevron-back" size={20} color={theme.inkMuted} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <View style={{ marginTop: 18 }}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  back: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
    marginLeft: -4,
    marginBottom: 14,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: radius.sm,
  },
  backText: { color: theme.inkMuted, fontSize: 14, fontWeight: "600" },
  eyebrow: { color: theme.inkFaint, fontSize: 11, fontWeight: "700", letterSpacing: 1.5 },
  title: { color: theme.ink, fontSize: 28, fontWeight: "800", marginTop: 4, letterSpacing: -0.5 },
});
