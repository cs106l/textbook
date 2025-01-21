import {
  MemoryStatement,
  MemoryDiagram,
  MemoryLocation,
  MemoryValue,
  ValueStyle,
  MemorySubDiagram,
  NodeStyle,
} from "./types";

import { mergeSx } from "merge-sx";

import grammar from "./grammar.ohm-bundle";
import { Interval } from "ohm-js";
import { merge } from "lodash";

export default function compileDiagram(content: string): MemoryDiagram {
  const result = grammar.match(content);
  if (result.failed()) parseError(result.message);
  const diagram: MemoryDiagram = semantics(result).toDiagram();
  return diagram;
}

function parseError(message: string = "", source?: Interval): never {
  const context = (() => {
    if (!source) return "";
    const { lineNum, colNum } = source.getLineAndColumn();
    return ` at line ${lineNum}, column ${colNum}`;
  })();
  throw new Error(`Error parsing diagram${context}:\n\n${message}`);
}

function processDirective(
  diagram: MemorySubDiagram,
  directive: Directive,
  source: Interval
) {
  if (directive.kind === "label") {
    if (directive.section === "stack") diagram.stack.label = directive.label;
    else if (directive.section === "heap") diagram.heap.label = directive.label;
    else if (directive.section === "title") diagram.title = directive.label;
    else if (directive.section === "subtitle")
      diagram.subtitle = directive.label;
    return;
  }

  if (directive.kind === "style") {
    const values = locateValues(diagram, directive.location, source);
    values.forEach((v) => (v.style = mergeStyles(v.style, directive.style)));
  }
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
    label: mergeNodeStyles(existing?.label, newStyle.label),
    row: mergeNodeStyles(existing?.row, newStyle.row),
    link: merge(existing?.link, newStyle.link),
  };
}

function locateValues(
  diagram: MemorySubDiagram,
  loc: MemoryLocationSliced,
  source?: Interval
): MemoryValue[] {
  const variables = new Map<string, MemoryValue>();
  diagram.stack.frames.forEach((f) =>
    f.statements.forEach((s) => variables.set(s.variable, s.value))
  );
  diagram.heap.allocations.forEach((s) => variables.set(s.variable, s.value));

  const values: MemoryValue[] = [];
  locateValuesRec(variables, loc, 0, values, source);
  return values;
}

function locateValuesRec(
  variables: Map<string, MemoryValue>,
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
    const variable = variables.get(loc[0]);
    if (!variable)
      return parseError(
        `Variable ${loc[0]} referenced by &${formatLocation(
          loc
        )} does not exist`,
        source
      );
    return locateValuesRec(
      variables,
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

  /* Member access */
  if (typeof segment === "string") {
    if (parent.kind !== "object")
      return fail(`cannot reference field "${segment}" of non-object value {}`);
    if (!Object.keys(parent.value).includes(segment))
      return fail(`field "${segment}" does not exist in object {}`);
    return locateValuesRec(
      variables,
      loc,
      idx + 1,
      values,
      source,
      [...parentPath, segment],
      parent.value[segment]
    );
  }

  /* Array subscript */
  if (typeof segment === "number") {
    if (parent.kind !== "array")
      return fail(`cannot reference index ${segment} of non-array value {}`);

    const length = parent.value.length;
    if (segment < -length || segment >= length)
      return fail(
        `index ${segment} is out of bounds for array {} of length ${length}`
      );
    return locateValuesRec(
      variables,
      loc,
      idx + 1,
      values,
      source,
      [...parentPath, segment],
      parent.value[segment < 0 ? segment + length : segment]
    );
  }

  /* Array slice */
  if (typeof segment === "object") {
    const fmt = formatSlice(segment);
    if (parent.kind !== "array")
      return fail(`cannot take slice ${fmt} of non-array value {}`);

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
        variables,
        loc,
        idx + 1,
        values,
        source,
        [...parentPath, sliceIdx],
        parent.value[sliceIdx]
      );
    }

    return;
  }

  throw new Error("Internal error: invalid location part/unhandled type");
}

