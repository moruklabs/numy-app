import React from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../ui";
import type { IdentifierFollowUpQuestion } from "./IdentifierQuestionsStep";

export interface IdentifierSummaryLabels {
  purpose: string;
  photos: string;
  audio?: string;
  questions: string;
  noGoal: string;
  noQuestions: string;
  audioPresent?: string;
  audioAbsent?: string;
}

export interface IdentifierSummaryStepProps {
  title: string;
  subtitle: string;

  goalTitle?: string | null;

  imageCount: number;
  hasAudio?: boolean;

  questions: IdentifierFollowUpQuestion[];
  selectedIds: string[];

  labels?: IdentifierSummaryLabels;
}

const DEFAULT_LABELS: IdentifierSummaryLabels = {
  purpose: "Purpose",
  photos: "Photos",
  audio: "Audio",
  questions: "Follow-up questions",
  noGoal: "No specific goal selected",
  noQuestions: "No additional questions selected.",
  audioPresent: "Audio attached",
  audioAbsent: "No audio attached (optional)",
};

export const IdentifierSummaryStep: React.FC<IdentifierSummaryStepProps> = ({
  title,
  subtitle,
  goalTitle,
  imageCount,
  hasAudio,
  questions,
  selectedIds,
  labels = DEFAULT_LABELS,
}) => {
  const styles = StyleSheet.create({
    container: {
      width: "100%",
      maxWidth: 420,
      alignSelf: "center",
      paddingHorizontal: 20,
      paddingTop: 10,
    },
    title: {
      textAlign: "center",
      marginBottom: 8,
    },
    subtitle: {
      textAlign: "center",
      opacity: 0.7,
      marginBottom: 24,
    },
    card: {
      backgroundColor: "#F8FAFC",
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: "#E2E8F0",
      gap: 12,
    },
    sectionTitle: {
      fontWeight: "600",
      marginBottom: 4,
    },
    bulletList: {
      marginTop: 4,
      marginLeft: 8,
      gap: 4,
    },
  });

  const selectedQuestions = questions.filter((q) => selectedIds.includes(q.id));

  return (
    <View style={styles.container}>
      <ThemedText variant="h2" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText variant="body" style={styles.subtitle}>
        {subtitle}
      </ThemedText>

      <View style={styles.card}>
        <View>
          <ThemedText variant="body" style={styles.sectionTitle}>
            {labels.purpose}
          </ThemedText>
          <ThemedText variant="body">{goalTitle || labels.noGoal}</ThemedText>
        </View>

        <View>
          <ThemedText variant="body" style={styles.sectionTitle}>
            {labels.photos}
          </ThemedText>
          <ThemedText variant="body">{imageCount} photo(s) selected</ThemedText>
        </View>

        {labels.audio && typeof hasAudio === "boolean" && (
          <View>
            <ThemedText variant="body" style={styles.sectionTitle}>
              {labels.audio}
            </ThemedText>
            <ThemedText variant="body">
              {hasAudio
                ? (labels.audioPresent ?? DEFAULT_LABELS.audioPresent)
                : (labels.audioAbsent ?? DEFAULT_LABELS.audioAbsent)}
            </ThemedText>
          </View>
        )}

        <View>
          <ThemedText variant="body" style={styles.sectionTitle}>
            {labels.questions}
          </ThemedText>
          {selectedQuestions.length === 0 ? (
            <ThemedText variant="body">{labels.noQuestions}</ThemedText>
          ) : (
            <View style={styles.bulletList}>
              {selectedQuestions.map((q) => (
                <ThemedText key={q.id} variant="body">
                  • {q.title}
                </ThemedText>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};
