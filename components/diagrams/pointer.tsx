"use client";

import React from "react";
import { alpha, useTheme } from "@mui/material";
import { useDiagram, ValueProps } from "./render";
import { formatLocation } from "./compile";
import { debounce, merge } from "lodash";

function getSocket(el: Element | null) {
  while (el) {
    const socket = el.getAttribute("data-connector");
    if (socket) return socket as LeaderLine.SocketType;
    el = el.parentElement;
  }
  return undefined;
}

export type PointerLineProps = {
  value: ValueProps<"pointer">["value"];
  ref: React.RefObject<HTMLElement | null>;
};

export default function PointerLine({ value, ref }: PointerLineProps) {
  const { arrowContainerRef, subdiagramRef } = useDiagram();
  const theme = useTheme();

  /** When this value updates, we will re-render the arrow */
  const [updateCounter, setUpdateCounter] = React.useState(0);
  const updateArrows = React.useMemo(
    () => debounce(() => setUpdateCounter((n) => n + 1), 250),
    []
  );

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
    if (!ref.current || !dst) return;

    const { opacity: _, color: __, ...lineOptions } = value.style?.link ?? {};

    const options = merge(
      {
        color: getLineColor(),
        size: 1,
        endPlugSize: 2,
        startSocket: getSocket(ref.current),
        endSocket: getSocket(dst),
        dash: value.style?.link?.dash ? { len: 8, gap: 4 } : undefined,
      },
      lineOptions
    );

    const line = new LeaderLine(ref.current, dst, options);

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
  }, [value, theme, updateCounter]);

  /* Update arrows on window resize */
  React.useEffect(() => {
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [updateArrows]);

  /* Update arrows on a timer (for robustness) */
  React.useEffect(() => {
    const interval = setInterval(updateArrows, 1000);
    return () => clearInterval(interval);
  }, [updateArrows]);

  return null;
}
