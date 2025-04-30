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

import { Box, BoxProps, Stack, styled, SxProps } from "@mui/material";
import { monospace } from "@/app/theme";
import { MDXClient } from "../mdx/client";
import dynamic from "next/dynamic";

const PointerLine = dynamic(() => import("@/components/diagrams/pointer"), {
  ssr: false,
});

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
        sx={{
          backgroundColor: "var(--palette-background-memory)",
          overflowY: "hidden",
        }}
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
  const context = useDiagram();
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

export type ValueProps<TKind> = {
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

export function useDiagram() {
  const context = React.useContext(DiagramContext);
  if (!context) throw new Error("Using `useDiagram()` outside of a diagram");
  return context;
}

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

function LiteralValueView({ value, path }: ValueProps<"literal">) {
  return (
    <Span data-ref={formatLocation(path)} {...value.style?.value}>
      {value.value}
    </Span>
  );
}

function PointerValueView({ value, path }: ValueProps<"pointer">) {
  const ref = React.useRef<HTMLElement | null>(null);
  return (
    <span
      data-ref={formatLocation(path)}
      data-connector={
        typeof path[path.length - 1] === "number" ? "bottom" : "right"
      }
      ref={ref}
      {...value.style?.value}
    >
      {value.value !== null ? "●" : "⦻"}
      <PointerLine value={value} ref={ref} />
    </span>
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
