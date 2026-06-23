import { useCallback, useRef, useState } from "react";
import { Animated, ScrollView, View, type ScrollViewProps } from "react-native";
import { useFocusEffect } from "expo-router";
import type { ReactNode } from "react";

import { useTheme } from "@/lib/theme";
import { EASE } from "@/components/anim";
import ShaderBackdrop from "@/components/shader-backdrop";

export function Screen({
  children,
  scrollProps,
}: {
  children: ReactNode;
  scrollProps?: ScrollViewProps;
}) {
  const { c } = useTheme();
  const [focused, setFocused] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      opacity.setValue(0);
      translateY.setValue(12);
      const anim = Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 420, easing: EASE, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 480, easing: EASE, useNativeDriver: true }),
      ]);
      anim.start();
      return () => {
        anim.stop();
        setFocused(false);
      };
    }, [opacity, translateY])
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.obsidian }}>
      {/* Shader/atmosphere behind THIS screen only — mounted while focused. */}
      {focused && <ShaderBackdrop />}
      <ScrollView
        style={{ flex: 1, backgroundColor: "transparent" }}
        contentContainerStyle={{ paddingTop: 16, paddingHorizontal: 20, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        {...scrollProps}
      >
        <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>
      </ScrollView>
    </View>
  );
}
