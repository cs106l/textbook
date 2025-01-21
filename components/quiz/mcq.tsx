import {
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup as MuiRadioGroup,
  SxProps,
  FormControl,
} from "@mui/material";
import React from "react";
import { MultipleChoiceAnswerSchema, QuestionType } from "./schema";
import { MDXClient } from "../mdx/client";
import { AnswerViewProps, QuestionMethods, ResponseViewProps } from ".";

import { shuffle } from "lodash";

export const MultipleChoiceMethods: QuestionMethods<QuestionType.MultipleChoice> =
  {
    ResponseView,
    AnswerView,
    getCorrectAnswer(question) {
      return {
        type: QuestionType.MultipleChoice,
        keys: Object.keys(question.answers).sort(),
      };
    },
    compareAnswers(a, b) {
      return (
        a.keys.length === b.keys.length &&
        a.keys.every((k) => b.keys.includes(k))
      );
    },

    answerSchema: MultipleChoiceAnswerSchema,
  };

function ResponseView({
  question,
  answer,
  onChange,
}: ResponseViewProps<QuestionType.MultipleChoice>) {
  const responses = React.useMemo(() => {
    const responses = [
      ...Object.entries(question.answers),
      ...Object.entries(question.distractors),
    ].map(([key, value]) => ({
      key,
      label: <MDXClient {...value} noMargin />,
    }));

    if (!question.sort) return shuffle(responses);
    return responses.sort((a, b) => a.key.localeCompare(b.key));
  }, [question]);

  return (
    <RadioGroup
      multiple={Object.keys(question.answers).length > 1}
      value={answer?.keys ?? []}
      onChange={(keys) => onChange({ type: QuestionType.MultipleChoice, keys })}
      options={responses}
      sx={{
        width: "100%",
        "& .MuiFormControlLabel-label": { flex: 1, overflow: "hidden" },
      }}
    />
  );
}

function AnswerView({
  question,
  answer,
}: AnswerViewProps<QuestionType.MultipleChoice>) {
  const answerMarkdown = answer.keys
    .map((key) => {
      const source = question.answers[key] ?? question.distractors[key];
      if (!source) return null;
      return {
        key,
        content: <MDXClient {...source} noMargin />,
      };
    })
    .filter((kv) => kv !== null);

  if (answerMarkdown.length === 0) return null;
  if (Object.keys(question.answers).length <= 1)
    return answerMarkdown[0].content;
  return (
    <ul style={{ paddingInlineStart: "1rem", margin: 0 }}>
      {answerMarkdown.map((kv) => (
        <li key={kv.key} style={{ marginTop: "0.5rem" }}>
          {kv?.content}
        </li>
      ))}
    </ul>
  );
}

/* ========================================================================= */
/* Radio/checkbox group                                                      */
/* ========================================================================= */

type RadioGroupOption = {
  key: string;
  label: React.ReactNode;
};

type RadioGroupProps = {
  multiple?: boolean;
  value: string[];
  onChange: (value: string[]) => void;
  options: RadioGroupOption[];
  sx: SxProps;
};

function RadioGroup({
  multiple,
  value,
  onChange,
  options,
  sx,
}: RadioGroupProps) {
  const onCheckboxChanged = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const key = event.target.name;
      if (event.target.checked && !value.includes(key))
        onChange([...value, key]);
      else if (!event.target.checked) onChange(value.filter((v) => v !== key));
    },
    [onChange, value]
  );

  const controls = options.map(({ key, label }) => (
    <FormControlLabel
      key={key}
      value={key}
      label={label}
      control={
        multiple ? (
          <Checkbox
            checked={value.includes(key)}
            name={key}
            onChange={onCheckboxChanged}
          />
        ) : (
          <Radio name={key} />
        )
      }
      sx={{ marginBottom: 1, width: "100%" }}
    />
  ));

  if (!multiple)
    return (
      <MuiRadioGroup
        value={value[0] ?? ""}
        onChange={(e) => onChange([e.target.name])}
        sx={sx}
      >
        {controls}
      </MuiRadioGroup>
    );

  return (
    <FormControl component="fieldset" variant="standard" sx={sx}>
      {controls}
    </FormControl>
  );
}
