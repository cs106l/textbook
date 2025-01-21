"use client";

import React from "react";
import { PreContent } from "../pre";
import { formatLocation, mergeNodeStyles } from "./compile";
import {
  MemoryDiagram,
  MemoryLocation,
  MemoryStatement,
  MemorySubDiagram,
  MemoryValue,
  NodeStyle,
  StyledLabel,
} from "./types";

import { Box, BoxProps, styled, SxProps, useTheme } from "@mui/material";
import { monospace } from "@/app/theme";
import { merge } from "lodash";

import type LeaderLine from "leader-line-new";
import { MDXClient } from "../mdx/client";
import { mergeSx } from "merge-sx";

export default function MemoryDiagramView({ content }: PreContent) {
  const diagram = React.useMemo<MemoryDiagram>(
    () => JSON.parse(content),
    [content]
  );
  const diagramRef = React.useRef<HTMLDivElement | null>(null);
  return (
    <DiagramContext.Provider value={{ diagramRef }}>
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
      </Box>
    </DiagramContext.Provider>
  );
}

const borderColor = "var(--palette-memory)";

function SubdiagramView({ diagram }: { diagram: MemorySubDiagram }) {
  const { diagramRef } = React.useContext(DiagramContext);
  const subdiagramRef = React.useRef<HTMLDivElement | null>(null);
  return (
    <DiagramContext.Provider value={{ diagramRef, subdiagramRef }}>
      <Box
        className="memory-step"
        width={diagram.layout === "wide" ? 1 : undefined}
      >
        {(diagram.labels.title?.label || diagram.labels.subtitle?.label) && (
          <Box mb={2}>
            <MDXLabel
              content={diagram.labels.title}
              sx={{ marginBottom: 0.5 }}
            />
            <MDXLabel
              content={diagram.labels.subtitle}
              sx={{ "& p": { fontSize: "0.875rem" } }}
            />
          </Box>
        )}
        <Box
          display="flex"
          gap="60px"
          fontSize="0.95rem"
          lineHeight={1.25}
          ref={subdiagramRef}
        >
          {diagram.stack.length > 0 && (
            <Section
              label={diagram.labels.stack}
              className="memory-section-stack"
            >
              {diagram.stack.map((frame, idx) => (
                <Frame
                  key={idx}
                  label={frame.label}
                  section="stack"
                  statements={frame.statements}
                />
              ))}
            </Section>
          )}
          {diagram.heap.length > 0 && (
            <Section
              label={diagram.labels.heap}
              className="memory-section-heap"
            >
              <Frame statements={diagram.heap} section="heap" />
            </Section>
          )}
        </Box>
      </Box>
    </DiagramContext.Provider>
  );
}

function Section({
  label,
  ...rest
}: BoxProps & {
  label?: StyledLabel;
}) {
  const { children, ...boxProps } = rest;
  return (
    <Box
      border={`1px dashed ${borderColor}`}
      padding={1}
      height="max-content"
      {...boxProps}
    >
      {label?.label && (
        <Box marginBottom={0.5} sx={{ "& p": { fontWeight: "bold" } }}>
          <MDXLabel content={label} />
        </Box>
      )}
      {children}
    </Box>
  );
}

function Frame({
  label,
  statements,
  section,
}: {
  label?: string;
  statements: MemoryStatement[];
  section: MemorySection;
}) {
  return (
    <ObjectValueView
      value={{
        kind: "object",
        value: statements.map((s) => [s.variable, s.value] as const),
        type: label,
      }}
      depth={0}
      section={section}
      path={[]}
      labelMapping={Object.fromEntries(
        statements.map((s) => [s.variable, s.label || s.variable])
      )}
      hideLabels={section === "heap"}
    />
  );
}

type MemorySection = "stack" | "heap";

type ValueProps<TKind> = {
  value: MemoryValue & { kind: TKind };
  depth: number;
  section: MemorySection;
  path: MemoryLocation;
};

type DiagramScope = {
  diagramRef: React.RefObject<HTMLElement | null>;
  subdiagramRef?: React.RefObject<HTMLElement | null>;
};

