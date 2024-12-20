import { Book, BookNode, buildBook } from "../book";
import { notFound } from "next/navigation";
import { Metadata } from "next";

type Params = {
  slug?: string[];
};

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const page = await getPage(params);
  return {
    title: page.meta.nav_title,
    description: page.meta.description,
  };
}

export async function generateStaticParams(): Promise<Params[]> {
  const book = await buildBook();
  const params: Params[] = [];

  function traverse(node: BookNode, path?: string[]) {
    const currentPath = node.route ? [...(path ?? []), node.route] : path;
    params.push({ slug: currentPath });
    node.children.forEach((child) => traverse(child, currentPath));
  }

  book.forEach((node) => traverse(node));
  return params;
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const page = await getPage(params);
  return page.content;
}

async function getPage(params: Promise<Params>): Promise<BookNode> {
  const { slug } = await params;
  const book = await buildBook();
  if (slug === undefined) return book[0];

  function traverse(book: Book, path: string[]): BookNode {
    if (path.length === 0) notFound();
    const [current, ...rest] = path;
    const node = book.find((node) => node.route === current);
    if (node === undefined) notFound();
    if (rest.length === 0) return node;
    return traverse(node.children, rest);
  }

  return traverse(book, slug);
}
