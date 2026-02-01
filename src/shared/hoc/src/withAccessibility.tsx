import React from "react";
import { AccessibilityProps } from "react-native";

interface WithAccessibilityOptions {
  label?: string;
  hint?: string;
  role?: "button" | "text" | "header" | "link" | "image" | "none" | "alert";
  traits?: string[];
  announceOnMount?: boolean;
  announceMessage?: string;
}

export const withAccessibility = <P extends object>(
  Component: React.ComponentType<P>,
  options: WithAccessibilityOptions = {}
) => {
  const WrappedComponent = React.forwardRef<any, P & AccessibilityProps>((props, ref) => {
    const {
      label,
      hint,
      role = "button",
      announceOnMount = false,
      announceMessage,
      ...accessibilityOptions
    } = options;

    // Merge HOC accessibility props with component props
    const mergedProps = {
      ...props,
      accessible: props.accessible ?? true,
      accessibilityLabel: props.accessibilityLabel || label,
      accessibilityHint: props.accessibilityHint || hint,
      accessibilityRole: props.accessibilityRole || role,
      ...accessibilityOptions,
    };

    // Handle announcements on mount
    React.useEffect(() => {
      if (announceOnMount && announceMessage) {
        // Announce message after a small delay to ensure screen reader is ready
        const timer = setTimeout(() => {
          // AccessibilityInfo.announceForAccessibility(announceMessage);
        }, 500);

        return () => clearTimeout(timer);
      }
    }, [announceOnMount, announceMessage]);

    return <Component {...(mergedProps as P)} ref={ref} />;
  });

  WrappedComponent.displayName = `withAccessibility(${Component.displayName || Component.name})`;

  return WrappedComponent;
};
