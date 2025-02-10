import {
  MemoryDiagram,
  MemoryLocation,
  MemoryValue,
  ValueStyle,
  MemorySubDiagram,
  NodeStyle,
  StyledLabel,
  MemoryFrame,
  ObjectField,
  MemorySection,
  DiagramText,
  SectionType,
} from "./types";

import { mergeSx } from "merge-sx";

import grammar from "./grammar.ohm-bundle";
import { Interval, NonterminalNode } from "ohm-js";
import { merge } from "lodash";
import { serializeMDX } from "../mdx";

export default async function compileDiagram(
  content: string
): Promise<MemoryDiagram> {
  const result = grammar.match(content);
  if (result.failed()) parseError(result.message);
  const diagram: MemoryDiagram = semantics(result).toDiagram();

  // Compile text markdown fragments using remote-mdx
  const compileLabel = async (label?: StyledLabel) => {
    if (!label) return;
    if (typeof label.label === "string")
      label.label = await serializeMDX(label.label);
  };

  for (const subdiagram of diagram) {
    for (const label of Object.values(subdiagram.text ?? {}))
      await compileLabel(label);
    for (const section of subdiagram.sections)
      await compileLabel(section.label);
  }

  return diagram;
}

function getSourceContext(source?: Interval): string {
  if (!source) return "";
  const { lineNum, colNum } = source.getLineAndColumn();
  return ` at line ${lineNum}, column ${colNum}`;
}

function parseError(message: string = "", source?: Interval): never {
  const context = getSourceContext(source);
  throw new Error(`Error parsing diagram${context}:\n\n${message}`);
}

function processDirective(
  diagram: MemorySubDiagram,
  directive: Directive,
  sectionLabels: SectionLabelsMap,
  source: Interval
) {
  if (directive.kind === "label") {
    const labels = locateLabels(diagram, directive.section, sectionLabels);
    labels.forEach((l) => (l.label = directive.label));
    return;
  }

  if (directive.kind === "style") {
    if (directive.type === "node") {
      for (const location of directive.location) {
        const values = locateValues(diagram, location, source);
        values.forEach(
          (v) => (v.style = mergeStyles(v.style, directive.style))
        );
      }
    } else {
      for (const location of directive.location) {
        const labels = locateLabels(diagram, location, sectionLabels);
        labels.forEach(
          (l) => (l.style = mergeNodeStyles(l.style, directive.style))
        );
      }
    }
  }

  if (directive.kind === "layout") {
    // Currently the #layout directive can only do one thing,
    // but may consider expanding this in the future
    diagram.wide = true;
  }
}

/** Given a section label of the form '=>', '==>', tracks the corresponding section index in `subdiagram.sections` */
type SectionLabelsMap = Map<string, number>;

function locateLabels(
  diagram: MemorySubDiagram,
  labelLocation: string,
  sectionLabels: SectionLabelsMap
): StyledLabel[] {
  if (["title", "subtitle"].includes(labelLocation)) {
    diagram.text ??= {};
    return [(diagram.text[labelLocation as keyof DiagramText] ??= {})];
  }
  if (labelLocation === "stack")
    return diagram.sections
      .filter((s) => s.type === SectionType.Stack)
      .map((s) => (s.label ??= {}));
  if (labelLocation === "heap")
    return diagram.sections
      .filter((s) => s.type === SectionType.Heap)
      .map((s) => (s.label ??= {}));

  // =>, ==>, etc. refer to the labels of their corresponding sections
  const idx = sectionLabels.get(labelLocation);
  if (!idx) return [];
  if (idx < 0 || idx >= diagram.sections.length) return [];
  return [(diagram.sections[idx].label ??= {})];
}

export function mergeNodeStyles(
  a?: NodeStyle,
  b?: NodeStyle
): NodeStyle | undefined {
  if (!a) return b;
  if (!b) return a;
  return {
    className: [a.className, b.className]
      .map((cn) => cn?.trim())
      .filter(Boolean)
      .join(" "),
    sx: mergeSx(a.sx, b.sx),
  };
}

