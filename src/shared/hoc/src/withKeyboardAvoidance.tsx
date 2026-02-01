import React from "react";
import { KeyboardAvoidingView, Platform, ViewStyle } from "react-native";

interface WithKeyboardAvoidanceOptions {
  behavior?: "height" | "position" | "padding";
  keyboardVerticalOffset?: number;
  style?: ViewStyle;
  enabled?: boolean;
}

export const withKeyboardAvoidance = <P extends object>(
  Component: React.ComponentType<P>,
  options: WithKeyboardAvoidanceOptions = {}
) => {
  const {
    behavior = Platform.OS === "ios" ? "padding" : "height",
    keyboardVerticalOffset = Platform.OS === "ios" ? 0 : 20,
    style = { flex: 1 },
    enabled = true,
  } = options;

  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <KeyboardAvoidingView
      style={style}
      behavior={behavior}
      keyboardVerticalOffset={keyboardVerticalOffset}
      enabled={enabled}
    >
      <Component {...(props as P)} ref={ref} />
    </KeyboardAvoidingView>
  ));

  WrappedComponent.displayName = `withKeyboardAvoidance(${Component.displayName || Component.name})`;

  return WrappedComponent;
};
