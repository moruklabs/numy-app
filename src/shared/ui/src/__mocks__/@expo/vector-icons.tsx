import React from "react";
import { Text } from "react-native";

// Mock Ionicons component for testing
export const Ionicons = ({
  name,
  size,
  color,
  style,
  testID,
}: {
  name: string;
  size: number;
  color: string;
  style?: object;
  testID?: string;
}) => (
  <Text testID={testID} style={style}>
    {`icon-${name}-${size}-${color}`}
  </Text>
);

// Mock glyphMap for type checking
Ionicons.glyphMap = {
  home: 0,
  settings: 0,
  person: 0,
  search: 0,
  close: 0,
  checkmark: 0,
  "chevron-forward": 0,
  "chevron-back": 0,
  "hand-left": 0,
  paw: 0,
  cash: 0,
  leaf: 0,
} as const;
