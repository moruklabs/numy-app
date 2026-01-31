import { FlashList } from "@shopify/flash-list";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Reanimated, { SharedValue, useAnimatedStyle } from "react-native-reanimated";
import { useCalculatorStore } from "../../../../application/stores/calculatorStore";
import { Document } from "../../../../domain/entities/Document";
import { colors, spacing, typography } from "../../../../presentation/theme";

function RightActions({
  drag,
  onDelete,
  documentTitle,
  deleteLabel,
}: {
  drag: SharedValue<number>;
  onDelete: () => void;
  documentTitle: string;
  deleteLabel: string;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drag.value + 80 }],
  }));

  return (
    <Reanimated.View style={[styles.deleteAction, animatedStyle]}>
      <Pressable
        style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]}
        onPress={onDelete}
        accessibilityLabel={`${deleteLabel} ${documentTitle}`}
        accessibilityHint="Double tap to delete this document"
        accessibilityRole="button"
      >
        <Text style={styles.deleteButtonText}>{deleteLabel}</Text>
      </Pressable>
    </Reanimated.View>
  );
}

export function HistoryList() {
  const { t, i18n } = useTranslation("history");
  const { t: tCommon } = useTranslation("common");
  const router = useRouter();
  const savedDocuments = useCalculatorStore((state) => state.savedDocuments);

  // Sort by last modified (most recent first)
  const sortedDocuments = [...savedDocuments].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  );
  const loadDocument = useCalculatorStore((state) => state.loadDocument);
  const deleteDocument = useCalculatorStore((state) => state.deleteDocument);

  // Track which swipeable is currently open to prevent navigation during swipe
  const [openSwipeableId, setOpenSwipeableId] = React.useState<string | null>(null);

  const handleLoadDocument = (docId: string) => {
    // Don't navigate if a swipeable is currently open
    if (openSwipeableId !== null) {
      return;
    }
    loadDocument(docId);
    router.replace("/");
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString(i18n.language, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(i18n.language, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleSwipeOpen = useCallback(async (docId: string) => {
    setOpenSwipeableId(docId);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleSwipeClose = useCallback(() => {
    setOpenSwipeableId(null);
  }, []);

  const handleDelete = useCallback(
    (docId: string, docTitle: string) => {
      Alert.alert(t("deleteAlert.title"), t("deleteAlert.message", { title: docTitle }), [
        {
          text: tCommon("cancel"),
          style: "cancel",
          onPress: () => {
            // Close the swipeable when user cancels
            setOpenSwipeableId(null);
          },
        },
        {
          text: tCommon("delete"),
          style: "destructive",
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            deleteDocument(docId);
            // Close the swipeable after delete
            setOpenSwipeableId(null);
          },
        },
      ]);
    },
    [deleteDocument, t, tCommon]
  );

  const renderItem = useCallback(
    ({ item }: { item: Document }) => (
      <ReanimatedSwipeable
        friction={2}
        rightThreshold={40}
        overshootFriction={8}
        onSwipeableOpen={() => handleSwipeOpen(item.id)}
        onSwipeableClose={handleSwipeClose}
        renderRightActions={(progress, drag) => (
          <RightActions
            drag={drag}
            onDelete={() => handleDelete(item.id, item.title)}
            documentTitle={item.title}
            deleteLabel={tCommon("delete")}
          />
        )}
      >
        <Pressable
          style={({ pressed }) => [styles.documentItem, pressed && styles.documentItemPressed]}
          onPress={() => handleLoadDocument(item.id)}
          testID={`history.document-${item.id}`}
          accessibilityLabel={t("documentAccessibility", {
            title: item.title,
            date: formatDate(item.updatedAt),
            count: item.lines.length,
          })}
          accessibilityHint={t("documentHint")}
          accessibilityRole="button"
          accessibilityActions={[
            { name: "activate", label: t("openAction") },
            { name: "delete", label: t("deleteAction") },
          ]}
          onAccessibilityAction={(event) => {
            switch (event.nativeEvent.actionName) {
              case "activate":
                handleLoadDocument(item.id);
                break;
              case "delete":
                handleDelete(item.id, item.title);
                break;
            }
          }}
        >
          <View style={styles.documentHeader}>
            <Text style={styles.documentTitle} testID={`history.document-${item.id}.title`}>
              # {item.title}
            </Text>
            <Text style={styles.documentDate} testID={`history.document-${item.id}.date`}>
              {t("lastEdited")} {formatTime(item.updatedAt)}
            </Text>
          </View>
          <Text style={styles.documentLines} testID={`history.document-${item.id}.lines`}>
            {t("lineCount", { count: item.lines.length })}
          </Text>
        </Pressable>
      </ReanimatedSwipeable>
    ),
    [handleDelete, handleLoadDocument, handleSwipeOpen, handleSwipeClose, t, i18n.language]
  );

  if (sortedDocuments.length === 0) {
    return (
      <View
        style={styles.emptyContainer}
        testID="history.empty-state"
        accessible={true}
        accessibilityLabel={`${t("emptyState.title")}. ${t("emptyState.subtitle")}`}
        accessibilityRole="text"
      >
        <Text style={styles.emptyText} testID="history.empty-text">
          {t("emptyState.title")}
        </Text>
        <Text style={styles.emptySubtext} testID="history.empty-subtext">
          {t("emptyState.subtitle")}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="history-list">
      <FlashList
        data={sortedDocuments}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        testID="history.document-list"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  listContent: {
    padding: spacing.lg,
  },
  documentItem: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.categories.myCalculations.accent,
  },
  documentItemPressed: {
    opacity: 0.7,
  },
  documentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  documentTitle: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    fontWeight: typography.weights.semibold,
    flex: 1,
  },
  documentDate: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
  },
  documentLines: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  deleteAction: {
    width: 80,
    marginBottom: spacing.md,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: colors.result.error,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  deleteButtonPressed: {
    opacity: 0.7,
  },
  deleteButtonText: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.sm,
    color: "#FFFFFF",
    fontWeight: typography.weights.semibold,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xxl,
  },
  emptyText: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.lg,
    color: colors.text.secondary,
    textAlign: "center",
  },
  emptySubtext: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    marginTop: spacing.md,
    textAlign: "center",
  },
});