const DiagramContext = React.createContext<DiagramScope>(
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  null as any
);

function ValueView(props: ValueProps<string>) {
  if (props.value.kind === "array")
    return <ArrayValueView {...props} value={props.value} />;
  if (props.value.kind === "literal")
    return <LiteralValueView {...props} value={props.value} />;
  if (props.value.kind === "object")
    return <ObjectValueView {...props} value={props.value} />;
  if (props.value.kind === "pointer")
    return <PointerValueView {...props} value={props.value} />;
  return null;
}

const Tr = styled("tr")``;
const Td = styled("td")``;
const Span = styled("span")``;

function applyStyles(sx: SxProps, style?: NodeStyle) {
  return mergeNodeStyles({ sx }, style);
}

function ArrayValueView({ value, depth, section, path }: ValueProps<"array">) {
  return (
    <Box
      component="table"
      border={depth > 0 ? `1px solid ${borderColor}` : undefined}
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
        value.style?.value
      )}
    >
      <tbody>
        <Tr data-ref={formatLocation(path)}>
          {value.value.map((elem, idx) => (
            <Td key={idx} data-connector="bottom" {...elem.style?.node}>
              <ValueView
                value={elem}
                depth={depth + 1}
                section={section}
                path={[...path, idx]}
              />
            </Td>
          ))}
        </Tr>
      </tbody>
    </Box>
  );
}

function ObjectValueView({
  value,
  section,
  path,
  labelMapping,
  hideLabels,
}: ValueProps<"object"> & {
  labelMapping?: Record<string, string>;
  hideLabels?: boolean;
}) {
  return (
    <Box
      fontFamily={monospace.style.fontFamily}
      fontSize="0.875rem"
      whiteSpace="pre"
    >
      {value.type && (
        <span style={{ fontFamily: monospace.style.fontFamily }}>
          {value.type}
        </span>
      )}
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
          value.style?.value
        )}
        data-ref={formatLocation(path)}
      >
        <tbody>
          {value.value.map(([name, elem], idx) => (
            <Tr key={idx} {...elem.style?.row}>
              {!hideLabels && (
                <Td {...elem.style?.name}>{labelMapping?.[name] || name}</Td>
              )}
              <Td
                data-connector={section === "stack" ? "right" : "left"}
                {...elem.style?.node}
              >
                <ValueView
                  depth={0}
                  value={elem}
                  section={section}
                  path={[...path, name]}
                />
              </Td>
            </Tr>
          ))}
        </tbody>
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
  const { diagramRef, subdiagramRef } = React.useContext(DiagramContext);
  const src = React.useRef<HTMLElement | null>(null);
  const theme = useTheme();

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
    if (!LL || !value.value || !diagramRef.current || !subdiagramRef?.current)
      return;
    const dst = subdiagramRef.current.querySelector(
      `[data-ref="${formatLocation(value.value)}"]`
    );
    if (!src.current || !dst) return;

    const options: LeaderLine.Options = merge(
      {
        color: theme.palette.text.primary,
        size: 1,
        endPlugSize: 2,
        startSocket: getSocket(src.current),
        endSocket: getSocket(dst),
        dash: value.style?.link?.dash ? { len: 8, gap: 4 } : undefined,
      } as LeaderLine.Options,
      value.style?.link
    );

    const line = new LL(src.current, dst, options);

    // Reposition the line on diagram overflow scroll
    const diagram = diagramRef.current;
    const onScroll = () => line.position();
    diagram.addEventListener("scroll", onScroll);

    return () => {
      line.remove();
      diagram.removeEventListener("scroll", onScroll);
    };
  }, [LL, theme, value, diagramRef, subdiagramRef]);

  return (
    <Span data-ref={formatLocation(path)} ref={src} {...value.style?.value}>
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

function MDXLabel({ content, sx }: { content?: StyledLabel; sx?: SxProps }) {
  if (!content) return null;
  const style: NodeStyle = {
    ...content.style,
    sx: mergeSx(sx, content?.style?.sx),
  };
  if (typeof content.label === "string")
    return <Box {...style}>{content.label}</Box>;
  return <MDXClient {...style} {...content.label} noMargin />;
}
