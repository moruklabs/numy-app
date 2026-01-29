// Initialize i18n first, before any other imports that might use translations
import "../src/i18n";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { colors, typography } from "../src/presentation/theme";
import { useAnalytics } from "../src/application/hooks";

export default function RootLayout() {
  // Initialize analytics and track screen views
  useAnalytics();

  return (
    <View style={styles.container} testID="app.root">
      <StatusBar style="light" />
      <GestureHandlerRootView style={styles.gestureRoot}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.background.primary,
            },
            headerTintColor: colors.text.primary,
            headerTitleStyle: {
              fontFamily: typography.fonts.mono,
              fontWeight: "600",
            },
            contentStyle: {
              backgroundColor: colors.background.primary,
            },
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
              headerBackVisible: false,
            }}
          />
        </Stack>
      </GestureHandlerRootView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  gestureRoot: {
    flex: 1,
  },
});
