import { SxProps } from "@mui/material";
import LeaderLine from "leader-line-new";

export type MemoryDiagram = MemorySubDiagram[];

export type MemorySubDiagram = {
  title?: string;
  subtitle?: string;
  stack: StackSection;
  heap: HeapSection;
};

export type StackSection = {
  label: string;
  frames: MemoryFrame[];
};

export type HeapSection = {
  label: string;
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
  linkStyles?: LeaderLine.Options;
};

export type MemoryLocation = (string | number)[];

export type ValueStyle = {
  all?: NodeStyle;
  label?: NodeStyle;
  value?: NodeStyle;
  link?: LeaderLine.Options;
};

export type NodeStyle = {
  className?: string;
  sx?: SxProps;
};
