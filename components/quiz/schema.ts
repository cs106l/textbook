/**
 * Contains the schema for inline markdown quizzes.
 */

import { z } from "zod";
import { serializeMDX } from "../mdx";

export enum QuestionType {
  MultipleChoice = "multiple-choice",
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

export const QuizSchema = z.object({
  quiz: z.string(),
  questions: z.record(QuestionSchema),
});

export type MultipleChoiceQuestion = Quiz & {
  type: QuestionType.MultipleChoice;
};
export type Question = z.infer<typeof QuestionSchema>;
export type Quiz = z.infer<typeof QuizSchema>;

const MultipleChoiceAnswerSchema = z.object({
  type: z.literal(QuestionType.MultipleChoice),
  answers: z.string().array().nonempty(),
});

const AnswerSchema = z.discriminatedUnion("type", [MultipleChoiceAnswerSchema]);
export type Answer = z.infer<typeof AnswerSchema>;
