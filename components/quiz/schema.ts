/**
 * Contains the schema for inline markdown quizzes.
 */

import { z } from "zod";
import { serializeMDX } from "../mdx";
import objectHash from "object-hash";

export enum QuestionType {
  MultipleChoice = "multiple-choice",
  ShortAnswer = "short-answer",
}

export const MarkdownSchema = z.string().transform(serializeMDX);

export const QuestionBaseSchema = z.object({
  prompt: MarkdownSchema,
  context: MarkdownSchema.optional(),
});

export const MultipleChoiceResponses = z.record(MarkdownSchema);
export const MultipleChoiceSchema = z.object({
  type: z.literal(QuestionType.MultipleChoice),
  answers: MultipleChoiceResponses,
  distractors: MultipleChoiceResponses,
});

export const QuestionSchema = z
  .discriminatedUnion("type", [MultipleChoiceSchema])
  .and(QuestionBaseSchema);

export const QuizSchema = injectHash(
  z.object({
    hash: z.string(),
    quiz: z.string(),
    questions: z.record(QuestionSchema),
  })
).transform(({ questions, ...rest }) => ({
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

export const AnswerSchema = z.discriminatedUnion("type", [
  MultipleChoiceAnswerSchema,
]);

export type TypedAnswer<T extends QuestionType> = Extract<Answer, { type: T }>;
export type Answer = z.infer<typeof AnswerSchema>;

export const QuizAnswersSchema = z.object({
  gaveUp: z.boolean().optional(),
  answers: z.record(AnswerSchema),
});

export type QuizAnswers = z.infer<typeof QuizAnswersSchema>;

function injectHash<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((val, ctx) => {
    if (typeof val !== "object" || val === null) {
      ctx.addIssue({
        path: ctx.path,
        code: "invalid_type",
        received: val === null ? "null" : typeof val,
        expected: "object",
      });
      return val;
    }
    return {
      hash: objectHash(val),
      ...val,
    };
  }, schema);
}
