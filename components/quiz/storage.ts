import React, { useEffect } from "react";
import { QuizAnswersSchema, type Quiz, type QuizAnswers } from "./schema";
import { z } from "zod";

const StoredAnswersSchema = QuizAnswersSchema.extend({
  quizHash: z.string(),
});

type StoredAnswers = z.infer<typeof StoredAnswersSchema>;

export default function useStoredAnswers(
  quiz: Quiz
): [QuizAnswers | null, (answers: QuizAnswers) => void] {
  const key = `quiz:${quiz.page}#${quiz.quiz}`;
  const [answers, setAnswers] = React.useState<QuizAnswers | null>(null);

  /* Load answers from local storage on mount */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return;
      const result = StoredAnswersSchema.parse(JSON.parse(stored));
      if (result.quizHash !== quiz.hash) return;
      setAnswers(result);
    } catch (e) {
      console.log(`Failed to load quiz answers from cache (${key}):`, e);
    }
  }, [key, quiz]);

  const setAndStore = React.useCallback(
    (answers: QuizAnswers) => {
      setAnswers(answers);
      const stored: StoredAnswers = { ...answers, quizHash: quiz.hash };
      localStorage.setItem(key, JSON.stringify(stored));
    },
    [key, quiz]
  );

  return [answers, setAndStore];
}
