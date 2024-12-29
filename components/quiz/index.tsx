"use client";

import { PreContent } from "../pre";
import {
  Box,
  Button,
  Container,
  Fade,
  Modal,
  Stack,
  SvgIcon,
  SxProps,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Answer,
  Question,
  QuestionType,
  Quiz,
  QuizAnswers,
  TypedAnswer,
  TypedQuestion,
} from "./schema";
import React from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { MDXClient } from "../mdx";
import { MultipleChoiceMethods } from "./mcq";
import { z } from "zod";

export type ResponseViewProps<T extends QuestionType> = {
  question: TypedQuestion<T>;
  answer: TypedAnswer<T> | null;
  onChange: (answer: TypedAnswer<T>) => void;
};

export type AnswerViewProps<T extends QuestionType> = {
  question: TypedQuestion<T>;
  answer: TypedAnswer<T>;
};

export type QuestionMethods<T extends QuestionType> = {
  getCorrectAnswer: (question: TypedQuestion<T>) => TypedAnswer<T>;
  compareAnswers: (a: TypedAnswer<T>, b: TypedAnswer<T>) => boolean;
  answerSchema: z.ZodSchema<TypedAnswer<T>>;

  ResponseView: React.FC<ResponseViewProps<T>>;
  AnswerView: React.FC<AnswerViewProps<T>>;
};

function getMethods(type: QuestionType): QuestionMethods<any> {
  switch (type) {
    case QuestionType.MultipleChoice:
      return MultipleChoiceMethods;
  }

  throw new Error(`Unknown question type: ${type}`);
}

export default function QuizView({ content }: PreContent) {
  const quiz = React.useMemo<Quiz>(() => JSON.parse(content), [content]);
  const numQuestions = Object.keys(quiz.questions).length;

  const [open, setOpen] = React.useState(false);

  return (
    <QuizBox
      header={
        <Typography>
          {numQuestions} question{numQuestions > 1 && "s"}
        </Typography>
      }
    >
      <Box>
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => setOpen(true)}
        >
          Start
        </Button>
      </Box>
      <QuizModal open={open} setOpen={setOpen} quiz={quiz} />
    </QuizBox>
  );
}

function QuizBox({
  children,
  header,
  sx,
}: {
  children?: React.ReactNode;
  header?: React.ReactNode;
  sx?: SxProps;
}) {
  return (
    <Stack
      border={"1px solid var(--palette-divider)"}
      borderRadius={"var(--shape-borderRadius)"}
      padding={2}
      marginBottom={2}
      spacing={2}
      sx={sx}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h3">Quiz</Typography>
        {header}
      </Stack>
      <Box>{children}</Box>
    </Stack>
  );
}

function QuizModal({
  quiz,
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  quiz: Quiz;
}) {
  const [index, setIndex] = React.useState(0);
  const answers = React.useRef<QuizAnswers>({ answers: {} });

  const questions = React.useMemo(() => {
    const entries = Object.entries(quiz.questions);
    return entries.sort((a, b) => a[0].localeCompare(b[0]));
  }, []);

  const [questionKey, question] = questions[index];

  const onSubmit = React.useCallback(
    (answer: Answer) => {
      answers.current.answers[questionKey] = answer;
      if (index + 1 < questions.length) setIndex((idx) => idx + 1);
      else {
        // Pass answers to parent
        setOpen(false);
      }
    },
    [index, questions]
  );

  React.useEffect(() => {
    if (!open) return;
    setIndex(0);
  }, [open]);

  return (
    <Modal
      open={open}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: "blur(30px)",
            backgroundColor: "unset",
          },
        },
      }}
      closeAfterTransition
      sx={{ overflow: "auto" }}
    >
      <Fade in={open}>
        <Container
          maxWidth="md"
          sx={{
            position: "relative",
            my: 6,
            transition: "all 0.3s",
          }}
        >
          <CloseButton onClose={() => setOpen(false)} />
          <QuizBox
            header={`Question ${index + 1}/${
              Object.keys(quiz.questions).length
            }`}
          >
            <QuestionPrompt question={question} index={index} />
            <QuestionResponses question={question} onSubmit={onSubmit} />
          </QuizBox>
        </Container>
      </Fade>
    </Modal>
  );
}

function CloseButton({ onClose }: { onClose: () => void }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        [theme.breakpoints.up("md")]: {
          position: "absolute",
          top: theme.spacing(2),
          right: "-0.5rem",
        },
        textAlign: "right",
      }}
    >
      <SvgIcon
        sx={{
          cursor: "pointer",
        }}
        onClick={onClose}
        fontSize="small"
      >
        <XMarkIcon />
      </SvgIcon>
    </Box>
  );
}

function QuestionPrompt({
  question,
  index,
}: {
  question: Question;
  index: number;
}) {
  return (
    <blockquote>
      <Typography variant="h4" mb={1}>
        Question {index + 1}
      </Typography>
      <MDXClient {...question.prompt} />
    </blockquote>
  );
}

function QuestionResponses({
  question,
  onSubmit,
}: {
  question: Question;
  onSubmit: (answer: Answer) => void;
}) {
  const methods = getMethods(question.type);
  const [answer, setAnswer] = React.useState<Answer | null>(null);

  return (
    <Box>
      <methods.ResponseView
        question={question}
        answer={answer}
        onChange={setAnswer}
      />
      <Box>
        <Button
          variant="outlined"
          color="inherit"
          disabled={!answer || !methods.answerSchema.safeParse(answer).success}
          onClick={() => onSubmit(answer!)}
        >
          Submit
        </Button>
      </Box>
    </Box>
  );
}
