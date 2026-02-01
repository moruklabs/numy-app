import React from "react";
import { StatusBar, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "@moruk/context";

// Default fallback colors when ThemeProvider is not available
const fallbackColors = {
  background: "#FFFFFF",
};

interface WithSafeAreaOptions {
  style?: ViewStyle;
  edges?: ("top" | "bottom" | "left" | "right")[];
  backgroundColor?: string;
}

export const withSafeArea = <P extends object>(
  Component: React.ComponentType<P>,
  options: WithSafeAreaOptions = {}
) => {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => {
    // Use useContext directly to avoid throwing when ThemeProvider is not available
    const themeContext = React.useContext(ThemeContext);
    const colors = themeContext?.theme?.colors || fallbackColors;

    const {
      style = { flex: 1 },
      edges = ["top", "bottom"],
      backgroundColor = colors.background,
    } = options;

    const safeAreaStyle = {
      ...style,
      backgroundColor,
    };

    return (
      <SafeAreaView style={safeAreaStyle} edges={edges}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <Component {...(props as P)} ref={ref} />
      </SafeAreaView>
    );
  });

  WrappedComponent.displayName = `withSafeArea(${Component.displayName || Component.name})`;

  return WrappedComponent;
};
