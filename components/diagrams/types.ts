import { SxProps } from "@mui/material";
import LeaderLine from "leader-line-new";
import { CompiledMDX } from "../mdx";

export type MemoryDiagram = MemorySubDiagram[];

export type MemorySubDiagram = {
  title?: string | CompiledMDX;
  subtitle?: string | CompiledMDX;
  stack: StackSection;
  heap: HeapSection;
  layout: "fit-content" | "wide";
};

export type StackSection = {
  label: string | CompiledMDX;
  frames: MemoryFrame[];
};

export type HeapSection = {
  label: string | CompiledMDX;
  allocations: MemoryStatement[];
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
  label?: NodeStyle;
  row?: NodeStyle;
  link?: LeaderLine.Options;
};

export type NodeStyle = {
  className?: string;
  sx?: SxProps;
};
