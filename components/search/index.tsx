import { Book, BookNode, buildBook } from "@/app/book";
import SearchClient from "./client";
import FlexSearch from "flexsearch";

import path from "path";
import fs from "fs";
import { TOCNode } from "../toc/compile";

export type SearchResult = {
  id: number;
  content: string;
  heading: boolean; // Is this search result a heading?
  path: string; // The link to the page
  slug: string; // The slug of the containing section
  title: string; // The title of the containing page
};

export type Document = FlexSearch.Document<SearchResult, string[]>;
export type SerializedDocument = [string | number, SearchResult][];

export default async function Search() {
  /**
   * This is a server component.
   * It's job is to build the search index from the book content,
   * and then save it to a file called `search.json` in the public/ directory.
   * Then, that file can be lazily loaded by the client search component,
   * which this component returns below.
   */

  const book = await buildBook();
  const doc = await buildIndex(book);
  const serialized = await serializeDocument(doc);

  const outputPath = path.join(process.cwd(), "public", "search.json");
  fs.writeFileSync(outputPath, JSON.stringify(serialized));

  return <SearchClient defaultSuggestions={getDefaultSuggestions(book)} />;
}

async function buildIndex(book: Book): Promise<Document> {
  const doc = new FlexSearch.Document<SearchResult, string[]>({
    document: {
      id: "id",
      index: "content",
      store: ["heading", "path", "slug", "title"],
    },
  });

  const counter: Counter = { index: 0 };
  book.forEach((node) => processBookNode(node, doc, counter));

  return doc;
}

type Counter = { index: number };

function processBookNode(node: BookNode, doc: Document, nextId: Counter) {
  if (node.meta.hidden) return;
  processTocNode(node, node.toc, doc, nextId);
  node.children.forEach((child) => processBookNode(child, doc, nextId));
}

function processTocNode(
  node: BookNode,
  toc: TOCNode,
  doc: Document,
  nextId: Counter
) {
  if (toc.title) {
    doc.add({
      id: nextId.index++,
      content: toc.title,
      heading: true,
      path: node.meta.path,
      slug: toc.id,
      title: node.meta.nav_title,
    });
    doc.add({
      id: nextId.index++,
      content: toc.content,
      heading: false,
      path: node.meta.path,
      slug: toc.id,
      title: node.meta.nav_title,
    });
  }

  toc.children.forEach((child) => processTocNode(node, child, doc, nextId));
}

function getDefaultSuggestions(book: Book): SearchResult[] {
  const suggestions: SearchResult[] = [];
  book.forEach((node, index) => {
    if (node.meta.hidden) return;
    suggestions.push({
      id: index,
      content: node.meta.nav_title,
      heading: true,
      slug: "",
      title: node.meta.nav_title,
      path: node.meta.path,
    });
  });
  return suggestions;
}

async function serializeDocument(doc: Document): Promise<SerializedDocument> {
  const serialized: SerializedDocument = [];
  await doc.export((key, data) => serialized.push([key, data]));
  return serialized;
}
