import { BookNode } from "@/app/book";
import ClientTOC, { ClientTOCNode } from "./client";
import { TOCNode } from "./compile";

function buildClientNode(toc: TOCNode): ClientTOCNode {
  return {
    id: toc.id,
    title: toc.title ?? "",
    children: toc.children.map(buildClientNode),
  };
}

export default async function TOCView({ node }: { node: BookNode }) {
  return <ClientTOC node={buildClientNode(node.toc)} />;
}
