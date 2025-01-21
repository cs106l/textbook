/**
 * Contains a remark plugin to parse diagram markdown and compile it to JSON.
 *
 * This is done so that the client doesn't need to compile the diagram from source,
 * which makes loading faster, allows us to compile markdown on the server, and
 * makes sure that diagram content gets verified at build time (so we can catch
 * errors early).
 */

import { type Plugin } from "unified";
import { type Node } from "unist";

import type { Code, Parent } from "mdast";
import { visit } from "unist-util-visit";
import { getOptions } from "../pre";
import compileDiagram from "./compile";

const remarkMemDiagram: Plugin = () => {
  return async (tree: Node) => {
    const diagramNodes: Code[] = [];

    visit(tree, "code", function (node: Code) {
      const [type] = getOptions(node.lang);
      if (type !== "memory") return;
      diagramNodes.push(node);
    });

    for (const node of diagramNodes) {
      const content = node.value;
      const diagram = await compileDiagram(content);
      node.value = JSON.stringify(diagram);
    }

    // If there are any code blocks that are immediately followed
    // by a memory diagram, we will remove the margin below the
    // code block

    visit(tree, "code", function (node: Code, _, parent: Parent) {
      const [type] = getOptions(node.lang);
      if (type !== "code") return;
      const childIdx = parent.children.indexOf(node);
      if (childIdx === -1) return;
      const nextNode = parent.children[childIdx + 1];
      if (!nextNode || nextNode.type !== "code") return;
      const [nextType] = getOptions(nextNode.lang);
      if (nextType !== "memory") return;
      node.lang = `${node.lang},gapless`;
    });
  };
};

export default remarkMemDiagram;
