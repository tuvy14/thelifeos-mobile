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
import Onboarding from "@/components/onboarding";

function Shell() {
  const { c, isDark } = useTheme();
  const { ready, profile } = useStore();
  const showOnboarding = ready && !isOnboarded(profile);
  return (
    <View style={{ flex: 1, backgroundColor: c.obsidian }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      {/* Navigator stays mounted so routing context always exists. */}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.obsidian },
        }}
      />
      {/* First-run focus-area onboarding overlays the app until completed. */}
      {showOnboarding && (
        <View style={StyleSheet.absoluteFill}>
          <Onboarding />
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
              <Shell />
            </SyncProvider>
          </StoreProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
