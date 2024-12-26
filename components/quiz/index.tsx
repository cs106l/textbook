import { PreContent } from "../pre";
import { Box, Button, Stack, Typography } from "@mui/material";
import { Quiz } from "./schema";

export default function QuizView({ content }: PreContent) {
  const quiz = JSON.parse(content) as Quiz;
  const numQuestions = Object.keys(quiz.questions).length;
  return (
    <Stack
      border={"1px solid var(--palette-divider)"}
      borderRadius={"var(--shape-borderRadius)"}
      padding={2}
      marginBottom={2}
      spacing={2}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h3">Quiz</Typography>
        <Typography>
          {numQuestions} question{numQuestions > 1 && "s"}
        </Typography>
      </Stack>
      <Box>
        <Button variant="outlined" color="inherit">
          Start
        </Button>
      </Box>
    </Stack>
  );
}
