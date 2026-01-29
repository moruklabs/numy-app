import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "../ui";

export interface IdentifierFollowUpQuestion {
  id: string;
  title: string;
  description: string;
  icon: string; // Ionicons name
}

export interface IdentifierQuestionsStepProps {
  title: string;
  subtitle: string;
  questions: IdentifierFollowUpQuestion[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export const IdentifierQuestionsStep: React.FC<IdentifierQuestionsStepProps> = ({
  title,
  subtitle,
  questions,
  selectedIds,
  onToggle,
}) => {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 10,
      width: "100%",
      maxWidth: 420,
      alignSelf: "center",
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
    grid: {
      gap: 16,
      paddingBottom: 20,
    },
    card: {
      backgroundColor: "#F8FAFC",
      borderRadius: 16,
      padding: 16,
      borderWidth: 2,
      borderColor: "transparent",
      flexDirection: "row",
      alignItems: "flex-start",
    },
    selectedCard: {
      backgroundColor: "#2563EB",
      borderColor: "#1D4ED8",
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#E0F2FE",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
      marginTop: 2,
    },
    selectedIconContainer: {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
    },
    textContainer: {
      flex: 1,
    },
    cardTitle: {
      marginBottom: 4,
    },
    cardDescription: {
      opacity: 0.8,
      fontSize: 14,
    },
    selectedText: {
      color: "#FFFFFF",
    },
  });

  return (
    <View style={styles.container}>
      <ThemedText variant="h2" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText variant="body" style={styles.subtitle}>
        {subtitle}
      </ThemedText>

      <ScrollView contentContainerStyle={styles.grid}>
        {questions.map((question) => {
          const isSelected = selectedIds.includes(question.id);

          return (
            <TouchableOpacity
              key={question.id}
              style={[styles.card, isSelected && styles.selectedCard]}
              onPress={() => onToggle(question.id)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <View style={[styles.iconContainer, isSelected && styles.selectedIconContainer]}>
                <Ionicons
                  name={question.icon as any}
                  size={22}
                  color={isSelected ? "#FFFFFF" : "#0369A1"}
                />
              </View>

              <View style={styles.textContainer}>
                <ThemedText
                  variant="h3"
                  style={[styles.cardTitle, isSelected && styles.selectedText]}
                >
                  {question.title}
                </ThemedText>
                <ThemedText
                  variant="body"
                  style={[styles.cardDescription, isSelected && styles.selectedText]}
                >
                  {question.description}
                </ThemedText>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};
