export interface ContextQuestionLike {
  id: string;
  title: string;
}

interface BuildAnalysisContextOptions {
  goalPrefix?: string;
  questionsHeader?: string;
}

/**
 * Build a human-readable analysis context string from goal and selected questions.
 * This is passed to AI backends as additional instruction/context.
 */
export function buildAnalysisContext<T extends ContextQuestionLike>(
  goalTitle: string | null | undefined,
  questions: T[],
  selectedIds: string[],
  options?: BuildAnalysisContextOptions
): string | undefined {
  const parts: string[] = [];

  if (goalTitle && goalTitle.trim().length > 0) {
    parts.push(`${options?.goalPrefix ?? "Goal"}: ${goalTitle.trim()}`);
  }

  const selectedQuestions = questions.filter((q) => selectedIds.includes(q.id));

  if (selectedQuestions.length > 0) {
    const header = options?.questionsHeader ?? "User questions/concerns:";
    parts.push(`${header}\n` + selectedQuestions.map((q) => `- ${q.title}`).join("\n"));
  }

  if (parts.length === 0) {
    return undefined;
  }

  return parts.join("\n\n");
}
