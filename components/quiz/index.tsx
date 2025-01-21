"use client";

import { PreContent } from "../pre";
import {
  Box,
  Button,
  Container,
  Divider,
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
import { MDXClient } from "../mdx/client";
import { MultipleChoiceMethods } from "./mcq";
import { z } from "zod";
import useStoredAnswers from "./storage";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const [answers, setAnswers] = useStoredAnswers(quiz);

  return (
    <QuizBox
      header={
        answers ? null : (
          <Typography>
            {numQuestions} question{numQuestions > 1 && "s"}
          </Typography>
        )
      }
    >
      <AnswerReview
        quiz={quiz}
        answers={answers}
        onAttempt={() => setOpen(true)}
        onGiveUp={(a) => setAnswers({ ...a, gaveUp: true })}
      />
      <QuizModal
        open={open}
        onClose={() => setOpen(false)}
        quiz={quiz}
        onComplete={(a) => setAnswers(a)}
      />
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
      {children}
    </Stack>
  );
}

function QuizModal({
  quiz,
  open,
  onClose,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  quiz: Quiz;
  onComplete: (answers: QuizAnswers) => void;
}) {
  const [index, setIndex] = React.useState(0);
  const answers = React.useRef<QuizAnswers>({ answers: {} });
  const { key, question } = quiz.questions[index];

  const onSubmit = React.useCallback(
    (answer: Answer) => {
      answers.current.answers[key] = answer;
      if (index + 1 < quiz.questions.length) setIndex((idx) => idx + 1);
      else {
        onClose();
        onComplete(answers.current);
      }
    },
    [answers, index, quiz, key, onClose, onComplete]
  );

  React.useEffect(() => {
    if (!open) return;
    setIndex(0);
    answers.current = { answers: {} };
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
          <CloseButton onClose={onClose} />
          <QuizBox
            header={`Question ${index + 1}/${
              Object.keys(quiz.questions).length
            }`}
            sx={{ backgroundColor: "var(--palette-background-header)" }}
          >
            <QuestionPrompt question={question} index={index} as="blockquote" />
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
  as,
}: {
  question: Question;
  index: number;
  as?: React.HTMLElementType;
}) {
  const children = (
    <>
      <Typography variant="h4" mb={1}>
        Question {index + 1}
      </Typography>
      <MDXClient {...question.prompt} noMargin />
    </>
  );

  return React.createElement(as ?? "div", {}, children);
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

  // Reset answers when question changes
  React.useEffect(() => setAnswer(null), [question]);

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

function AnswerReview({
  quiz,
  answers,
  onAttempt,
  onGiveUp,
}: {
  quiz: Quiz;
  answers: QuizAnswers | null;
  onAttempt: () => void;
  onGiveUp: (answers: QuizAnswers) => void;
}) {
  const nCorrect = React.useMemo(() => {
    if (!answers) return 0;
    return quiz.questions.filter(({ key, question }) => {
      const answer: Answer | undefined = answers.answers[key];
      if (!answer) return false;
      const methods = getMethods(question.type);
      const correct = methods.getCorrectAnswer(question);
      return methods.compareAnswers(answer, correct);
    }).length;
  }, [quiz, answers]);

  const nQuestions = Object.keys(quiz.questions).length;

  if (!answers)
    return (
      <Box>
        <Button variant="outlined" color="inherit" onClick={onAttempt}>
          Start
        </Button>
      </Box>
    );

  return (
    <>
      <Typography>
        You answered{" "}
        <strong>
          {nCorrect}/{nQuestions}
        </strong>{" "}
        questions correctly.
      </Typography>
      {!answers.gaveUp && nCorrect !== nQuestions && (
        <Typography>
          You can either{" "}
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => onAttempt()}
          >
            retry the quiz
          </Button>{" "}
          or{" "}
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => onGiveUp(answers)}
          >
            see the correct answers
          </Button>
          .
        </Typography>
      )}
      <Divider />
      {quiz.questions.map(({ key, question }, index) => (
        <QuestionReview
          key={key}
          index={index}
          question={question}
          answer={answers.answers[key]}
          gaveUp={answers.gaveUp}
        />
      ))}
    </>
  );
}

function QuestionReview({
  index,
  question,
  answer,
  gaveUp,
}: {
  index: number;
  question: Question;
  answer?: Answer;
  gaveUp?: boolean;
}) {
  const methods = getMethods(question.type);
  const correct = answer
    ? methods.compareAnswers(answer, methods.getCorrectAnswer(question))
    : false;

  const showAnswer = gaveUp && !correct;

  return (
    <>
      <QuestionPrompt question={question} index={index} />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        {answer && (
          <ItemReview correct={correct} heading={showAnswer && "You answered"}>
            <methods.AnswerView question={question} answer={answer} />
          </ItemReview>
        )}
        {showAnswer && (
          <ItemReview
            correct={true}
            heading={showAnswer && "The correct answer is"}
          >
            <methods.AnswerView
              question={question}
              answer={methods.getCorrectAnswer(question)}
            />
          </ItemReview>
        )}
      </Stack>
    </>
  );
}

function ItemReview({
  correct,
  heading,
  children,
}: {
  correct: boolean;
  heading?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <Box
      borderRadius="var(--shape-borderRadius)"
      border="1px solid var(--palette-divider)"
      padding={2}
      width={{ xs: 1, sm: 0 }}
      flex={1}
    >
      {heading && (
        <Typography variant="h5" mb={1}>
          {heading}
        </Typography>
      )}
      <Box
        sx={{
          "&:before": {
            content: correct ? '"✓ Correct"' : '"✗ Incorrect"',
            color: correct
              ? "var(--palette-success-main)"
              : "var(--palette-error-main)",
            marginRight: "1rem",
          },
        }}
        component="span"
      >
        {children}
      </Box>
    </Box>
  );
}
