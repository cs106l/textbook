"use client";

import React from "react";
import { PreContent } from "../pre";
import compileDiagram from "./compile";
import {
  ArrayValue,
  LiteralValue,
  MemoryDiagram,
  MemoryStatement,
  MemoryValue,
  ObjectValue,
  PointerValue,
} from "./types";

import { Box, BoxProps, Typography } from "@mui/material";
import { monospace } from "@/app/theme";

export default function MemoryDiagramView({ content }: PreContent) {
  const diagram = React.useMemo(() => compileDiagram(content), [content]);
  return (
    <Box
      marginBottom={2}
      padding={2}
      className="memory-diagram"
      position="relative"
      overflow="auto"
      sx={{ backgroundColor: "var(--palette-background-memory)" }}
    >
      <StepView diagram={diagram} />
    </Box>
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
              includeFieldLabels
              statements={frame.statements}
            />
          ))}
        </Section>
      )}
      {diagram.heap.statements.length > 0 && (
        <Section label={diagram.heap.label} className="memory-section-heap">
          <Frame statements={diagram.heap.statements} />
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
  includeFieldLabels,
  statements,
}: {
  label?: string;
  includeFieldLabels?: boolean;
  statements: MemoryStatement[];
}) {
  return (
    <Box
      className="memory-frame"
      fontFamily={monospace.style.fontFamily}
      fontSize="0.875rem"
      whiteSpace="pre"
    >
      {label && (
        <span
          className="memory-frame-header"
          style={{ fontFamily: monospace.style.fontFamily }}
        >
          {label}
        </span>
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
          {statements.map((s) => (
            <tr key={s.variable}>
              {includeFieldLabels && <td>{s.label}</td>}
              <td>
                <ValueView depth={0} value={s.value} />
              </td>
            </tr>
          ))}
        </tbody>
      </Box>
    </Box>
  );
}

type ValueProps<TValue> = { value: TValue; depth: number };

function ValueView(props: ValueProps<MemoryValue>) {
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

function ArrayValueView({ value, depth }: ValueProps<ArrayValue>) {
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
        <tr>
          {value.value.map((elem, idx) => (
            <td key={idx}>
              <ValueView value={elem} depth={depth + 1} />
            </td>
          ))}
        </tr>
      </tbody>
    </Box>
  );
}

function ObjectValueView({ value }: ValueProps<ObjectValue>) {
  return (
    <Box
      className="memory-frame"
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
          {Object.entries(value.value).map(([key, val]) => (
            <tr key={key}>
              <td>{key}</td>
              <td>
                <ValueView depth={0} value={val} />
              </td>
            </tr>
          ))}
        </tbody>
      </Box>
    </Box>
  );
}

function PointerValueView({ value }: ValueProps<PointerValue>) {
  return <span>{value.value !== null ? "●" : "⦻"}</span>;
}

function LiteralValueView({ value }: ValueProps<LiteralValue>) {
  return value.value;
}
