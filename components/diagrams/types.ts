import { SxProps } from "@mui/material";
import LeaderLine from "leader-line-new";

export type MemoryDiagram = {
  stack: StackSection;
  heap: HeapSection;
};

export type StackSection = {
  label: string;
  frames: MemoryFrame[];
};

export type HeapSection = {
  label: string;
  statements: MemoryStatement[];
};

export type MemoryFrame = {
  label?: string;
  statements: MemoryStatement[];
};

export type Line = { source: string; no: number };

export type MemoryStatement = {
  label?: string;
  variable: string;
  value: MemoryValue;
  line?: Line;
};

export type MemoryValue = { style?: NodeStyle; id?: string } & (
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
  targetId?: string;
  linkStyles?: LeaderLine.Options;
};

export type MemoryLocation = (string | number)[];

export type NodeStyle = {
  className: string;
  sx: SxProps;
};
