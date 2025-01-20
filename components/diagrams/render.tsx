"use client";

import React from "react";
import { PreContent } from "../pre";
import compileDiagram from "./compile";
import { MemoryDiagram, MemoryStatement, MemoryValue } from "./types";

import { Box, BoxProps, styled, Typography, useTheme } from "@mui/material";
import { monospace } from "@/app/theme";
import { merge } from "lodash";

import type LeaderLine from "leader-line-new";

export default function MemoryDiagramView({ content }: PreContent) {
  const diagram = React.useMemo(() => compileDiagram(content), [content]);
  const diagramRef = React.useRef<HTMLDivElement | null>(null);
  return (
    <DiagramContext.Provider value={{ diagramRef: diagramRef }}>
      <Box
        marginBottom={2}
        padding={2}
        className="memory-diagram"
        position="relative"
        overflow="auto"
        sx={{ backgroundColor: "var(--palette-background-memory)" }}
        ref={diagramRef}
      >
        <StepView diagram={diagram} />
      </Box>
    </DiagramContext.Provider>
  );
}

const borderColor = "var(--palette-memory)";

function StepView({ diagram }: { diagram: MemoryDiagram }) {
  return (
    <Box
      className="memory-step"
      display="flex"
      gap="60px"
      fontSize="0.95rem"
      lineHeight={1.25}
    >
      {diagram.stack.frames.length > 0 && (
        <Section label={diagram.stack.label} className="memory-section-stack">
          {diagram.stack.frames.map((frame, idx) => (
            <Frame
              key={idx}
              label={frame.label}
              section="stack"
              statements={frame.statements}
            />
          ))}
        </Section>
      )}
      {diagram.heap.statements.length > 0 && (
        <Section label={diagram.heap.label} className="memory-section-heap">
          <Frame statements={diagram.heap.statements} section="heap" />
        </Section>
      )}
    </Box>
  );
}

function Section({
  label,
  ...rest
}: BoxProps & {
  label: string;
}) {
  const { children, ...boxProps } = rest;
  return (
    <Box
      border={`1px dashed ${borderColor}`}
      padding={1}
      height="max-content"
      {...boxProps}
    >
      <Typography
        className="memory-header"
        fontWeight="bold"
        fontSize="0.95rem"
      >
        {label}
      </Typography>
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
    <FieldCollection
      fields={statements.map((s) => [s.label ?? s.variable, s.value])}
      section={section}
      label={label}
      fieldNames={section === "stack"}
    />
  );
}

type MemorySection = "stack" | "heap";

type ValueProps<TKind> = {
  value: MemoryValue & { kind: TKind };
  depth: number;
  section: MemorySection;
};

type DiagramScope = {
  diagramRef: React.RefObject<HTMLElement | null>;
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

function ArrayValueView({ value, depth, section }: ValueProps<"array">) {
  return (
    <Box
      component="table"
      border={depth > 0 ? `1px solid ${borderColor}` : undefined}
      sx={{
        borderCollapse: "collapse",
        "& > tbody > tr": {
          "& td": {
            paddingX: "4px",
            "&:not(:first-child)": {
              borderLeft: `1px solid ${borderColor}`,
            },
          },
        },
      }}
    >
      <tbody>
        <tr id={value.id}>
          {value.value.map((elem, idx) => (
            <Td
              key={idx}
              data-connector="bottom"
              sx={elem.style?.sx}
              className={elem.style?.className}
            >
              <ValueView value={elem} depth={depth + 1} section={section} />
            </Td>
          ))}
        </tr>
      </tbody>
    </Box>
  );
}

function ObjectValueView({ value, section }: ValueProps<"object">) {
  return (
    <FieldCollection
      fields={Object.entries(value.value)}
      section={section}
      label={value.type}
      fieldNames={true}
    />
  );
}

function getSocket(el: HTMLElement | null) {
  while (el) {
    const socket = el.getAttribute("data-connector");
    if (socket) return socket as LeaderLine.SocketType;
    el = el.parentElement;
  }
  return undefined;
}

function PointerValueView({ value }: ValueProps<"pointer">) {
  const { diagramRef } = React.useContext(DiagramContext);
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
    if (!LL) return;
    if (!value.targetId) return;
    if (!diagramRef.current) return;
    const dst = document.getElementById(value.targetId);
    if (!src.current || !dst) return;

    const options: LeaderLine.Options = merge(
      {
        color: theme.palette.text.primary,
        size: 1,
        endPlugSize: 2,
        startSocket: getSocket(src.current),
        endSocket: getSocket(dst),
        dash: value.linkStyles?.dash ? { len: 8, gap: 4 } : undefined,
      } as LeaderLine.Options,
      value.linkStyles
    );

    const line = new LL(src.current, dst, options);

    // Reposition the line on diagram overflow scroll
    const onScroll = () => line.position();
    diagramRef.current.addEventListener("scroll", onScroll);
    return () => {
      line.remove();
      diagramRef.current?.removeEventListener("scroll", onScroll);
    };
  }, [LL, theme, value]);

  return (
    <Span
      id={value.id}
      ref={src}
      sx={value.style?.sx}
      className={value.style?.className}
    >
      {value.value !== null ? "●" : "⦻"}
    </Span>
  );
}

function LiteralValueView({ value }: ValueProps<"literal">) {
  return (
    <Span id={value.id} sx={value.style?.sx} className={value.style?.className}>
      {value.value}
    </Span>
  );
}

function FieldCollection({
  fields,
  section,
  label,
  fieldNames,
}: {
  fields: [string, MemoryValue][];
  section: MemorySection;
  label?: string;
  fieldNames: boolean;
}) {
  return (
    <Box
      fontFamily={monospace.style.fontFamily}
      fontSize="0.875rem"
      whiteSpace="pre"
    >
      {label && (
        <span style={{ fontFamily: monospace.style.fontFamily }}>{label}</span>
      )}
      <Box
        component="table"
        sx={{
          borderCollapse: "collapse",
          "& > tbody > tr > td": {
            border: `1px solid ${borderColor}`,
            paddingX: "4px",
            paddingY: "2px",
          },
        }}
      >
        <tbody>
          {fields.map(([name, value], idx) => (
            <Tr
              key={idx}
              sx={value.style?.sx}
              className={value.style?.className}
            >
              {fieldNames && <td>{name}</td>}
              <td data-connector={section === "stack" ? "right" : "left"}>
                <ValueView depth={0} value={value} section={section} />
              </td>
            </Tr>
          ))}
        </tbody>
      </Box>
    </Box>
  );
}
