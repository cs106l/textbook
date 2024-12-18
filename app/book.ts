import { MDXProps } from "mdx/types";
import { JSX } from "react";

export type BookNode = {
  slug: string;
  Page: (props: MDXProps) => JSX.Element;
  children: BookNode[];
};

export type Book = BookNode[];