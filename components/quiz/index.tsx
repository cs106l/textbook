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
import { Question, Quiz } from "./schema";
import React, { useEffect, useMemo } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { MDXClient } from "../mdx";
import RadioGroup from "./radio";

export default function QuizView({ content }: PreContent) {
  const quiz = JSON.parse(content) as Quiz;
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
  const [help, setHelp] = React.useState(false);
  const [index, setIndex] = React.useState(0);

  const questions = useMemo(() => {
    const entries = Object.entries(quiz.questions);
    return entries.sort((a, b) => a[0].localeCompare(b[0]));
  }, []);

  const question = questions[index][1];

  useEffect(() => {
    if (!open) return;
    setHelp(false);
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
            <QuestionResponses question={question} />
          </QuizBox>
          <Stack
            width={{ xs: 1, sm: 0.5 }}
            sx={{ float: "right" }}
            textAlign="right"
          >
            <Typography
              variant="caption"
              fontStyle="italic"
              color="text.secondary"
              sx={{ cursor: "pointer" }}
              onClick={() => setHelp((v) => !v)}
            >
              Why is this quiz fullscreen?
            </Typography>
            {help && (
              <Typography variant="caption" color="text.secondary">
                We want to know how much you are learning that can be recalled
                without assistance. Please complete the quiz without re-reading
                the text, e.g. by opening it in another tab.
              </Typography>
            )}
          </Stack>
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

function QuestionResponses({ question }: { question: Question }) {
  const responses = [
    ...Object.entries(question.answers),
    ...Object.entries(question.distractors),
  ].map(([key, value]) => ({
    key,
    label: <MDXClient {...value} removeMargin />,
  }));

  const [answer, setAnswer] = React.useState<string[]>([]);

  return (
    <Box>
      <RadioGroup
        multiple={Object.keys(question.answers).length > 1}
        value={answer}
        onChange={setAnswer}
        options={responses}
        sx={{
          width: "100%",
          marginBottom: 2,
          "& .MuiFormControlLabel-label": { width: "100%" },
        }}
      />
      <Box>
        <Button variant="outlined" color="inherit">
          Submit
        </Button>
      </Box>
    </Box>
  );
}
