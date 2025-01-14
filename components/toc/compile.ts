import { compile } from "@mdx-js/mdx";
import { getMDXOptions } from "../mdx";

import { Plugin } from "unified";
import { Node } from "unist";
import { type VFile } from "vfile";

import { SKIP, visit } from "unist-util-visit";
import { toString } from "mdast-util-to-string";

import type { Heading, Text, InlineCode } from "mdast";
import GithubSlugger from "github-slugger";

export type TOCNode = {
  title?: string;
  id: string;
  depth: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  content: string;
  children: TOCNode[];
};

const remarkTOC: Plugin = () => {
  return (tree: Node, file: VFile) => {
    const stack: TOCNode[] = [
      {
        depth: 0,
        id: "",
        content: "",
        children: [],
      },
    ];

    const slugger = new GithubSlugger();

    visit(tree, (node) => {
      if (node.type === "heading") {
        const heading = node as Heading;
        const headingContent = toString(heading);
        const toc: TOCNode = {
          title: headingContent,
          id: slugger.slug(headingContent),
          depth: heading.depth,
          content: "",
          children: [],
        };

        // Pop stack until we reach the right depth
        while (heading.depth <= stack[stack.length - 1].depth) stack.pop();

        stack[stack.length - 1].children.push(toc);
        stack.push(toc);

        // Don't include heading node content in toc.content
        return SKIP;
      }

      /*
        Extract text content from nodes that should be included in search index 
        In particular, note that we do not include fenced code blocks, for a few reasons.
        For one, these might not represent searchable text at all (for instance, inline quizzes).
        Secondly, the content of these blocks is usually not natural language, so should not
        be searchable by principle.
      */

      const parent = stack[stack.length - 1];

      if (node.type === "paragraph") {
        // Add a space between paragraphs
        if (parent.content.length > 0 && !/\s$/.test(parent.content))
          parent.content += " ";
      } else if (node.type === "text") {
        const text = node as Text;
        parent.content += text.value;
      } else if (node.type === "inlineCode") {
        const code = node as InlineCode;
        parent.content += code.value;
      }
    });

    file.data.toc = stack[0];
  };
};

export default async function compileTOC(source: string): Promise<TOCNode> {
  const options = getMDXOptions({ path: "[toc]" });
  options.mdxOptions?.remarkPlugins?.push(remarkTOC);
  const compiled = await compile(source, options.mdxOptions);
  return compiled.data.toc as TOCNode;
}
