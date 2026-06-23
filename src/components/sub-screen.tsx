import { ScrollView, View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";

import { useTheme, radius, fonts } from "@/lib/theme";
import { Eyebrow } from "@/components/ui";

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
  const { c } = useTheme();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.obsidian }}
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingHorizontal: 20,
        paddingBottom: 56,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        style={styles.back}
        hitSlop={10}
        onPress={() => (router.canGoBack() ? router.back() : router.navigate("/(tabs)/more"))}
      >
        <Ionicons name="chevron-back" size={20} color={c.inkMuted} />
        <Text style={[styles.backText, { color: c.inkMuted }]}>Back</Text>
      </Pressable>
      <Eyebrow>{eyebrow}</Eyebrow>
      <Text style={[styles.title, { color: c.ink }]}>{title}</Text>
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
  backText: { fontFamily: fonts.bodySemibold, fontSize: 14 },
  title: { fontFamily: fonts.displayBold, fontSize: 28, marginTop: 8, letterSpacing: -0.5 },
});
