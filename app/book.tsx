import fs from "fs";
import path from "path";
import { z } from "zod";
import matter from "gray-matter";
import { MDXServer, type MDXServerProps } from "@/components/mdx";
import { Typography } from "@mui/material";

import "katex/dist/katex.min.css";
import { cache } from "react";
import compileTOC, { type TOCNode } from "@/components/toc/compile";

export type Book = BookNode[];

/**
 * Represents a single page in the book.
 *
 * Note: This __cannot__ be sent to the client. Besides being a circular data structure,
 * it contains a huge amount of data. Consider taking portions of the data and sending that.
 */
export type BookNode = {
  route: string;
  meta: NodeMetadata;
  toc: TOCNode;
  links: BookLinks;
  content: React.ReactNode;
  children: BookNode[];
};

export type BookLinks = {
  /**
   * The previous page in sequence, if any.
   */
  prev: BookNode | null;

  /**
   * The next page in sequence, if any.
   */
  next: BookNode | null;
};

export type NodeMetadata = Omit<
  z.infer<typeof MetadataSchema>,
  "nav_title" | "hidden"
> & {
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

  /**
   * The path to the page as it appears in the browser.
   * Can be considered a unique identifier for the page.
   */
  path: string;

  /**
   * Whether the page should be hidden from the navigation.
   */
  hidden: boolean;

  /**
   * The link to this page's source on GitHub
   */
  github: string;
};

const MarkdownExtensions = [".md", ".mdx"];

const MetadataSchema = z.object({
  /** Title of the page. Appears at the top of the page content. */
  title: z.string(),
  /** A short, one-sentence description of the page content. */
  description: z.string(),
  /** Title as it appears in the navigation. If not provided, title is used instead. */
  nav_title: z.string().optional(),
  /** Whether the page should be hidden from the navigation. */
  hidden: z.boolean().optional(),
});

async function build(): Promise<Book> {
  const node = await buildNode("src", []);

  // The returned book applies a transformation on the node tree.
  // It adds an index page to the children array of the root node
  // using the index content of the src directory, which becomes the homepage.

  const nodes = node.children;
  nodes.unshift({
    ...node,
    route: "",
    children: [],
  });

  // Populate the previous/next pages of each node recursively.
  // The previous/next correspond to an pre-order traversal of the nodes,
  // e.g. read the current page, then try reading all the pages of the first child, etc.

  let prev: BookNode | null = null;
  function setPrevNext(node: BookNode[] | BookNode) {
    if (prev) {
      if (!Array.isArray(node)) {
        prev.links.next = node;
        node.links.prev = prev;
      }
    }

    if (!Array.isArray(node)) prev = node;

    for (const child of Array.isArray(node) ? node : node.children)
      if (!child.meta.hidden) setPrevNext(child);
  }

  setPrevNext(nodes);

  return nodes;
}

export const buildBook = cache(build);

async function buildNode(
  nodePath: string,
  stack: BookNode[]
): Promise<BookNode> {
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
  route = route.replace(/^\d+.*?-+/, "");

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
  const rawContent = fs.readFileSync(contentPath);
  const { data, content } = matter(rawContent);
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

  const browserPath = path
    .join(
      `/${stack
        .slice(1)
        .map((node) => node.route)
        .join("/")}`,
      stack.length > 0 ? route : ""
    )
    .replaceAll(path.sep, "/");

  const meta: NodeMetadata = {
    ...result.data,
    nodePath,
    contentPath,
    path: browserPath,
    nav_title: result.data.nav_title ?? result.data.title,
    hidden: result.data.hidden ?? false,
    github: `https://github.com/cs106l/textbook/blob/main/${contentPath}`,
  };

  const node: BookNode = {
    route,
    meta,
    toc: await compileTOC(content),

    // Setting these to null now, we will populate them once the tree is constructed
    links: { prev: null, next: null },
    content: <Page meta={meta} source={rawContent} />,
    children: [],
  };

  const children = await Promise.all(
    childPaths.map((p) => buildNode(p, [...stack, node]))
  );
  node.children = children;

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

/**
 * The page content. For guidelines on what should go into the page content,
 * this should be everything that would be hypothetically printed out if the
 * page were to be printed or saved to a PDF.
 */
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
      <Typography variant="body1" color="textSecondary" mb={1}>
        {meta.description}
      </Typography>
      <MDXServer {...rest} path={meta.path} />
    </>
  );
}
