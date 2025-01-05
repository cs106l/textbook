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

export const MarkdownSchema = z.string().transform((md) => serializeMDX(md));

export const QuestionBaseSchema = z.object({
  prompt: MarkdownSchema,
  context: MarkdownSchema.optional(),
});

export const MultipleChoiceResponses = z.record(MarkdownSchema).refine((v) => {
  if (Object.keys(v).length === 0)
    return "At least one answer/distractor is required.";
  return true;
});

export const MultipleChoiceSchema = z.object({
  type: z.literal(QuestionType.MultipleChoice),

  /**
   * If true, responses are shown in sorted order by key.
   * Otherwise, responses are randomly displayed.
   */
  sort: z.boolean().optional(),
  answers: MultipleChoiceResponses,
  distractors: MultipleChoiceResponses,
});

export const QuestionSchema = z
  .discriminatedUnion("type", [MultipleChoiceSchema])
  .and(QuestionBaseSchema)
  .refine((v) => {
    // Note: We can't put refinements like these on the
    // individual schemas due to a limitation in zod
    if (v.type === QuestionType.MultipleChoice) {
      const answers = Object.keys(v.answers);
      const distractors = Object.keys(v.distractors);
      const common = answers.filter((key) => distractors.includes(key));
      if (common.length > 0)
        return `Multiple choice question cannot have answers and distractors with the same key: ${common.join(
          ", "
        )}.`;
    }
    return true;
  });

export const QuizSchema = injectHash(
  z.object({
    hash: z.string(),
    quiz: z.string(),
    questions: z.record(QuestionSchema),
  })
).transform(({ questions, ...rest }) => ({
  ...rest,
  // This is the page that the quiz is on and will be updated by the remark plugin
  page: "",
  // This converts the questions from an object to an array
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
