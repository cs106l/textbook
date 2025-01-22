"use client";

import React from "react";
import { PreContent } from "../pre";
import { formatLocation, mergeNodeStyles } from "./compile";
import {
  DiagramText,
  MemoryDiagram,
  MemoryFrame,
  MemoryLocation,
  MemorySection,
  MemorySubDiagram,
  MemoryValue,
  NodeStyle,
  StyledLabel,
} from "./types";

import { Box, BoxProps, Stack, styled, SxProps, useTheme } from "@mui/material";
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
  const { diagramRef } = React.useContext(DiagramContext);
  const subdiagramRef = React.useRef<HTMLDivElement | null>(null);
  return (
    <DiagramContext.Provider value={{ diagramRef, subdiagramRef }}>
      <Box className="memory-step" width={diagram.wide ? 1 : undefined}>
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

function Section({ section }: { section: MemorySection }) {
  return (
    <Box border={`1px dashed ${borderColor}`} padding={1} height="max-content">
      <MDXLabel
        label={section.label}
        sx={{ marginBottom: 0.5, "& p": { fontWeight: "bold" } }}
      />
      <Stack spacing={0.5} alignItems="center">
        {section.frames.map((frame, idx) => (
          <Frame key={idx} section={section} frame={frame} />
        ))}
      </Stack>
    </Box>
  );
}

function Frame({
  section,
  frame,
}: {
  section: MemorySection;
  frame: MemoryFrame;
}) {
  return (
    <ObjectValueView
      value={frame.value}
      path={frame.name ? [frame.name] : []}
      fields={section.fields}
    />
  );
}

type ValueProps<TKind> = {
  value: MemoryValue & { kind: TKind };
  path: MemoryLocation;
  arrayBorder?: boolean;
};

type DiagramContextObject = {
  diagramRef: React.RefObject<HTMLElement | null>;
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
      return <ObjectValueView {...props} value={value} fields={true} />;
    case "pointer":
      return <PointerValueView {...props} value={value} />;
  }
}

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
        style?.value
      )}
    >
      <tbody>
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
      </tbody>
    </Box>
  );
}

function ObjectValueView({
  value: { label, value, style },
  path,
  fields,
}: ValueProps<"object"> & { fields?: boolean }) {
  return (
    <Box
      fontFamily={monospace.style.fontFamily}
      fontSize="0.875rem"
      whiteSpace="pre"
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
        <tbody>
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
  });

  return (
    <Span
      data-ref={formatLocation(path)}
      data-connector="right"
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