export function formatLocation(loc: MemoryLocationSliced): string {
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

type Line = StatementLine | DirectiveLine | FrameHeaderLine;
type StatementLine = { kind: "statement"; statement: MemoryStatement };
type DirectiveLine = { kind: "directive"; directive: Directive };
type FrameHeaderLine = { kind: "frame"; label: string };

type MemoryLocationSliced = (string | number | LocationSlice)[];
type LocationSlice = { start?: number; end?: number; stride?: number };

type Directive = LabelDirective | StyleDirective;
type LabelDirective = {
  kind: "label";
  section: "stack" | "heap" | "title" | "subtitle";
  label: string;
};
type StyleDirective = {
  kind: "style";
  location: MemoryLocationSliced;
  style: ValueStyle;
};

/* ========================================================================= */
/* Grammar semantics                                                         */
/* ========================================================================= */

const semantics = grammar.createSemantics();

semantics.addOperation<MemoryDiagram>("toDiagram()", {
  Diagram_multi(subdiagrams) {
    return subdiagrams.children.map((n) => n.toSubDiagram());
  },

  Diagram_single(lines) {
    return [lines.toSubDiagram()];
  },
});

semantics.addOperation<MemorySubDiagram>("toSubDiagram()", {
  SubDiagram(identifier, _, lines, __) {
    const diagram: MemorySubDiagram = lines.toSubDiagram();
    return {
      // Format title with `` so it looks like code by default
      title: `\`${identifier.asString()}\``,
      ...diagram,
    };
  },

  Lines(node) {
    type LineInfo = { line: Line; source: Interval };
    const lines: LineInfo[] = node.children.map((n) => ({
      line: n.toLine(),
      source: n.source,
    }));

    const diagram: MemorySubDiagram = {
      stack: { label: "Stack", frames: [] },
      heap: { label: "Heap", allocations: [] },
    };

    const variables = new Set<string>();

    for (const { line, source } of lines) {
      if (line.kind === "directive") continue;

      // Check to see if this is the start of a new frame
      if (line.kind === "frame") {
        diagram.stack.frames.push({
          label: line.label,
          statements: [],
        });
        continue;
      }

      // Verify the uniqueness of this variable
      if (variables.has(line.statement.variable))
        parseError(
          `Variable ${line.statement.variable} is already used. ` +
            `You can change the displayed name of the variable by using a label, ` +
            `e.g. "${line.statement.variable}(label) = ..."`,
          source
        );

      variables.add(line.statement.variable);

      if (line.statement.label) {
        // Assignment in stack frame
        // Make sure there is a frame available
        if (diagram.stack.frames.length === 0) {
          diagram.stack.frames.push({ statements: [] });
        }

        const frame = diagram.stack.frames[diagram.stack.frames.length - 1];
        frame.statements.push(line.statement);
      } else {
        // Allocation on heap
        diagram.heap.allocations.push(line.statement);
      }
    }

    /*
     * Semantic analysis of diagram statements.
     * This basically verifies that all pointers point to valid locations.
     */
    const analyzeValue = (
      statement: MemoryStatement,
      source: Interval,
      value?: MemoryValue
    ): void => {
      if (!value) value = statement.value;

      if (value.kind === "pointer") {
        if (value.value === null) return;
        locateValues(diagram, value.value, source);
        return;
      }

      if (value.kind === "array") {
        value.value.forEach((v) => analyzeValue(statement, source, v));
        return;
      }

      if (value.kind === "object") {
        Object.values(value.value).forEach((v) =>
          analyzeValue(statement, source, v)
        );
        return;
      }
    };

    lines.forEach(({ line, source }) => {
      if (line.kind !== "statement") return;
      analyzeValue(line.statement, source);
    });

    /*
     * Process diagram directives
     * Each directive applies one modification to the diagram
     */
    for (const { line, source } of lines) {
      if (line.kind !== "directive") continue;
      processDirective(diagram, line.directive, source);
    }

    return diagram;
  },
});

semantics.addOperation<Line>("toLine()", {
  Line(node) {
    return node.toLine();
  },

  Statement(_) {
    return {
      kind: "statement",
      statement: this.toStatement(),
    };
  },

  Directive(_) {
    return {
      kind: "directive",
      directive: this.toDirective(),
    };
  },

  FrameHeader(identifier, _) {
    return {
      kind: "frame",
      label: identifier.asString(),
    };
  },
});

semantics.addOperation<MemoryStatement>("toStatement()", {
  Statement(node) {
    return node.toStatement();
  },

  Allocation(identifier, _, value) {
    return {
      variable: identifier.asString(),
      value: value.toValue(),
      source: { source: "", no: -1 },
    };
  },

  Assignment(identifier, label, _, value) {
    const variable = identifier.asString();
    return {
      variable,
      label: label.numChildren > 0 ? label.child(0).asString() : variable,
      value: value.toValue(),
      source: { source: "", no: -1 },
    };
  },
});

semantics.addOperation<MemoryValue>("toValue()", {
  Value(val) {
    return val.toValue();
  },

  Object(type, _, fields, __) {
    const pairs: [string, MemoryValue][] = fields
      .asIteration()
      .children.map((n) => n.toPair());

    // Check uniqueness of field names
    const names = new Set<string>();
    for (const [name] of pairs) {
      if (names.has(name))
        parseError(
          `Duplicate field name in object expression "${name}"`,
          this.source
        );
      names.add(name);
    }

    return {
      kind: "object",
      type: type.numChildren > 0 ? type.child(0).asString() : undefined,
      value: Object.fromEntries(pairs),
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
    if (contents.sourceString === "null")
      return { kind: "pointer", value: null };
    return {
      kind: "literal",
      value: contents.sourceString,
    };
  },
});

semantics.addOperation<string>("asString()", {
  identifier(chars) {
    return chars.sourceString;
  },

  Label(_, identifier, __) {
    return identifier.asString();
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

semantics.addOperation<[string, MemoryValue]>("toPair()", {
  Pair(identifier, _, value) {
    return [identifier.asString(), value.toValue()];
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
});

semantics.addOperation<Directive>("toDirective()", {
  Directive(node) {
    return node.toDirective();
  },

  LabelDirective(_, section, label) {
    return {
      kind: "label",
      section: section.sourceString as "stack" | "heap",
      label: label.asString(),
    };
  },

  StyleDirective(_, style) {
    return style.toDirective();
  },

  NodeStyles(kindNode, _, location, styles) {
    const kind = ((kindNode.numChildren > 0 &&
      kindNode.child(0).sourceString) ||
      "node") as keyof ValueStyle;
    return {
      kind: "style",
      location: location.toLocationSliced(),
      style: {
        [kind]: styles.toNodeStyle(),
      },
    };
  },

  LinkStyle(_, location, style) {
    return {
      kind: "style",
      location: location.toLocationSliced(),
      style: {
        link: style.toJSON(),
      },
    };
  },
});

semantics.addOperation<NodeStyle>("toNodeStyle()", {
  JsonObject(_, __, ___) {
    return {
      sx: this.toJSON(),
    };
  },

  CSSClasses(classes) {
    return {
      className: classes.children.map((n) => n.asString()).join(" "),
    };
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
});
