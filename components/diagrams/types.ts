import { SxProps, Theme } from "@mui/material";
import LeaderLine from "leader-line-new";
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
  fields?: boolean;
};

export type MemoryFrame = {
  name?: string;
  value: ObjectValue;
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
  label?: string;
  value: ObjectField[];
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

export type ValueStyle = {
  node?: NodeStyle;
  value?: NodeStyle;
  name?: NodeStyle;
  row?: NodeStyle;
  link?: LeaderLine.Options;
};

export type NodeStyle = {
  className?: string;
  sx?: SxProps<Theme>;
};

export type StyledLabel = {
  label?: string | CompiledMDX;
  style?: NodeStyle;
};
