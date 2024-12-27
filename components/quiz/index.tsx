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
import { Quiz } from "./schema";
import React, { useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";

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
      {children}
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

  useEffect(() => {
    if (!open) return;
    setHelp(false);
    setIndex(0);
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: "blur(30px)",
            backgroundColor: "unset",
          },
        },
      }}
      closeAfterTransition
    >
      <Fade in={open}>
        <Container
          maxWidth="md"
          sx={{
            position: "relative",
            mt: 6,
            transition: "all 0.3s",
          }}
        >
          <CloseButton onClose={() => setOpen(false)} />
          <QuizBox
            header={`Question ${index + 1}/${
              Object.keys(quiz.questions).length
            }`}
          />
          <Stack width={{ xs: 1, sm: 0.5 }} sx={{ float: "right" }}>
            <Typography
              variant="caption"
              fontStyle="italic"
              color="text.secondary"
              sx={{ cursor: "pointer" }}
              textAlign="right"
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
