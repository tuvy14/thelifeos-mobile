import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { Sora_600SemiBold, Sora_700Bold, Sora_800ExtraBold } from "@expo-google-fonts/sora";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
} from "@expo-google-fonts/jetbrains-mono";

import { StoreProvider, useStore, isOnboarded } from "@/lib/store";
import { SyncProvider } from "@/lib/sync";
import { ThemeProvider, useTheme } from "@/lib/theme";
import { CelebrationProvider } from "@/lib/celebrate";
import Onboarding from "@/components/onboarding";
import OttoChat from "@/components/otto-chat";
import Splash from "@/components/splash";
import { EASE } from "@/components/anim";

function Shell() {
  const { c, isDark } = useTheme();
  const { ready, profile } = useStore();
  const [onboarding, setOnboarding] = useState<boolean | null>(null);
  const [splashGone, setSplashGone] = useState(false);
  const splashOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (ready && !isOnboarded(profile)) setOnboarding(true);
  }, [ready, profile]);

  // Fade the splash out once the store is hydrated, then unmount it.
  useEffect(() => {
    if (ready) {
      Animated.timing(splashOpacity, { toValue: 0, duration: 480, easing: EASE, useNativeDriver: true })
        .start(() => setSplashGone(true));
    }
  }, [ready, splashOpacity]);

  const showOnboarding = onboarding === true;

  return (
    <View style={{ flex: 1, backgroundColor: c.obsidian }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* App content always mounts — the splash overlays it during load */}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.obsidian },
        }}
      />
      {ready && !showOnboarding && <OttoChat />}
      {showOnboarding && (
        <View style={StyleSheet.absoluteFill}>
          <Onboarding onDone={() => setOnboarding(false)} />
        </View>
      )}

      {/* Splash fades out once ready, then unmounts */}
      {!splashGone && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: splashOpacity }]}>
          <Splash />
        </Animated.View>
      )}
    </View>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Sora_600SemiBold,
    Sora_700Bold,
    Sora_800ExtraBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
  });

  // Fonts load in ~100ms — Splash shows while we wait (self-contained, no font deps).
  if (!loaded) return <Splash />;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0a0a0b" }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <StoreProvider>
            <SyncProvider>
              <CelebrationProvider>
                <Shell />
              </CelebrationProvider>
            </SyncProvider>
          </StoreProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
