import { useCallback, useRef } from "react";
import { Animated, ScrollView, View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";

import { useTheme, radius, fonts } from "@/lib/theme";
import { Eyebrow } from "@/components/ui";
import { PressableScale, EASE } from "@/components/anim";

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
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useFocusEffect(
    useCallback(() => {
      opacity.setValue(0);
      translateY.setValue(12);
      const anim = Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 420, easing: EASE, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 480, easing: EASE, useNativeDriver: true }),
      ]);
      anim.start();
      return () => anim.stop();
    }, [opacity, translateY])
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "transparent" }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 56 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        <PressableScale
          style={styles.back}
          hitSlop={10}
          scaleTo={0.92}
          onPress={() => (router.canGoBack() ? router.back() : router.navigate("/(tabs)/more"))}
        >
          <Ionicons name="chevron-back" size={20} color={c.inkMuted} />
          <Text style={[styles.backText, { color: c.inkMuted }]}>Back</Text>
        </PressableScale>
        <Eyebrow>{eyebrow}</Eyebrow>
        <Text style={[styles.title, { color: c.ink }]}>{title}</Text>
        <View style={{ marginTop: 18 }}>{children}</View>
      </Animated.View>
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
