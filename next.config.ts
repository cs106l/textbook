import type { NextConfig } from "next";
import createMDX from "@next/mdx";

import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

const nextConfig: NextConfig = {
  output: "export",
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
};

/**
 * Creates a remark plugin that removes frontmatter from a markdown file.
 * We don't actually use the frontmatter here, we just get rid of it
 * so it doesn't appear in the rendered output.
 * @returns A remark plugin.
 */
function removeFrontmatter() {
  return (tree: any) => {
    if (tree.children.length === 0) return;

    //
    // Source:
    // https://gist.github.com/sudkumar/70834062f9243558846249f2c2f98902
    //
    // We need to remove the frontmatter from the tree
    // because it has already been processed by mdx and nodes
    // have beed created for it assuming it was a markdown content
    //
    // remove the thematicBreak "<hr />" to first heading
    // --- => thematicBreak
    // title: this
    // date: 2020-12-12 => becomes heading
    // ---
    if (tree.children[0].type === "thematicBreak") {
      const firstHeadingIndex = tree.children.findIndex(
        (t: any) => t.type === "heading"
      );
      if (firstHeadingIndex !== -1) {
        // we will mutate the tree.children by removing these nodes
        tree.children.splice(0, firstHeadingIndex + 1);
      }
    }
  };
}

const withMDX = createMDX({
  extension: /\.md|.mdx$/,
  options: {
    remarkPlugins: [removeFrontmatter, remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});

export default withMDX(nextConfig);