function mergeStyles(
  existing: ValueStyle | undefined,
  newStyle: ValueStyle
): ValueStyle {
  return {
    node: mergeNodeStyles(existing?.node, newStyle.node),
    value: mergeNodeStyles(existing?.value, newStyle.value),
    name: mergeNodeStyles(existing?.name, newStyle.name),
    row: mergeNodeStyles(existing?.row, newStyle.row),
    link: merge(existing?.link, newStyle.link),
  };
}

/** Given a (global) variable name, returns the corresponding value */
type GlobalsMap = Map<string, MemoryValue>;

function locateValues(
  diagram: MemorySubDiagram,
  loc: MemoryLocationSliced,
  source?: Interval
): MemoryValue[] {
  /* First determine global values for this section */
  const globals: GlobalsMap = new Map();
  for (const section of diagram.sections) {
    for (const frame of section.frames) {
      if (frame.name) globals.set(frame.name, frame);
      else for (const { name, value } of frame.value) globals.set(name, value);
    }
  }

  const values: MemoryValue[] = [];
  locateValuesRec(globals, loc, 0, values, source);
  return values;
}

function locateValuesRec(
  globals: GlobalsMap,
  loc: MemoryLocationSliced,
  idx: number,
  values: MemoryValue[],
  source?: Interval,
  parentPath: MemoryLocation = [],
  parent?: MemoryValue
): void {
  /* Failure function if parsing from a parent node fails */
  const fail = (msg: string) =>
    parseError(
      `In reference &${formatLocation(loc)}, ${msg.replaceAll(
        "{}",
        formatLocation(parentPath)
      )}`,
      source
    );

  if (loc.length === 0)
    throw new Error("Internal error: location has length 0");
  if (idx === 0) {
    if (typeof loc[0] !== "string")
      throw new Error(
        `Internal error: first part of ${formatLocation(loc)} is not a variable`
      );
    const variable = globals.get(loc[0]);
    if (!variable)
      return parseError(
        `Variable ${loc[0]} referenced by &${formatLocation(
          loc
        )} does not exist`,
        source
      );
    return locateValuesRec(
      globals,
      loc,
      idx + 1,
      values,
      source,
      [loc[0]],
      variable
    );
  }

  if (!parent) throw new Error("Internal error: missing parent");
  if (idx >= loc.length) return void values.push(parent);

  const segment = loc[idx];

  /* Universal member access */
  if (segment === "*") {
    if (parent.kind === "object") {
      for (const { name, value } of parent.value) {
        locateValuesRec(
          globals,
          loc,
          idx + 1,
          values,
          source,
          [...parentPath, name],
          value
        );
      }
    } else if (parent.kind === "array") {
      for (let arrIdx = 0; arrIdx < parent.value.length; arrIdx++) {
        locateValuesRec(
          globals,
          loc,
          idx + 1,
          values,
          source,
          [...parentPath, arrIdx],
          parent.value[arrIdx]
        );
      }
    } else
      fail(
        `Cannot take universal member access (*) of non-array, non-object value {} of type ${parent.kind}`
      );
    return;
  }

  /* Member access */
  if (typeof segment === "string") {
    if (parent.kind !== "object")
      return fail(`cannot reference field "${segment}" of non-object value {}`);
    const nextValue = parent.value.find(({ name }) => name === segment);
    if (!nextValue)
      return fail(`field "${segment}" does not exist in object {}`);
    return locateValuesRec(
      globals,
      loc,
      idx + 1,
      values,
      source,
      [...parentPath, segment],
      nextValue.value
    );
  }

  /* Array subscript */
  if (typeof segment === "number") {
    if (parent.kind !== "array" && parent.kind !== "object")
      return fail(
        `cannot reference index ${segment} of non-array, non-object value {}`
      );

    const length = parent.value.length;
    if (segment < -length || segment >= length)
      return fail(
        `index ${segment} is out of bounds for array {} of length ${length}`
      );

    const valueIdx = segment < 0 ? segment + length : segment;
    const value =
      parent.kind === "array"
        ? parent.value[valueIdx]
        : parent.value[valueIdx].value;

    return locateValuesRec(
      globals,
      loc,
      idx + 1,
      values,
      source,
      [...parentPath, segment],
      value
    );
  }

  /* Array slice */
  if (typeof segment === "object") {
    const fmt = formatSlice(segment);
    if (parent.kind !== "array" && parent.kind !== "object")
      return fail(`cannot take slice ${fmt} of non-array, non-object value {}`);

    const length = parent.value.length;
    let { start, end, stride } = segment;
    start ??= 0;
    end ??= length;
    stride ??= 1;

    start = start < 0 ? Math.max(length + start, 0) : Math.min(start, length);
    end = end < 0 ? Math.max(length + end, 0) : Math.min(end, length);

    const indices: number[] = [];
    if (stride > 0) {
      for (let i = start; i < end; i += stride) indices.push(i);
    } else {
      for (let i = start; i > end; i += stride) indices.push(i);
    }

    for (const sliceIdx of indices) {
      locateValuesRec(
        globals,
        loc,
        idx + 1,
        values,
        source,
        [...parentPath, sliceIdx],
        parent.kind === "array"
          ? parent.value[sliceIdx]
          : parent.value[sliceIdx].value
      );
    }

    return;
  }

  throw new Error("Internal error: invalid location part/unhandled type");
}

