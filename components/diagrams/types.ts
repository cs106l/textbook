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
  assignments: MemoryAssignment[];
};

export type MemoryFrame = {
  label?: string;
  assignments: MemoryAssignment[];
};

export type MemoryAssignment = {
  label?: string;
  variable: string;
  value: MemoryValue;
};

export type MemoryValue = { style?: NodeStyle } & (
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

export type NodeStyle = {
  classNames: string[];
};
