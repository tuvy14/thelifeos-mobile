import { useCallback, useRef } from "react";
import { Animated, ScrollView, type ScrollViewProps } from "react-native";
import { useFocusEffect } from "expo-router";
import type { ReactNode } from "react";

import { useTheme } from "@/lib/theme";
import { EASE } from "@/components/anim";

export function Screen({
  children,
  scrollProps,
}: {
  children: ReactNode;
  scrollProps?: ScrollViewProps;
}) {
  const { c } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  // Replay the entrance every time the screen gains focus (tab switches too).
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
      contentContainerStyle={{ paddingTop: 16, paddingHorizontal: 20, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      {...scrollProps}
    >
      <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>
    </ScrollView>
  );
}
