/**
 * Very heavily taken from
 * https://github.com/hyoban/remark-github-alerts/blob/main/src/index.ts
 * and modified by Jacob Roberts-Baca
 */

import type { Paragraph, Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

const remarkGithubAlerts: Plugin<[], Root> = (options = {}) => {
  const markers = ["TIP", "NOTE", "IMPORTANT", "WARNING", "CAUTION"];
  const markerNameRE = markers.join("|");
  const markerRegex = new RegExp(
    `^\\[\\!(${markerNameRE})\\]([^\\n\\r]*)`,
    "i"
  );

  return (tree) => {
    visit(tree, "blockquote", (node) => {
      const children = node.children as Paragraph[];
      const firstParagraph = children[0];
      if (!firstParagraph || firstParagraph.type !== "paragraph") return;
      let firstContent = firstParagraph.children?.[0];
      if (!firstContent) return;
      if (
        !("value" in firstContent) &&
        "children" in firstContent &&
        firstContent.children[0]
      ) {
        firstContent = firstContent.children[0];
      }

      if (firstContent.type !== "text") return;
      const match = firstContent.value.match(markerRegex);
      if (!match) return;

      const type = match[1]?.toLowerCase();

      firstContent.value = firstContent.value
        .slice(match[0].length)
        .trimStart();

      node.data = {
        hName: "alert",
        hProperties: {
          class: type,
        },
      };
    });

    return tree;
  };
};

export default remarkGithubAlerts;
