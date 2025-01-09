"use client";

import { SimpleTreeView } from "@mui/x-tree-view";
import NavItem from "./item";
import { usePathname as useNextPathname } from "next/navigation";
import React from "react";
import { Typography } from "@mui/material";

export type ClientTreeNode = {
    label: string;
    path: string;
    children: ClientTreeNode[];
}

function NodeView({ node }: { node: ClientTreeNode }) {
    const path = usePathname();
    const label = React.useMemo(() => {
        if (path === node.path) return <strong>{node.label}</strong>;
        return node.label;
    }, [path, node]);

    return <NavItem itemId={node.path} href={node.path} label={<Typography fontSize="0.875rem" color="textSecondary">{label}</Typography>}>
        {node.children.map(child => <NodeView key={child.path} node={child} />)}
    </NavItem>;
}

function getExpandedItems(node: ClientTreeNode, path: string): string[] {
    if (node.path === path) return [node.path];
    return node.children.flatMap(child => {
        const expanded = getExpandedItems(child, path);
        return expanded.length > 0 ? [node.path, ...expanded] : [];
    });
}

function getAllExpandedItems(nodes: ClientTreeNode[], path: string): string[] {
    return nodes.flatMap(node => getExpandedItems(node, path));
}

function usePathname(): string {
    let pathname = useNextPathname();
    if (pathname && process?.env?.NEXT_PUBLIC_BASE_PATH && pathname.startsWith(process.env.NEXT_PUBLIC_BASE_PATH)) {
        pathname = pathname.substring(process.env.NEXT_PUBLIC_BASE_PATH.length);
        return pathname === '' ? '/' : pathname;
    }
    return pathname;
}

export default function ClientTree({ nodes }: { nodes: ClientTreeNode[] }) {
    const path = usePathname();

    // Make sure the relevant section of the tree is expanded when the page loads
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const expandedItems = React.useMemo(() => getAllExpandedItems(nodes, path), []);

    return <SimpleTreeView disableSelection sx={{ transform: "translateX(-8px)" }} defaultExpandedItems={expandedItems}>
        {nodes.map(node => <NodeView key={node.path} node={node} />)}
    </SimpleTreeView>;
}