export function formatLocation(loc: MemoryLocationSliced): string {
  if (loc.length === 0) return "";
  return (
    loc[0] +
    loc
      .slice(1)
      .map((l) => {
        if (typeof l === "string") return `.${l}`;
        if (typeof l === "number") return `[${l}]`;
        return formatSlice(l);
      })
      .join("")
  );
}

function formatSlice(l: LocationSlice): string {
  if (l.stride) return `[${l.start ?? ""}:${l.end ?? ""}:${l.stride}]`;
  return `[${l.start ?? ""}:${l.end ?? ""}]`;
}

/* ========================================================================= */
/* Helper types for compilation                                              */
/* ========================================================================= */

type Line = StatementLine | DirectiveLine;
type StatementLine = {
  kind: "statement";
  symbol: string;
  depth: number;
  field: ObjectField;
};
type DirectiveLine = { kind: "directive"; directive: Directive };
type LineInfo = { line: Line; source: Interval };
type BasicBlock = {
  name?: string;
  label?: string;
  lines: LineInfo[];
  source: Interval;
};

type MemoryLocationSliced = (string | number | LocationSlice)[];
type LocationSlice = { start?: number; end?: number; stride?: number };

type Directive = LabelDirective | StyleDirective | LayoutDirective;
type LabelDirective = {
  kind: "label";
  section: string;
  label: string;
};
type StyleDirective = NodeStyleDirective | LabelStyleDirective;
type NodeStyleDirective = {
  kind: "style";
  type: "node";
  location: MemoryLocationSliced[];
  style: ValueStyle;
};
type LabelStyleDirective = {
  kind: "style";
  type: "label";
  location: string[];
  style: NodeStyle;
};
type LayoutDirective = {
  kind: "layout";
  layout: "wide";
};

/* ========================================================================= */
/* Grammar semantics                                                         */
/* ========================================================================= */

const semantics = grammar.createSemantics();

function buildSections(
  blocks: BasicBlock[]
): [MemorySection[], SectionLabelsMap] {
  const sections: MemorySection[] = [];
  const sectionLabels: SectionLabelsMap = new Map();

  const sectionDepths = new Set<number>(
    blocks.flatMap((b) =>
      b.lines
        .map((l) => l.line)
        .filter((l) => l.kind === "statement")
        .map((l) => l.depth)
    )
  );

  // Named blocks guarantee the existence of a stack section
  blocks.forEach((b) => b.name && sectionDepths.add(0));

  let index = 0;
  for (const depth of [...sectionDepths].sort()) {
    sections.push({
      frames: [],
      type: depth === 0 ? SectionType.Stack : SectionType.Heap,
    });
    if (depth === 0) sectionLabels.set("=", index);
    else sectionLabels.set(`${"=".repeat(depth)}>`, index);
    index++;
  }

  return [sections, sectionLabels];
}

