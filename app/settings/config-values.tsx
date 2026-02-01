import React from "react";
import { ScrollView, StyleSheet, Text, View, Platform } from "react-native";
import { colors, spacing, typography } from "@/presentation/theme";
import settings from "@/config/settings";

export default function ConfigValuesScreen() {
  return (
    <ScrollView style={styles.container} testID="config-values.screen">
      <Text style={styles.title}>Configuration Values</Text>
      <Text style={styles.subtitle}>Current app configuration from settings.ts</Text>

      {/* App Metadata */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Metadata</Text>

        <ConfigRow label="App Name" value={settings.name} />
        <ConfigRow label="Bundle ID" value={settings.bundleId} />
        <ConfigRow label="Version" value={settings.version} />
        <ConfigRow label="Scheme" value={settings.scheme} />
        <ConfigRow label="Platform" value={Platform.OS} />
      </View>

      {/* Feature Flags */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Feature Flags</Text>

        <ConfigRow label="Dark Mode" value={settings.features.darkMode ? "Enabled" : "Disabled"} />
        <ConfigRow label="Ads" value={settings.features.ads ? "Enabled" : "Disabled"} />
        <ConfigRow label="Analytics" value={settings.features.analytics ? "Enabled" : "Disabled"} />
        <ConfigRow
          label="Crashlytics"
          value={settings.features.crashlytics ? "Enabled" : "Disabled"}
        />
        <ConfigRow label="Sentry" value={settings.features.sentry ? "Enabled" : "Disabled"} />
      </View>

      {/* AdMob Configuration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AdMob Configuration</Text>

        <ConfigRow label="iOS App ID" value={settings.ads.iosAppId} monospace />
        <ConfigRow label="Android App ID" value={settings.ads.androidAppId} monospace />

        <Text style={styles.subsectionTitle}>iOS Unit IDs</Text>
        <ConfigRow
          label="App Open"
          value={settings.ads.units.ios.appOpen || "Not configured"}
          monospace
        />
        <ConfigRow
          label="Interstitial"
          value={settings.ads.units.ios.interstitial || "Not configured"}
          monospace
        />

        <Text style={styles.subsectionTitle}>Ad Frequency</Text>
        <ConfigRow
          label="App Open Frequency"
          value={`${settings.ads.defaults.appOpen.frequency} per ${settings.ads.defaults.appOpen.interval} ${settings.ads.defaults.appOpen.intervalUnit}`}
        />
        <ConfigRow
          label="Interstitial Frequency"
          value={`${settings.ads.defaults.interstitial.frequency} per ${settings.ads.defaults.interstitial.interval} ${settings.ads.defaults.interstitial.intervalUnit}`}
        />
      </View>

      {/* Support & Links */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support & Links</Text>

        <ConfigRow label="Privacy Policy" value={settings.links.privacyPolicy} monospace />
        <ConfigRow label="Terms of Service" value={settings.links.termsOfService} monospace />
        <ConfigRow label="Support" value={settings.links.support} monospace />
        <ConfigRow label="Review" value={settings.links.review} monospace />
      </View>

      {/* Sentry */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sentry</Text>
        <ConfigRow label="DSN" value={settings.sentry.dsn} monospace />
      </View>
    </ScrollView>
  );
}

interface ConfigRowProps {
  label: string;
  value: string;
  monospace?: boolean;
}

function ConfigRow({ label, value, monospace = false }: ConfigRowProps) {
  return (
    <View style={styles.configRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, monospace && styles.mono]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    padding: spacing.lg,
  },
  title: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.xl,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.border,
  },
  sectionTitle: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.lg,
    color: colors.categories.cssCalculations.text,
    marginBottom: spacing.md,
    fontWeight: typography.weights.semibold,
  },
  subsectionTitle: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontWeight: typography.weights.medium,
  },
  configRow: {
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  value: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  mono: {
    fontSize: typography.sizes.sm,
    color: colors.result.primary,
  },
});
