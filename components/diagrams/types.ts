import { SxProps, Theme } from "@mui/material";
import { CompiledMDX } from "../mdx";

export type MemoryDiagram = MemorySubDiagram[];

export type MemorySubDiagram = {
  text?: DiagramText;
  sections: MemorySection[];
  wide?: boolean;
};

export type DiagramText = {
  title?: StyledLabel;
  subtitle?: StyledLabel;
};

export type MemorySection = {
  label?: StyledLabel;
  frames: MemoryFrame[];
  type: SectionType;
};

export enum SectionType {
  Stack,
  Heap,
}

export type MemoryFrame = MemoryValue & { kind: "object"; name?: string };

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
  label?: string;
  value: ObjectField[];
  fields?: boolean;
};

export type ObjectField = {
  name: string;
  label?: string;
  value: MemoryValue;
};

export type PointerValue = {
  kind: "pointer";
  value: MemoryLocation | null;
};

export type MemoryLocation = (string | number)[];

export type LineStyle = LeaderLine.Options & { opacity?: number };

export type ValueStyle = {
  node?: NodeStyle;
  value?: NodeStyle;
  name?: NodeStyle;
  row?: NodeStyle;
  link?: LineStyle;
};

export type NodeStyle = {
  className?: string;
  sx?: SxProps<Theme>;
};

export type StyledLabel = {
  label?: string | CompiledMDX;
  style?: NodeStyle;
};