semantics.addOperation<MemoryDiagram>("toDiagram()", {
  Diagram_multi(subdiagrams) {
    return subdiagrams.children.map((n) => n.toSubDiagram());
  },

  Diagram_single(lines) {
    return [lines.toSubDiagram()];
  },
});

semantics.addOperation<MemorySubDiagram>("toSubDiagram()", {
  SubDiagram(identifier, _, frames, __) {
    const diagram: MemorySubDiagram = frames.toSubDiagram();
    return {
      // Format title with `` so it looks like code by default
      ...diagram,
      text: {
        title: { label: `\`${identifier.asString()}\`` },
        ...diagram.text,
      },
    };
  },

  Frames(orphanLines, frames) {
    const orphanBlock: BasicBlock = orphanLines.toBasicBlock();
    const blocks: BasicBlock[] = [
      orphanBlock,
      ...frames.children.map((n) => n.toBasicBlock()),
    ];

    const [sections, sectionLabels] = buildSections(blocks);
    const diagram: MemorySubDiagram = { sections };
    const globals = new Map<string, Interval>();
    const directives: LineInfo[] = [];

    const addGlobal = (name: string, source: Interval) => {
      if (globals.has(name))
        parseError(
          `A variable or frame with name ${name} was already defined${getSourceContext(
            globals.get(name)
          )}`,
          source
        );
      globals.set(name, source);
    };

    for (const block of blocks) {
      // The frame for this block. May not exist yet
      let _stackFrame: MemoryFrame | null = null;
      const getOrCreateFrame = (line?: StatementLine): MemoryFrame => {
        if (!line || line.depth === 0) {
          if (_stackFrame) return _stackFrame;
          const stack = sections.find((s) => s.type === SectionType.Stack);
          if (!stack) throw new Error("Internal error: missing stack section");
          _stackFrame = {
            kind: "object",
            fields: true,
            name: block.name,
            label: block.label,
            value: [],
          };
          stack.frames.push(_stackFrame);
          return _stackFrame;
        }

        const sectionIdx = sectionLabels.get(line.symbol);
        if (!sectionIdx)
          throw new Error(
            `Internal error: missing heap section index for statement symbol ${line.symbol}`
          );

        const heap = sections[sectionIdx];
        if (heap.frames.length === 0)
          heap.frames.push({ kind: "object", value: [] });
        return heap.frames[0];
      };

      // Every named frame should appear, even if it's empty
      // Note that this is not true for the orphan frame, which is allocated on demand
      //
      // In addition, named frames pollute the global scope
      if (block.name) {
        getOrCreateFrame();
        addGlobal(block.name, block.source);
      }

      for (const lineInfo of block.lines) {
        const { line, source } = lineInfo;
        if (line.kind === "directive") {
          directives.push(lineInfo);
          continue;
        }

        const frame = getOrCreateFrame(line);
        frame.value.push(line.field);

        // Ensure that values of unnamed frames pollute the global scope
        if (!block.name) addGlobal(line.field.name, source);
      }
    }

    /*
     * Semantic analysis of diagram statements.
     * This basically verifies that all pointers point to valid locations.
     */
    const analyzeValue = (value: MemoryValue, source: Interval): void => {
      if (value.kind === "pointer") {
        if (value.value === null) return;
        locateValues(diagram, value.value, source);
        return;
      }

      if (value.kind === "array") {
        value.value.forEach((value) => analyzeValue(value, source));
        return;
      }

      if (value.kind === "object") {
        value.value.forEach(({ value }) => analyzeValue(value, source));
        return;
      }
    };

    blocks.forEach((block) =>
      block.lines.forEach(({ line, source }) => {
        if (line.kind !== "statement") return;
        analyzeValue(line.field.value, source);
      })
    );

    /*
     * Process diagram directives
     * Each directive applies one modification to the diagram
     */
    for (const { line, source } of directives) {
      if (line.kind !== "directive") continue;
      processDirective(diagram, line.directive, sectionLabels, source);
    }

    return diagram;
  },
});

