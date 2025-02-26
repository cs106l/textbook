"use client";

import React from "react";
import { PreContent } from "../pre";
import { formatLocation, mergeNodeStyles } from "./compile";
import {
  DiagramText,
  MemoryDiagram,
  MemoryLocation,
  MemorySection,
  MemorySubDiagram,
  MemoryValue,
  NodeStyle,
  SectionType,
  StyledLabel,
} from "./types";

import {
  alpha,
  Box,
  BoxProps,
  Stack,
  styled,
  SxProps,
  useTheme,
} from "@mui/material";
import { monospace } from "@/app/theme";
import { merge } from "lodash";

import type LeaderLine from "leader-line-new";
import { MDXClient } from "../mdx/client";

export default function MemoryDiagramView({ content }: PreContent) {
  const diagram = React.useMemo<MemoryDiagram>(
    () => JSON.parse(content),
    [content]
  );

  const diagramRef = React.useRef<HTMLDivElement | null>(null);
  const arrowContainerRef = React.useRef<HTMLDivElement | null>(null);

  const positionArrowContainer = React.useCallback(() => {
    if (!diagramRef.current) return;
    if (!arrowContainerRef.current) return;
    const box = diagramRef.current.getBoundingClientRect();
    const x = box.left + window.scrollX - diagramRef.current.scrollLeft;
    const y = box.top + window.scrollY - diagramRef.current.scrollTop;
    arrowContainerRef.current.style.transform = `translate(${-x}px, ${-y}px)`;
  }, [diagramRef, arrowContainerRef]);

  /** Reposition arrow container on child change or re-render */
  React.useEffect(positionArrowContainer);
  React.useEffect(() => {
    if (!arrowContainerRef.current) return;
    const observer = new MutationObserver((list) => {
      const childChanged = list.some((l) => l.type === "childList");
      if (childChanged) positionArrowContainer();
    });

    observer.observe(arrowContainerRef.current, { childList: true });
    return () => observer.disconnect();
  }, [positionArrowContainer]);

  return (
    <DiagramContext.Provider value={{ diagramRef, arrowContainerRef }}>
      <Box
        marginBottom={2}
        padding={2}
        className="memory-diagram"
        position="relative"
        overflow="auto"
        sx={{ backgroundColor: "var(--palette-background-memory)" }}
        ref={diagramRef}
        display="flex"
        flexWrap="wrap"
        gap="30px"
      >
        {diagram.map((subdiagram, idx) => (
          <SubdiagramView key={idx} diagram={subdiagram} />
        ))}
        <Box
          className="memory-arrow-container"
          ref={arrowContainerRef}
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
        />
      </Box>
    </DiagramContext.Provider>
  );
}

const borderColor = "var(--palette-memory)";

function SubdiagramTextView({ text }: { text?: DiagramText }) {
  if (!text) return null;
  if (Object.values(text).filter((t) => t.label).length === 0) return null;
  return (
    <Stack mb={2} spacing={0.5}>
      <MDXLabel label={text.title} />
      <MDXLabel
        label={text.subtitle}
        sx={{ "& p": { fontSize: "0.875rem" } }}
      />
    </Stack>
  );
}

function SubdiagramView({ diagram }: { diagram: MemorySubDiagram }) {
  const context = React.useContext(DiagramContext);
  const subdiagramRef = React.useRef<HTMLDivElement | null>(null);
  return (
    <DiagramContext.Provider value={{ ...context, subdiagramRef }}>
      <Box
        className="memory-step"
        width={diagram.wide ? 1 : undefined}
        maxWidth={1}
      >
        <SubdiagramTextView text={diagram.text} />
        <Box
          display="flex"
          gap="60px"
          fontSize="0.95rem"
          lineHeight={1.25}
          ref={subdiagramRef}
        >
          {diagram.sections.map((section, idx) => (
            <Section key={idx} section={section} />
          ))}
        </Box>
      </Box>
    </DiagramContext.Provider>
  );
}

