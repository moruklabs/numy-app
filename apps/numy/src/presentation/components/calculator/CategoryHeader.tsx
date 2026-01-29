import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, typography, spacing } from "../../theme";
import { CategoryKey } from "../../theme/colors";

interface CategoryHeaderProps {
  title: string;
  category: CategoryKey;
  prefix?: string;
  testID?: string;
}

export function CategoryHeader({ title, category, prefix = "#", testID }: CategoryHeaderProps) {
  const categoryStyle = colors.categories[category];

  return (
    <View
      style={[styles.container, { borderLeftColor: categoryStyle.border }]}
      testID={testID}
      accessible={true}
      accessibilityRole="header"
    >
      <Text style={[styles.title, { color: categoryStyle.text }]}>
        {prefix} {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderLeftWidth: 3,
    marginVertical: spacing.sm,
  },
  title: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
