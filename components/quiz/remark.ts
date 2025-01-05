/**
 * Contains a remark plugin to parse quiz markdown and serialize it into JSON.
 */

import { type Plugin } from "unified";
import { type Node } from "unist";
import { type VFile } from "vfile";

import type { Code } from "mdast";
import { visit } from "unist-util-visit";
import { getOptions } from "../pre";

import YAML from "yaml";
import { Quiz, QuizSchema } from "./schema";

const remarkQuiz: Plugin = (pagePath?: string) => {
  return async (tree: Node, file: VFile) => {
    const quizNodes: Code[] = [];

    visit(tree, "code", function (node: Code) {
      const [type] = getOptions(node.lang);
      if (type !== "quiz") return;
      quizNodes.push(node);
    });

    const quizzes: Quiz[] = [];
    const names = new Set<string>();

    for (const node of quizNodes) {
      if (pagePath === undefined)
        throw new Error(
          "It looks like you nested a quiz inside of another quiz. Don't do that!"
        );

      const content = node.value;
      const raw = YAML.parse(content);

      const result = await QuizSchema.safeParseAsync(raw);
      if (!result.success)
        throw new Error(
          [
            "Failed to parse inline quiz. See the validation error below:",
            "",
            result.error.message,
          ].join("\n")
        );

      const quiz = result.data;
      quiz.page = pagePath;
      quizzes.push(quiz);
      node.value = JSON.stringify(quiz);

      if (names.has(quiz.quiz))
        throw new Error(
          `Quiz name "${quiz.quiz}" is already in use in the same file.`
        );
      names.add(quiz.quiz);
    }

    file.data.quizzes = quizzes;
  };
};

export default remarkQuiz;
