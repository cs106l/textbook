"use client";

import React from "react";
import { alpha, useTheme } from "@mui/material";
import { useDiagram, ValueProps } from "./render";
import { formatLocation } from "./compile";
import { merge } from "lodash";

function getSocket(el: Element | null) {
  while (el) {
    const socket = el.getAttribute("data-connector");
    if (socket) return socket as LeaderLine.SocketType;
    el = el.parentElement;
  }
  return undefined;
}

export default function PointerValueView({
  value,
  path,
}: ValueProps<"pointer">) {
  const src = React.useRef<HTMLElement | null>(null);

  const { arrowContainerRef, subdiagramRef } = useDiagram();
  const theme = useTheme();

  const getLineColor = React.useCallback(() => {
    let rawColor = value.style?.link?.color ?? theme.palette.text.primary;
    rawColor = rawColor.toString(); // Just in case, handle non-string input
    rawColor = rawColor.trim();

    const opacity = value.style?.link?.opacity;
    if (!opacity) return rawColor;

    // Try to apply MUI alpha, which generally can't handle
    // CSS variables, color names like "red", etc.
    try {
      return alpha(rawColor, opacity);
    } catch {}

    // Query the document for the inferred CSS style
    const element = document.createElement("div");
    document.body.appendChild(element);

    try {
      element.style.color = rawColor;
      const color = getComputedStyle(element).color;
      return alpha(color, opacity);
    } finally {
      document.body.removeChild(element);
    }
  }, [value.style, theme]);

  React.useEffect(() => {
    if (!value.value || !arrowContainerRef.current || !subdiagramRef?.current)
      return;
    const dst = subdiagramRef.current.querySelector(
      `[data-ref="${formatLocation(value.value)}"]`
    );
    if (!src.current || !dst) return;

    const { opacity: _, color: __, ...lineOptions } = value.style?.link ?? {};

    const options = merge(
      {
        color: getLineColor(),
        size: 1,
        endPlugSize: 2,
        startSocket: getSocket(src.current),
        endSocket: getSocket(dst),
        dash: value.style?.link?.dash ? { len: 8, gap: 4 } : undefined,
      },
      lineOptions
    );

    const line = new LeaderLine(src.current, dst, options);

    // Code modified from: https://github.com/cognitive-engineering-lab/aquascope/blob/main/frontend/packages/aquascope-editor/src/editor-utils/interpreter.tsx#L606
    // Make arrows local to the diagram rather than global in the body
    // See: https://github.com/anseki/leader-line/issues/54
    const svgSelectors = [".leader-line"];
    const svgElements = svgSelectors.map((sel) => {
      const el = document.body.querySelector(`:scope > ${sel}`);
      if (!el) throw new Error(`Missing LineLeader element: ${sel}`);
      return el;
    });

    for (const svg of svgElements) {
      arrowContainerRef.current.appendChild(svg);
    }

    return () => {
      svgElements.forEach((el) => document.body.appendChild(el));
      line.remove();
    };
  });

  return (
    <span
      data-ref={formatLocation(path)}
      data-connector={
        typeof path[path.length - 1] === "number" ? "bottom" : "right"
      }
      ref={src}
      {...value.style?.value}
    >
      {value.value !== null ? "●" : "⦻"}
    </span>
  );
}
