import { buildBook } from "@/app/book";
import ClientChapterTree from "./tree";

export default async function ChapterTree() {
  const book = await buildBook();
  return <ClientChapterTree book={book} />;
}
