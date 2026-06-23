import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, StyleSheet } from "react-native";
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
import Backdrop from "@/components/backdrop";

function Shell() {
  const { c, isDark } = useTheme();
  const { ready, profile } = useStore();
  // Capture the onboarding decision once hydration finishes, so completing the
  // flow (which sets profile) doesn't dismiss the overlay before "ready".
  const [onboarding, setOnboarding] = useState<boolean | null>(null);
  useEffect(() => {
    // Show whenever there's no profile (first run OR "redo onboarding"). Completing
    // the flow sets the profile but we keep the overlay until onDone fires.
    if (ready && !isOnboarded(profile)) setOnboarding(true);
  }, [ready, profile]);
  const showOnboarding = onboarding === true;
  return (
    <View style={{ flex: 1, backgroundColor: c.obsidian }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      {/* Ambient dot-field + glow behind the (transparent) screens. */}
      <Backdrop />
      {/* Navigator stays mounted so routing context always exists. */}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      {/* Otto coach FAB — hidden during onboarding. */}
      {ready && !showOnboarding && <OttoChat />}
      {/* First-run focus-area onboarding overlays the app until completed. */}
      {showOnboarding && (
        <View style={StyleSheet.absoluteFill}>
          <Onboarding onDone={() => setOnboarding(false)} />
        </View>
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

  if (!loaded) return <View style={{ flex: 1, backgroundColor: "#0a0a0b" }} />;

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