function Section({
  section: { label, type, frames },
}: {
  section: MemorySection;
}) {
  label ??= { label: type === SectionType.Stack ? "Stack" : "Heap" };
  return (
    <Box border={`1px dashed ${borderColor}`} padding={1} height="max-content">
      <MDXLabel
        label={label}
        sx={{ marginBottom: 0.5, "&, & *": { fontWeight: "bold" } }}
      />
      <Stack alignItems="center">
        <Stack spacing={0.5}>
          {frames.map((frame, idx) => (
            <ObjectValueView
              key={idx}
              value={{ ...frame, label: frame.label ?? frame.name }}
              path={frame.name ? [frame.name] : []}
            />
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}

type ValueProps<TKind> = {
  value: MemoryValue & { kind: TKind };
  path: MemoryLocation;
  arrayBorder?: boolean;
};

type DiagramContextObject = {
  diagramRef: React.RefObject<HTMLElement | null>;
  arrowContainerRef: React.RefObject<HTMLElement | null>;
  subdiagramRef?: React.RefObject<HTMLElement | null>;
};

const DiagramContext = React.createContext<DiagramContextObject>(
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  null as any
);

function ValueView(props: ValueProps<string>) {
  const { value } = props;
  switch (value.kind) {
    case "array":
      return <ArrayValueView {...props} value={value} />;
    case "literal":
      return <LiteralValueView {...props} value={value} />;
    case "object":
      return <ObjectValueView {...props} value={value} />;
    case "pointer":
      return <PointerValueView {...props} value={value} />;
  }
}

const TBody = styled("tbody")``;
const Tr = styled("tr")``;
const Td = styled("td")``;
const Span = styled("span")``;

function applyStyles(sx: SxProps, style?: NodeStyle) {
  return mergeNodeStyles({ sx }, style);
}

function ArrayValueView({
  value: { value, style },
  arrayBorder,
  path,
}: ValueProps<"array">) {
  return (
    <Box
      component="table"
      border={arrayBorder ? `1px solid ${borderColor}` : undefined}
      {...applyStyles(
        {
          borderCollapse: "collapse",
          "& > tbody > tr": {
            "& td": {
              paddingX: "4px",
              "&:not(:first-child)": {
                borderLeft: `1px solid ${borderColor}`,
              },
            },
          },
        },
        style?.node
      )}
    >
      <TBody {...style?.value}>
        <Tr data-ref={formatLocation(path)}>
          {value.map((elem, idx) => (
            <Td key={idx} data-connector="bottom" {...elem.style?.node}>
              <ValueView
                value={elem}
                arrayBorder={true}
                path={[...path, idx]}
              />
            </Td>
          ))}
        </Tr>
      </TBody>
    </Box>
  );
}

function ObjectValueView({
  value: { label, value, style, fields },
  path,
}: ValueProps<"object">) {
  return (
    <Box
      fontFamily={monospace.style.fontFamily}
      fontSize="0.875rem"
      whiteSpace="pre"
      {...style?.node}
    >
      <MDXLabel label={{ label }} />
      <Box
        component="table"
        {...applyStyles(
          {
            borderCollapse: "collapse",
            "& > tbody > tr > td": {
              border: `1px solid ${borderColor}`,
              paddingX: "4px",
              paddingY: "2px",
            },
          },
          style?.value
        )}
        data-ref={value.length === 0 ? formatLocation(path) : undefined}
      >
        <TBody>
          {value.map(({ name, label, value: elem }, idx) => (
            <Tr
              key={idx}
              {...elem.style?.row}
              data-ref={idx === 0 ? formatLocation(path) : undefined}
            >
              {fields && <Td {...elem.style?.name}>{label ?? name}</Td>}
              <Td {...elem.style?.node}>
                <ValueView value={elem} path={[...path, name]} />
              </Td>
            </Tr>
          ))}
        </TBody>
      </Box>
    </Box>
  );
}

function getSocket(el: Element | null) {
  while (el) {
    const socket = el.getAttribute("data-connector");
    if (socket) return socket as LeaderLine.SocketType;
    el = el.parentElement;
  }
  return undefined;
}

function PointerValueView({ value, path }: ValueProps<"pointer">) {
  const { diagramRef, arrowContainerRef, subdiagramRef } =
    React.useContext(DiagramContext);
  const src = React.useRef<HTMLElement | null>(null);
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

  // Unfortunately, attempting to straightforwardly import leader-line-new causes issues with Next.js prerendering
  // so we dynamically import the library here!
  const [LL, setLL] = React.useState<typeof LeaderLine | null>(null);
  React.useEffect(() => {
    (async () => {
      const LL = (await import("leader-line-new")).default;
      setLL(() => LL);
    })();
  }, []);

  React.useEffect(() => {
    if (
      !LL ||
      !value.value ||
      !diagramRef.current ||
      !arrowContainerRef.current ||
      !subdiagramRef?.current
    )
      return;
    const dst = subdiagramRef.current.querySelector(
      `[data-ref="${formatLocation(value.value)}"]`
    );
    if (!src.current || !dst) return;

    const { opacity: _, color: __, ...lineOptions } = value.style?.link ?? {};

    const options: LeaderLine.Options = merge(
      {
        color: getLineColor(),
        size: 1,
        endPlugSize: 2,
        startSocket: getSocket(src.current),
        endSocket: getSocket(dst),
        dash: value.style?.link?.dash ? { len: 8, gap: 4 } : undefined,
      } as LeaderLine.Options,
      lineOptions
    );

    const line = new LL(src.current, dst, options);

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
    <Span
      data-ref={formatLocation(path)}
      data-connector={
        typeof path[path.length - 1] === "number" ? "bottom" : "right"
      }
      ref={src}
      {...value.style?.value}
    >
      {value.value !== null ? "●" : "⦻"}
    </Span>
  );
}

function LiteralValueView({ value, path }: ValueProps<"literal">) {
  return (
    <Span data-ref={formatLocation(path)} {...value.style?.value}>
      {value.value}
    </Span>
  );
}

function MDXLabel({
  label,
  sx,
  className,
  ...boxProps
}: BoxProps & { label?: StyledLabel }) {
  if (!label || !label.label) return null;
  const style = mergeNodeStyles({ sx, className }, label.style);
  if (typeof label.label === "string")
    return (
      <Box {...boxProps} {...style}>
        {label.label}
      </Box>
    );
  return <MDXClient {...boxProps} {...style} {...label.label} noMargin />;
}
