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

const remarkQuiz: Plugin = () => {
  return async (tree: Node, file: VFile) => {
    const quizNodes: Code[] = [];

    visit(tree, "code", function (node: Code) {
      const [type] = getOptions(node.lang);
      if (type !== "quiz") return;
      quizNodes.push(node);
    });

    const quizzes: Quiz[] = [];
    for (const node of quizNodes) {
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
      quizzes.push(quiz);
      node.value = JSON.stringify(quiz);
    }

    file.data.quizzes = quizzes;
  };
};

export default remarkQuiz;