semantics.addOperation<BasicBlock>("toBasicBlock()", {
  Frame(identifier, label, _, lines) {
    const block: BasicBlock = lines.toBasicBlock();
    return {
      name: identifier.asString(),
      label: label.asLabelString(),
      lines: block.lines,
      source: this.source,
    };
  },

  Lines(lines) {
    return {
      lines: lines.children.map((n) => ({
        line: n.toLine(),
        source: n.source,
      })),
      source: this.source,
    };
  },
});

semantics.addOperation<Line>("toLine()", {
  Line(node) {
    return node.toLine();
  },

  Statement(node) {
    return node.toLine();
  },

  Allocation(identifier, symbol, value) {
    return {
      kind: "statement",
      symbol: symbol.sourceString,
      depth: symbol.sourceString.length - 1,
      field: {
        name: identifier.asString(),
        value: value.toValue(),
      },
    };
  },

  Assignment(identifier, label, symbol, value) {
    return {
      kind: "statement",
      symbol: symbol.sourceString,
      depth: 0,
      field: {
        name: identifier.asString(),
        label: label.asLabelString(),
        value: value.toValue(),
      },
    };
  },

  Directive(_) {
    return {
      kind: "directive",
      directive: this.toDirective(),
    };
  },
});

semantics.addOperation<ObjectField>("toObjectField()", {
  ObjectField(identifier, label, _, value) {
    return {
      name: identifier.asString(),
      label: label.asLabelString(),
      value: value.toValue(),
    };
  },
});

function getFields(fieldsList: NonterminalNode) {
  const fieldInfos = fieldsList.asIteration().children.map((n) => ({
    field: n.toObjectField() as ObjectField,
    source: n.source,
  }));

  // Check uniqueness of field names
  const names = new Set<string>();
  for (const {
    field: { name },
    source,
  } of fieldInfos) {
    if (names.has(name))
      parseError(`Duplicate field name in object expression "${name}"`, source);
    names.add(name);
  }

  return fieldInfos.map((fi) => fi.field);
}

semantics.addOperation<MemoryValue>("toValue()", {
  Value(val) {
    return val.toValue();
  },

  Object(label, _, fieldsList, __) {
    return {
      kind: "object",
      fields: true,
      label: label.numChildren > 0 ? label.child(0).asString() : undefined,
      value: getFields(fieldsList),
    };
  },

  ArrayObject(label, _, fieldsList, __) {
    return {
      kind: "object",
      label: label.numChildren > 0 ? label.child(0).asString() : undefined,
      value: getFields(fieldsList),
    };
  },

  Array(_, elements, __) {
    return {
      kind: "array",
      value: elements.asIteration().children.map((n) => n.toValue()),
    };
  },

  Pointer(_, loc) {
    return {
      kind: "pointer",
      value: loc.toLocation(),
    };
  },

  ArrayString(_, str) {
    const chars: string[] = str.toCharArray();
    return {
      kind: "array",
      value: chars.map((c) => ({
        kind: "literal",
        value: c,
      })),
    };
  },

  StringLiteral(str) {
    return {
      kind: "literal",
      value: str.asString(),
    };
  },

  literal(contents) {
    const value = contents.sourceString.trim();
    if (value === "null") return { kind: "pointer", value: null };
    return {
      kind: "literal",
      value,
    };
  },
});

semantics.addOperation<string>("asString()", {
  identifier(chars) {
    return chars.sourceString;
  },

  cssClass(chars) {
    return chars.sourceString;
  },

  string(_, __, ___) {
    return this.toCharArray()
      .map((c: string) => {
        if (c.length > 1) return JSON.parse(`"${c}"`);
        return c;
      })
      .join("");
  },
});

semantics.addOperation<string | undefined>("asLabelString()", {
  Label(_, identifier, __) {
    if (identifier.numChildren === 0) return undefined;
    return identifier.child(0).asString();
  },
});

semantics.addOperation<string[]>("toCharArray()", {
  string(_, chars, __) {
    return chars.children.flatMap((n) => n.toCharArray());
  },

  char(node) {
    return node.toCharArray();
  },

  nonEscape(node) {
    return [node.sourceString];
  },

  escape(_, node) {
    const char = node.sourceString;
    if (char === "\\") return [char];
    return [`\\${char}`];
  },
});

