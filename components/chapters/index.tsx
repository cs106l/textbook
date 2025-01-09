import { BookNode, buildBook } from "@/app/book";
import ClientTree, { type ClientTreeNode } from "./client";

function buildClientNode(node: BookNode): ClientTreeNode | null {
    if (node.meta.hidden) return null;
    return {
        label: node.meta.nav_title,
        path: node.meta.path,
        children: buildClientNodes(node.children),
    }
}

function buildClientNodes(nodes: BookNode[]): ClientTreeNode[] {
    return nodes.map(buildClientNode).filter(node => node !== null);
}

export default async function ChapterTree() {
    const book = await buildBook();
    return <ClientTree nodes={buildClientNodes(book)} />;
}