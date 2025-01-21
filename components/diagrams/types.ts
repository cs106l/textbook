import { SxProps } from "@mui/material";
import LeaderLine from "leader-line-new";
import { CompiledMDX } from "../mdx";

export type MemoryDiagram = MemorySubDiagram[];

export type MemorySubDiagram = {
  labels: DiagramLabels;
  stack: MemoryFrame[];
  heap: MemoryStatement[];
  layout: "fit-content" | "wide";
};

export type StyledLabel = {
  label: string | CompiledMDX;
  style?: NodeStyle;
};

export type DiagramLabels = {
  stack?: StyledLabel;
  heap?: StyledLabel;
  title?: StyledLabel;
  subtitle?: StyledLabel;
};

export type MemoryFrame = {
  label?: string;
  statements: MemoryStatement[];
};

export type MemoryStatement = {
  label?: string;
  variable: string;
  value: MemoryValue;
};

export type MemoryValue = { style?: ValueStyle } & (
  | LiteralValue
  | ArrayValue
  | ObjectValue
  | PointerValue
);

export type LiteralValue = {
  kind: "literal";
  value: string;
};

export type ArrayValue = {
  kind: "array";
  value: MemoryValue[];
};

export type ObjectValue = {
  kind: "object";
  type?: string;
  value: Record<string, MemoryValue>;
};

export type PointerValue = {
  kind: "pointer";
  value: MemoryLocation | null;
};

export type MemoryLocation = (string | number)[];

export type ValueStyle = {
  node?: NodeStyle;
  value?: NodeStyle;
  name?: NodeStyle;
  row?: NodeStyle;
  link?: LeaderLine.Options;
};

export type NodeStyle = {
  className?: string;
  sx?: SxProps;
};
