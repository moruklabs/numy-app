import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useCalculatorStore } from "../../src/application/stores/calculatorStore";
import { CalculatorLine, RunningTotal } from "../../src/presentation/components/calculator";
import { CategoryKey, colors, spacing, TIMING, typography } from "../../src/presentation/theme";

function getCategoryColor(category?: string): string {
  if (!category) return colors.categories.myCalculations.text;
  const key = category as CategoryKey;
  return colors.categories[key]?.text ?? colors.categories.myCalculations.text;
}

export default function CalculatorScreen() {
  const { t } = useTranslation("calculator");
  const { t: tCommon } = useTranslation("common");
  const scrollViewRef = useRef<ScrollView>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");

  const document = useCalculatorStore((state) => state.document);
  const setInput = useCalculatorStore((state) => state.setInput);
  const calculateLine = useCalculatorStore((state) => state.calculateLine);
  const addNewLine = useCalculatorStore((state) => state.addNewLine);
  const removeLine = useCalculatorStore((state) => state.removeLine);
  const getTotal = useCalculatorStore((state) => state.getTotal);
  const showTotal = useCalculatorStore((state) => state.showTotal);
  const updateDocumentTitle = useCalculatorStore((state) => state.updateDocumentTitle);

  const handleInputChange = useCallback(
    (lineId: string, input: string) => {
      setInput(lineId, input);
    },
    [setInput]
  );

  const handleCalculate = useCallback(
    (lineId: string) => {
      calculateLine(lineId);
    },
    [calculateLine]
  );

  const handleSubmit = useCallback(() => {
    addNewLine();
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, TIMING.SCROLL_DELAY_MS);
  }, [addNewLine]);

  const handleDeleteEmpty = useCallback(
    (lineId: string) => {
      // Don't delete if it's the only line
      if (document.lines.length > 1) {
        removeLine(lineId);
      }
    },
    [document.lines.length, removeLine]
  );

  const handleEditTitle = useCallback(() => {
    setTitleInput(document.title);
    setIsEditingTitle(true);
  }, [document.title]);

  const handleSaveTitle = useCallback(() => {
    if (titleInput.trim()) {
      updateDocumentTitle(titleInput.trim());
    }
    setIsEditingTitle(false);
  }, [titleInput, updateDocumentTitle]);

  useEffect(() => {
    const calculateAll = useCalculatorStore.getState().calculateAll;
    calculateAll();
  }, []);

  const total = getTotal();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
      testID="calculator.screen"
    >
      <View style={styles.content}>
        {/* Document Title Row */}
        <Pressable
          style={({ pressed }) => [styles.titleRow, pressed && styles.titleRowPressed]}
          onPress={handleEditTitle}
          testID="calculator.title-button"
          accessibilityLabel={t("document.titleAccessibility", { title: document.title })}
          accessibilityHint={t("document.titleHint")}
          accessibilityRole="button"
        >
          <View style={styles.titleContent}>
            <Text style={styles.documentTitle}>
              <Text style={styles.documentTitlePrefix}># </Text>
              {document.title}
            </Text>
            <Text style={styles.editIcon}>✎</Text>
          </View>
          <Text style={styles.lastUpdated}>
            {t("document.lastUpdated", {
              time: document.updatedAt.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }),
            })}
          </Text>
        </Pressable>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          testID="calculator.lines-scroll"
        >
          {document.lines.map((line, index) => (
            <CalculatorLine
              key={line.id}
              line={line}
              onInputChange={handleInputChange}
              onCalculate={handleCalculate}
              onSubmit={handleSubmit}
              onDeleteEmpty={handleDeleteEmpty}
              autoFocus={index === document.lines.length - 1}
              categoryColor={getCategoryColor(line.category)}
              testID={`calculator.line-${line.id}`}
              suppressErrors={true}
            />
          ))}
          <View style={styles.bottomPadding} />
        </ScrollView>

        {showTotal && <RunningTotal total={total} testID="calculator.running-total" />}
      </View>

      {/* Edit Title Modal */}
      <Modal
        visible={isEditingTitle}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditingTitle(false)}
        accessibilityViewIsModal={true}
      >
        <View
          style={styles.modalOverlay}
          accessible={true}
          accessibilityLabel={t("document.editTitleModal")}
        >
          <View style={styles.modalContent} accessibilityRole="alert">
            <Text style={styles.modalTitle} accessibilityRole="header">
              {t("document.editTitle")}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={titleInput}
              onChangeText={setTitleInput}
              placeholder={t("document.titlePlaceholder")}
              placeholderTextColor={colors.text.muted}
              autoFocus
              selectTextOnFocus
              accessibilityLabel={t("document.titleInputLabel")}
              accessibilityHint={t("document.titleInputHint")}
            />
            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [styles.modalButton, pressed && styles.modalButtonPressed]}
                onPress={() => setIsEditingTitle(false)}
                accessibilityLabel={tCommon("cancel")}
                accessibilityHint={t("document.cancelHint")}
                accessibilityRole="button"
              >
                <Text style={styles.modalButtonText}>{tCommon("cancel")}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalPrimaryButton,
                  pressed && styles.modalButtonPressed,
                ]}
                onPress={handleSaveTitle}
                accessibilityLabel={tCommon("save")}
                accessibilityHint={t("document.saveNewTitleHint")}
                accessibilityRole="button"
              >
                <Text style={[styles.modalButtonText, styles.modalPrimaryButtonText]}>
                  {tCommon("save")}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.border,
    backgroundColor: colors.background.secondary,
  },
  titleRowPressed: {
    opacity: 0.7,
  },
  titleContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  lastUpdated: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
  },
  documentTitle: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.md,
    color: colors.categories.myCalculations.text,
    fontWeight: typography.weights.semibold,
  },
  documentTitlePrefix: {
    color: colors.categories.cssCalculations.accent,
  },
  editIcon: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  bottomPadding: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.lg,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.lg,
  },
  modalInput: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md,
  },
  modalButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  modalButtonPressed: {
    opacity: 0.7,
  },
  modalButtonText: {
    fontFamily: typography.fonts.mono,
    fontSize: typography.sizes.md,
    color: colors.text.muted,
  },
  modalPrimaryButton: {
    backgroundColor: colors.categories.myCalculations.accent,
  },
  modalPrimaryButtonText: {
    color: colors.background.primary,
  },
});
