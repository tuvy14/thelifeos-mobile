import { Tabs } from "expo-router";

import { useTheme } from "@/lib/theme";
import TopBar from "@/components/top-bar";
import LimelightDock from "@/components/limelight-dock";

export default function TabsLayout() {
  const { c } = useTheme();
  return (
    <Tabs
      tabBar={(props) => <LimelightDock {...props} />}
      screenOptions={{
        headerShown: true,
        header: () => <TopBar />,
        sceneStyle: { backgroundColor: c.obsidian },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Today" }} />
      <Tabs.Screen name="check-in" options={{ title: "Check-in" }} />
      <Tabs.Screen name="wins" options={{ title: "Wins" }} />
      <Tabs.Screen name="insights" options={{ title: "Insights" }} />
      <Tabs.Screen name="more" options={{ title: "More" }} />
    </Tabs>
  );
}
