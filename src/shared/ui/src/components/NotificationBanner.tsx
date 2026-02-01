import React, { useCallback, useEffect, useRef } from "react";
import {
  AccessibilityInfo,
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type NotificationType = "error" | "success" | "info" | "warning";

interface NotificationBannerProps {
  type: NotificationType;
  message: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  onDismiss?: () => void;
  autoHideDuration?: number;
  style?: ViewStyle;
}

const getNotificationConfig = (type: NotificationType) => {
  switch (type) {
    case "error":
      return {
        backgroundColor: "rgba(255, 71, 87, 0.95)",
        borderColor: "rgba(255, 71, 87, 0.2)",
        icon: "alert-circle" as const,
        shadowColor: "#FF4757",
      };
    case "success":
      return {
        backgroundColor: "rgba(46, 213, 115, 0.95)",
        borderColor: "rgba(46, 213, 115, 0.2)",
        icon: "checkmark-circle" as const,
        shadowColor: "#2ED573",
      };
    case "warning":
      return {
        backgroundColor: "rgba(255, 168, 38, 0.95)",
        borderColor: "rgba(255, 168, 38, 0.2)",
        icon: "warning" as const,
        shadowColor: "#FFA826",
      };
    case "info":
    default:
      return {
        backgroundColor: "rgba(48, 129, 237, 0.95)",
        borderColor: "rgba(48, 129, 237, 0.2)",
        icon: "information-circle" as const,
        shadowColor: "#3081ED",
      };
  }
};

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  type,
  message,
  action,
  onDismiss,
  autoHideDuration = 4000,
  style,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const config = getNotificationConfig(type);

  const handleDismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss) {
        onDismiss();
      }
    });
  }, [translateY, opacity, onDismiss]);

  useEffect(() => {
    // Show animation
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Announce notification to screen readers
    const notificationType =
      type === "error"
        ? "Error"
        : type === "success"
          ? "Success"
          : type === "warning"
            ? "Warning"
            : "Information";
    AccessibilityInfo.announceForAccessibility(`${notificationType} notification: ${message}`);

    // Auto hide after duration
    if (autoHideDuration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [autoHideDuration, handleDismiss, message, opacity, translateY, type]);

  const handleActionPress = () => {
    if (action) {
      AccessibilityInfo.announceForAccessibility(`Executing action: ${action.label}`);
      action.onPress();
    }
  };

  const getAccessibilityLabel = () => {
    const typeLabel =
      type === "error"
        ? "Error"
        : type === "success"
          ? "Success"
          : type === "warning"
            ? "Warning"
            : "Information";
    return `${typeLabel} notification: ${message}`;
  };

  const styles = StyleSheet.create({
    container: {
      position: "absolute",
      top: Platform.OS === "ios" ? 50 : 20,
      left: 20,
      right: 20,
      zIndex: 1000,
      backgroundColor: config.backgroundColor,
      borderRadius: 12,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      shadowColor: config.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: Platform.OS === "ios" ? 0.5 : 0,
      borderColor: config.borderColor,
      maxWidth: 500,
      alignSelf: "center",
    },
    content: {
      flex: 1,
      marginLeft: 12,
      marginRight: action ? 0 : 12,
    },
    message: {
      color: "#FFFFFF",
      fontSize: 14,
      fontFamily: "Montserrat-Medium",
      lineHeight: 20,
    },
    actionButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      marginLeft: 12,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.2)",
    },
    actionText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontFamily: "Montserrat-SemiBold",
    },
    dismissButton: {
      padding: 4,
      marginLeft: 8,
    },
  });

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
      accessible={true}
      accessibilityLabel={getAccessibilityLabel()}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Ionicons
        name={config.icon}
        size={22}
        color="#FFFFFF"
        accessible={true}
        accessibilityLabel={`${type} icon`}
      />
      <View style={styles.content} accessible={true} accessibilityLabel={message}>
        <Text style={styles.message}>{message}</Text>
      </View>
      {action && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleActionPress}
          activeOpacity={0.8}
          accessible={true}
          accessibilityLabel={`Action: ${action.label}`}
          accessibilityHint="Double tap to execute this action"
          accessibilityRole="button"
        >
          <Text style={styles.actionText}>{action.label}</Text>
        </TouchableOpacity>
      )}
      {onDismiss && (
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={handleDismiss}
          activeOpacity={0.8}
          accessible={true}
          accessibilityLabel="Dismiss notification"
          accessibilityHint="Double tap to dismiss this notification"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};
