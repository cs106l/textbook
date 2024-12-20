"use client";

import { Book } from "@/app/book";
import { Typography } from "@mui/material";

export default function ClientChapterTree({ book }: { book: Book }) {
  return book.map((node) => (
    <Typography key={node.route}>{node.meta.title}</Typography>
  ));
}
