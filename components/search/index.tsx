import { Book, BookNode, buildBook } from "@/app/book";
import SearchClient from "./client";

import path from "path";
import fs from "fs";
import { TOCNode } from "../toc/compile";
import {
  newDoc,
  SearchIndex,
  SearchResult,
  SearchResultType,
  SerializedIndex,
} from "./common";

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

async function buildIndex(book: Book): Promise<SearchIndex> {
  const doc = newDoc();
  const counter: Counter = { index: 0 };
  book.forEach((node) => processBookNode(node, doc, counter));
  return doc;
}

type Counter = { index: number };

function processBookNode(node: BookNode, doc: SearchIndex, nextId: Counter) {
  if (node.meta.hidden) return;
  doc.add({
    id: nextId.index++,
    content: `${node.meta.nav_title} ${node.meta.title}`,
    type: SearchResultType.Page,
    path: node.meta.path,
    title: node.meta.nav_title,
  });
  processTocNode(node, node.toc, doc, nextId);
  node.children.forEach((child) => processBookNode(child, doc, nextId));
}

function processTocNode(
  node: BookNode,
  toc: TOCNode,
  doc: SearchIndex,
  nextId: Counter
) {
  if (toc.title) {
    doc.add({
      id: nextId.index++,
      content: toc.title,
      type: SearchResultType.Heading,
      path: node.meta.path,
      slug: toc.id,
      title: node.meta.nav_title,
    });
    doc.add({
      id: nextId.index++,
      content: toc.content,
      type: SearchResultType.Body,
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
      type: SearchResultType.Page,
      title: node.meta.nav_title,
      path: node.meta.path,
    });
  });
  return suggestions;
}

async function serializeDocument(doc: SearchIndex): Promise<SerializedIndex> {
  const serialized: SerializedIndex = [];
  await doc.export((key, data) => serialized.push([key, data]));
  return serialized;
}