semantics.addOperation<MemoryLocation>("toLocation()", {
  Location(identifier, rest) {
    const locs = rest.children.flatMap((n) => n.toLocation()) as MemoryLocation;
    return [identifier.asString(), ...locs];
  },

  LocationMemberAccess(_, identifier) {
    return [identifier.asString()];
  },

  LocationSubscript(_, index, __) {
    return [index.toNumber()];
  },
});

semantics.addOperation<number>("toNumber()", {
  number(node) {
    return node.toNumber();
  },

  int(minus, digits) {
    return parseInt(minus.sourceString + digits.sourceString, 10);
  },

  float(minus, integral, __, fractional) {
    return parseFloat(
      minus.sourceString + integral.sourceString + "." + fractional.sourceString
    );
  },
});

semantics.addOperation<MemoryLocationSliced>("toLocationSliced()", {
  MultiLocation(identifier, rest) {
    const locs = rest.children.flatMap((n) =>
      n.toLocationSliced()
    ) as MemoryLocationSliced;
    return [identifier.asString(), ...locs];
  },

  LocationMemberAccess(_, identifier) {
    return [identifier.asString()];
  },

  LocationSubscript(_, index, __) {
    return index.toNumber();
  },

  LocationSlice(_, b, __, e, ___, s, ____) {
    const start = b.numChildren > 0 ? b.child(0).toNumber() : undefined;
    const end = e.numChildren > 0 ? e.child(0).toNumber() : undefined;

    // This accounts for the double optional in the grammar
    const stride =
      s.numChildren > 0 && s.child(0).numChildren > 0
        ? s.child(0).child(0).toNumber()
        : undefined;

    if (stride === 0) throw new Error("slice step cannot be zero");
    return [{ start, end, stride }];
  },

  _terminal() {
    return ["*"];
  },
});

semantics.addOperation<Directive>("toDirective()", {
  Directive(node) {
    return node.toDirective();
  },

  LabelDirective(_, section, label) {
    return {
      kind: "label",
      section: section.sourceString,
      label: label.asString(),
    };
  },

  StyleDirective(_, style) {
    return style.toDirective();
  },

  LayoutDirective(_, __) {
    return { kind: "layout", layout: "wide" };
  },

  LabelStyle(_, style, locations) {
    return {
      kind: "style",
      type: "label",
      location: locations.children.map((n) => n.sourceString),
      style: style.toNodeStyle(),
    };
  },

  NodeStyles(_, kindNode, style, locations) {
    const kind = ((kindNode.numChildren > 0 &&
      kindNode.child(0).sourceString) ||
      "node") as keyof ValueStyle;
    return {
      kind: "style",
      type: "node",
      location: locations.children.map((n) => n.toLocationSliced()),
      style: {
        [kind]: style.toNodeStyle(),
      },
    };
  },

  LinkStyle(_, style, locations) {
    return {
      kind: "style",
      type: "node",
      location: locations.children.map((n) => n.toLocationSliced()),
      style: {
        link: style.toJSON(),
      },
    };
  },
});

semantics.addOperation<NodeStyle>("toNodeStyle()", {
  Style(node) {
    return node.toNodeStyle();
  },

  JsonObject(_, __, ___) {
    return { sx: this.toJSON() };
  },

  cssClass(className) {
    return { className: className.sourceString };
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
semantics.addOperation<any>("toJSON()", {
  JsonValue(node) {
    return node.toJSON();
  },

  JsonObject(_, pairs, __) {
    return Object.fromEntries(
      pairs
        .asIteration()
        .children.map((n) => [n.child(0).asString(), n.child(2).toJSON()])
    );
  },

  JsonArray(_, elements, __) {
    return elements.asIteration().children.map((n) => n.toJSON());
  },

  JsonBool(node) {
    return node.sourceString === "true";
  },

  string(_, __, ___) {
    return this.asString();
  },

  number(_) {
    return this.toNumber();
  },

  cssClass(_) {
    return this.asString();
  },
});
