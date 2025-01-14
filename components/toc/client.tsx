"use client";

import { SimpleTreeView } from "@mui/x-tree-view";
import TreeItem, { TreeItemClasses } from "../tree-item";
import { Typography } from "@mui/material";
import React from "react";

export type ClientTOCNode = {
  id: string;
  title: string;
  children: ClientTOCNode[];
};

function NodeView({
  node,
  active,
}: {
  node: ClientTOCNode;
  active: string | null;
}) {
  const label = React.useMemo<React.ReactNode>(() => {
    const isActive = node.id === active;
    return (
      <Typography
        variant="inherit"
        color={isActive ? "textPrimary" : "textSecondary"}
        fontWeight={isActive ? "bold" : "unset"}
      >
        {node.title}
      </Typography>
    );
  }, [node, active]);

  return (
    <TreeItem itemId={node.id} label={label} href={`#${node.id}`}>
      {node.children.map((child) => (
        <NodeView key={child.id} node={child} active={active} />
      ))}
    </TreeItem>
  );
}

export default function ClientTOC({ node }: { node: ClientTOCNode }) {
  const ids = React.useMemo(() => allIds(node), [node]);
  const active = useTopmost(ids, 100);

  return (
    <SimpleTreeView
      expandedItems={ids}
      onExpandedItemsChange={() => {}}
      disableSelection
      disabledItemsFocusable
      sx={{
        position: "relative",
        color: "var(--palette-text-secondary)",

        [`& .${TreeItemClasses.label}`]: {
          fontSize: "0.875rem",
        },

        [`& .${TreeItemClasses.iconContainer}`]: {
          display: "none",
        },
      }}
    >
      {node.children.map((child) => (
        <NodeView key={child.id} node={child} active={active} />
      ))}
    </SimpleTreeView>
  );
}

function allIds(node: ClientTOCNode): string[] {
  return [
    ...(node.id === "" ? [] : [node.id]),
    ...node.children.flatMap(allIds),
  ];
}

const useTopmost = (ids: string[], tolerance?: number) => {
  tolerance ??= 0;
  const [topmost, setTopmost] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handleScroll = () => {
      let topmost: string | null = null;
      let minOffset = Number.POSITIVE_INFINITY;

      ids.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
          const { top } = element.getBoundingClientRect();
          if (top > tolerance) return;
          const offset = tolerance - top;
          if (offset < minOffset) {
            minOffset = offset;
            topmost = id;
          }
        }
      });

      // If we are scrolled near to the bottom of the page,
      // lets aritificially select the last element
      if (
        ids.length > 0 &&
        window.scrollY + window.innerHeight >=
          document.body.scrollHeight - tolerance
      )
        topmost = ids[ids.length - 1];

      if (topmost) setTopmost(topmost);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [ids, tolerance]);

  return topmost;
};
