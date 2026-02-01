import React from "react";
import { View, Text, StyleSheet } from "react-native";

export const DeveloperBadge: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>DEV</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ff3b30",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  text: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
