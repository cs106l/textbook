/**
 * Contains the schema for inline markdown quizzes.
 */

import { z } from "zod";
import { serializeMDX } from "../mdx";

export enum QuestionType {
  MultipleChoice = "multiple-choice",
  ShortAnswer = "short-answer",
}

const MarkdownSchema = z.string().transform(serializeMDX);

const QuestionBaseSchema = z.object({
  prompt: MarkdownSchema,
  context: MarkdownSchema.optional(),
});

const MultipleChoiceResponses = z.record(MarkdownSchema);
const MultipleChoiceSchema = z.object({
  type: z.literal(QuestionType.MultipleChoice),
  answers: MultipleChoiceResponses,
  distractors: MultipleChoiceResponses,
});

const QuestionSchema = z
  .discriminatedUnion("type", [MultipleChoiceSchema])
  .and(QuestionBaseSchema);

export const QuizSchema = z
  .object({
    quiz: z.string(),
    questions: z.record(QuestionSchema),
  })
  .transform(({ questions, ...rest }) => ({
    ...rest,
    questions: Object.entries(questions)
      .sort(([k1], [k2]) => k1.localeCompare(k2))
      .map(([key, question]) => ({
        key,
        question,
      })),
  }));

export type Question = z.infer<typeof QuestionSchema>;
export type TypedQuestion<T extends QuestionType> = Extract<
  Question,
  { type: T }
>;
export type Quiz = z.infer<typeof QuizSchema>;

export const MultipleChoiceAnswerSchema = z.object({
  type: z.literal(QuestionType.MultipleChoice),
  keys: z.string().array().min(1),
});

const AnswerSchema = z.discriminatedUnion("type", [MultipleChoiceAnswerSchema]);

export type TypedAnswer<T extends QuestionType> = Extract<Answer, { type: T }>;
export type Answer = z.infer<typeof AnswerSchema>;

const QuizAnswers = z.object({
  gaveUp: z.boolean().optional(),
  answers: z.record(AnswerSchema),
});

export type QuizAnswers = z.infer<typeof QuizAnswers>;
