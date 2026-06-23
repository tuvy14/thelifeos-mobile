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

import { StoreProvider, useStore, isOnboarded, entitled } from "@/lib/store";
import { SyncProvider } from "@/lib/sync";
import { ThemeProvider, useTheme } from "@/lib/theme";
import { CelebrationProvider } from "@/lib/celebrate";
import Onboarding from "@/components/onboarding";
import OttoChat from "@/components/otto-chat";
import Paywall from "@/components/paywall";
import WelcomeCurtain from "@/components/welcome-curtain";
import Splash from "@/components/splash";
import { EASE } from "@/components/anim";

function Shell() {
  const { c, isDark } = useTheme();
  const { ready, profile } = useStore();
  const [onboarding, setOnboarding] = useState<boolean | null>(null);
  const [splashGone, setSplashGone] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const prevEntitled = useRef<boolean | null>(null);

  useEffect(() => {
    if (ready && !isOnboarded(profile)) setOnboarding(true);
  }, [ready, profile]);

  // Play the welcome curtain the first time the user transitions into "entitled"
  // (started a trial / bought) within this session — not on every cold launch.
  useEffect(() => {
    if (!ready) return;
    const e = entitled(profile);
    if (prevEntitled.current === null) { prevEntitled.current = e; return; }
    if (e && !prevEntitled.current) setShowWelcome(true);
    prevEntitled.current = e;
  }, [ready, profile]);

  // Fade the splash out once the store is hydrated, then unmount it.
  useEffect(() => {
    if (ready) {
      Animated.timing(splashOpacity, { toValue: 0, duration: 480, easing: EASE, useNativeDriver: true })
        .start(() => setSplashGone(true));
    }
  }, [ready, splashOpacity]);

  const showOnboarding = onboarding === true;
  // Nothing is free: once onboarded, you must start a trial or buy to enter.
  const showPaywall = ready && !showOnboarding && isOnboarded(profile) && !entitled(profile);

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
      {ready && !showOnboarding && !showPaywall && <OttoChat />}
      {showOnboarding && (
        <View style={StyleSheet.absoluteFill}>
          <Onboarding onDone={() => setOnboarding(false)} />
        </View>
      )}

      {/* Paywall gate — after the quiz, before the app */}
      {showPaywall && (
        <View style={StyleSheet.absoluteFill}>
          <Paywall />
        </View>
      )}

      {/* Welcome entrance — overlays the app, then fades to reveal it */}
      {showWelcome && (
        <View style={StyleSheet.absoluteFill}>
          <WelcomeCurtain name={profile?.name} onDone={() => setShowWelcome(false)} />
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
