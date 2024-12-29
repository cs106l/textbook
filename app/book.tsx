import fs from "fs";
import path from "path";
import { z } from "zod";
import matter from "gray-matter";
import { MDXServer, type MDXServerProps } from "@/components/mdx";
import { Typography } from "@mui/material";

import "katex/dist/katex.min.css";
import { cache } from "react";

export type Book = BookNode[];

export type BookNode = {
  route: string;
  meta: NodeMetadata;
  content: React.ReactNode;
  children: BookNode[];
};

export type NodeMetadata = Omit<z.infer<typeof MetadataSchema>, "nav_title"> & {
  /**
   * Path to the directory or file representing this node.
   * This is relative to the project root.
   */
  nodePath: string;
  /**
   * Path to the markdown file representing this node.
   * This is relative to the project root.
   */
  contentPath: string;

  /** Title as it appears in the navigation. */
  nav_title: string;
};

const MarkdownExtensions = [".md", ".mdx"];

const MetadataSchema = z.object({
  /** Title of the page. Appears at the top of the page content. */
  title: z.string(),
  /** A short, one-sentence description of the page content. */
  description: z.string(),
  /** Title as it appears in the navigation. If not provided, title is used instead. */
  nav_title: z.string().optional(),
});

async function build(): Promise<Book> {
  const node = await buildNode("src");

  // The returned book applies a transformation on the node tree.
  // It adds an index page to the children array of the root node
  // using the index content of the src directory, which becomes the homepage.

  const nodes = node.children;
  nodes.unshift({
    ...node,
    route: "",
    children: [],
  });

  return nodes;
}

export const buildBook = cache(build);

async function buildNode(nodePath: string): Promise<BookNode> {
  if (!fs.existsSync(nodePath))
    throw new Error(`Couldn't build book. Path not found: ${nodePath}`);

  const isDir = fs.statSync(nodePath).isDirectory();

  let route: string;
  let contentPath: string;
  const childPaths: string[] = [];

  if (isDir) {
    route = path.basename(nodePath);

    // Find the index markdown file for this directory
    const indexNames = MarkdownExtensions.map((ext) => `index${ext}`);
    const indexFiles = indexNames.map((name) => path.join(nodePath, name));
    const indexFile = indexFiles.find((file) => fs.existsSync(file));

    if (!indexFile)
      throw new Error(
        `Couldn't build book. No ${indexNames.join(
          "/"
        )} in directory: ${nodePath}`
      );

    contentPath = indexFile;

    const children = fs.readdirSync(nodePath).sort();
    for (const child of children) {
      const childPath = path.join(nodePath, child);
      const isChildDir = fs.statSync(childPath).isDirectory();
      if (isChildDir) childPaths.push(childPath);
      else if (
        !indexNames.includes(child) &&
        MarkdownExtensions.includes(path.extname(childPath))
      )
        childPaths.push(childPath);
    }
  } else {
    route = path.basename(nodePath, path.extname(nodePath));
    contentPath = nodePath;
  }

  // Routes may begin with a ##- prefix to indicate the collation order,
  // but this gets removed in the final slug.
  //
  // Examples:
  //  01-Introduction     -> Introduction
  //  02a-Getting-Started -> Getting-Started
  //  02b--Installation   -> Installation
  route = route.replace(/^\d+.*-+/, "");

  // Routes must be alphanumeric with dashes to make routing intuitive.
  // Whitespace and underscores are replaced by dashes.
  // Any other non-comforming character is removed
  // Multiple dashes collapse into one dash.
  // Finally, the route is lowercased.
  //
  // Examples:
  //  Introduction -> introduction
  //  Getting Started -> getting-started
  //  Class--Templates -> class-templates
  //  Wonky_[Path] -> wonky-path
  route = route
    .replace(/(\s|_)/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .replace(/-+/g, "-")
    .toLowerCase();

  if (!route)
    throw new Error(`Couldn't build book. ${nodePath} produced empty route.`);

  // Parse frontmatter metadata from the markdown file
  const content = fs.readFileSync(contentPath);
  const { data } = matter(content);
  const result = MetadataSchema.safeParse(data);
  if (!result.success)
    throw new Error(
      [
        `Couldn't build book. Invalid frontmatter in ${contentPath}.`,
        "",
        "The beginning of each markdown page should be a YAML frontmatter block that looks like this:",
        "",
        "---",
        "title: My Page Title",
        "description: A short description of the page",
        "# Other properties",
        "---",
        "",
        `Validation error: ${result.error.message}`,
      ].join("\n")
    );

  const meta: NodeMetadata = {
    ...result.data,
    nodePath,
    contentPath,
    nav_title: result.data.nav_title ?? result.data.title,
  };

  const node: BookNode = {
    route,
    meta,
    content: <Page meta={meta} source={content} />,
    children: await Promise.all(childPaths.map(buildNode)),
  };

  // Verify that there are no duplicate slugs in the children
  const slugMap: { [route: string]: string } = {};
  for (const child of node.children) {
    if (slugMap[child.route])
      throw new Error(
        `Couldn't build book. Two pages have the same slug (${child.route}): ${
          slugMap[child.route]
        } and ${child.meta.nodePath}`
      );
    slugMap[child.route] = child.meta.nodePath;
  }

  return node;
}

function Page({
  meta,
  ...rest
}: MDXServerProps & {
  meta: NodeMetadata;
}) {
  return (
    <>
      <Typography variant="h1" mb={1} pt={1}>
        {meta.title}
      </Typography>
      <MDXServer {...rest} />
    </>
  );
}
