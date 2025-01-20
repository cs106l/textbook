import {
  MemoryStatement,
  MemoryDiagram,
  MemoryLocation,
  MemoryValue,
  NodeStyle,
  Line,
} from "./types";

import grammar from "./grammar.ohm-bundle";

export default function compileDiagram(content: string): MemoryDiagram {
  const lines = getLines(content);
  const { statements, directives } = splitDirectives(lines);

  const diagram: MemoryDiagram = {
    stack: { label: "Stack", frames: [] },
    heap: { label: "Heap", statements: [] },
  };

  for (const line of statements) {
    // Check to see if this is the start of a new frame
    if (line.source.endsWith(":")) {
      diagram.stack.frames.push({
        label: line.source.slice(0, -1),
        statements: [],
      });
      continue;
    }

    const statement = parseStatement(diagram, line);

    if (statement.label) {
      // Assignment in stack frame

      // Make sure there is a frame available
      if (diagram.stack.frames.length === 0) {
        diagram.stack.frames.push({ statements: [] });
      }

      const frame = diagram.stack.frames[diagram.stack.frames.length - 1];
      frame.statements.push(statement);
    } else {
      // Allocation on heap
      diagram.heap.statements.push(statement);
    }
  }

  analyzeDiagram(diagram);

  for (const directive of directives) {
    processDirective(diagram, parseDirective(directive));
  }

  return diagram;
}

function getLines(content: string): Line[] {
  const lines = content.split("\n");
  return lines
    .map((line, idx) => ({
      source: line.trim(),
      no: idx + 1,
    }))
    .filter((l) => l.source.length > 0);
}

function splitDirectives(lines: Line[]): {
  directives: Line[];
  statements: Line[];
} {
  const statements = [...lines];
  const directives: Line[] = [];
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].source.startsWith("#"))
      directives.unshift(statements.splice(i, 1)[0]);
  }
  return { directives, statements };
}

function parseError(line: Line, message: string = ""): never {
  throw new Error(`Error parsing diagram at line ${line.no}:\n\n${message}`);
}

function parseStatement(diagram: MemoryDiagram, line: Line): MemoryStatement {
  const match = grammar.match(line.source, "Statement");
  if (match.failed()) return parseError(line, match.message);

  const statement: MemoryStatement = semantics(match).toStatement();

  // Verify the uniqueness of this variable
  const variables = new Set([
    ...diagram.stack.frames.flatMap((f) => f.statements.map((s) => s.variable)),
    ...diagram.heap.statements.map((s) => s.variable),
  ]);

  if (variables.has(statement.variable)) {
    throw new Error(
      `Error parsing diagram at line ${line.no}:\n\nVariable ${statement.variable} is already used. ` +
        `You can change the displayed name of the variable by using a label, ` +
        `e.g. "${statement.variable}(label) = ..."`
    );
  }

  statement.line = line;
  return statement;
}

function parseDirective(line: Line): Directive {
  const match = grammar.match(line.source, "Directive");
  if (match.failed()) return parseError(line, match.message);
  const directive: Directive = semantics(match).toDirective();
  directive.line = line;
  return directive;
}

function analyzeDiagram(diagram: MemoryDiagram): void {
  const analyzeValue = (
    statement: MemoryStatement,
    value?: MemoryValue
  ): void => {
    if (!value) value = statement.value;

    if (value.kind === "pointer") {
      if (value.value === null) return;
      locateValues(diagram, statement.line, value.value);
      return;
    }

    if (value.kind === "array") {
      value.value.forEach((v) => analyzeValue(statement, v));
      return;
    }

    if (value.kind === "object") {
      Object.values(value.value).forEach((v) => analyzeValue(statement, v));
      return;
    }
  };

  diagram.stack.frames.forEach((f) =>
    f.statements.forEach((s) => analyzeValue(s))
  );
  diagram.heap.statements.forEach((s) => analyzeValue(s));
}

function processDirective(diagram: MemoryDiagram, directive: Directive) {
  if (directive.kind === "label") {
    if (directive.section === "stack") diagram.stack.label = directive.label;
    else if (directive.section === "heap") diagram.heap.label = directive.label;
    return;
  }

  if (directive.kind === "style") {
    const values = locateValues(diagram, directive.line, directive.location);
    values.forEach((v) => (v.style = mergeStyles(v.style, directive.style)));
  }
}

function mergeStyles(
  existing: NodeStyle | undefined,
  newStyle: NodeStyle
): NodeStyle {
  existing ??= { classNames: [] };
  return {
    classNames: [...existing.classNames, ...newStyle.classNames],
  };
}

function locateValues(
  diagram: MemoryDiagram,
  line: Line,
  loc: MemoryLocationSliced
): MemoryValue[] {
  const variables = new Map<string, MemoryValue>();
  diagram.stack.frames.forEach((f) =>
    f.statements.forEach((s) => variables.set(s.variable, s.value))
  );
  diagram.heap.statements.forEach((s) => variables.set(s.variable, s.value));

  const values: MemoryValue[] = [];
  locateValuesRec(line, variables, loc, 0, values);
  return values;
}

function locateValuesRec(
  line: Line,
  variables: Map<string, MemoryValue>,
  loc: MemoryLocationSliced,
  idx: number,
  values: MemoryValue[],
  parentPath: MemoryLocation = [],
  parent?: MemoryValue
): void {
  /* Failure function if parsing from a parent node fails */
  const fail = (msg: string) =>
    parseError(
      line,
      `In reference &${formatLoc(loc)}, ${msg.replaceAll(
        "{}",
        formatLoc(parentPath)
      )}`
    );

  if (loc.length === 0)
    throw new Error("Internal error: location has length 0");
  if (idx === 0) {
    if (typeof loc[0] !== "string")
      throw new Error(
        `Internal error: first part of ${formatLoc(loc)} is not a variable`
      );
    const variable = variables.get(loc[0]);
    if (!variable)
      return parseError(
        line,
        `Variable ${loc[0]} referenced by &${formatLoc(loc)} does not exist`
      );
    return locateValuesRec(
      line,
      variables,
      loc,
      idx + 1,
      values,
      [loc[0]],
      variable
    );
  }

  if (!parent) throw new Error("Internal error: missing parent");
  if (idx >= loc.length) return void values.push(parent);

  let segment = loc[idx];

  /* Member access */
  if (typeof segment === "string") {
    if (parent.kind !== "object")
      return fail(`cannot reference field "${segment}" of non-object value {}`);
    if (!Object.keys(parent.value).includes(segment))
      return fail(`field "${segment}" does not exist in object {}`);
    return locateValuesRec(
      line,
      variables,
      loc,
      idx + 1,
      values,
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
      line,
      variables,
      loc,
      idx + 1,
      values,
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
        line,
        variables,
        loc,
        idx + 1,
        values,
        [...parentPath, sliceIdx],
        parent.value[sliceIdx]
      );
    }

    return;
  }

  throw new Error("Internal error: invalid location part/unhandled type");
}

function formatLoc(loc: MemoryLocationSliced): string {
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

const semantics = grammar.createSemantics();

semantics.addOperation<MemoryStatement>("toStatement()", {
  Statement(node) {
    return node.toStatement();
  },

  Allocation(identifier, _, value) {
    return {
      variable: identifier.toString(),
      value: value.toValue(),
      line: { source: "", no: -1 },
    };
  },

  Assignment(identifier, label, _, value) {
    const variable = identifier.toString();
    return {
      variable,
      label: label.numChildren > 0 ? label.child(0).toString() : variable,
      value: value.toValue(),
      line: { source: "", no: -1 },
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
      if (names.has(name)) {
        throw new Error(`Duplicate field name in object expression "${name}"`);
      }
      names.add(name);
    }

    return {
      kind: "object",
      type: type.numChildren > 0 ? type.child(0).toString() : undefined,
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
    const chars: string[] = str.toCharArray();
    return {
      kind: "literal",
      value: chars
        .map((c) => {
          if (c.length > 1) return JSON.parse(`"${c}"`);
          return c;
        })
        .join(""),
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

semantics.addOperation<string>("toString()", {
  identifier(chars) {
    return chars.sourceString;
  },

  Label(_, identifier, __) {
    return identifier.toString();
  },

  cssClass(chars) {
    return chars.sourceString;
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
    return [identifier.toString(), value.toValue()];
  },
});

semantics.addOperation<MemoryLocation>("toLocation()", {
  Location(identifier, rest) {
    const locs = rest.children.flatMap((n) => n.toLocation()) as MemoryLocation;
    return [identifier.toString(), ...locs];
  },

  LocationMemberAccess(_, identifier) {
    return [identifier.toString()];
  },

  LocationSubscript(_, index, __) {
    return [index.toNumber()];
  },
});

semantics.addOperation<number>("toNumber()", {
  number(minus, digits) {
    return (minus.numChildren > 0 ? -1 : 1) * digits.toNumber();
  },

  zero(_) {
    return 0;
  },

  nonzero(_, __) {
    return Number.parseInt(this.sourceString);
  },
});

type MemoryLocationSliced = (string | number | LocationSlice)[];
type LocationSlice = { start?: number; end?: number; stride?: number };

semantics.addOperation<MemoryLocationSliced>("toLocationSliced()", {
  MultiLocation(identifier, rest) {
    const locs = rest.children.flatMap((n) =>
      n.toLocationSliced()
    ) as MemoryLocationSliced;
    return [identifier.toString(), ...locs];
  },

  LocationMemberAccess(_, identifier) {
    return [identifier.toString()];
  },

  LocationSubscript(_, index, __) {
    return index.toNumber();
  },

  LocationSlice(_, b, __, e, ___, s, ____) {
    const start = b.numChildren > 0 ? b.child(0).toNumber() : undefined;
    const end = e.numChildren > 0 ? e.child(0).toNumber() : undefined;
    const stride = s.numChildren > 0 ? s.child(0).toNumber() : undefined;

    if (stride === 0) throw new Error("slice step cannot be zero");
    return [{ start, end, stride }];
  },
});

type Directive = { line: Line } & (LabelDirective | StyleDirective);
type LabelDirective = {
  kind: "label";
  section: "stack" | "heap";
  label: string;
};
type StyleDirective = {
  kind: "style";
  location: MemoryLocationSliced;
  style: NodeStyle;
};

semantics.addOperation<Directive>("toDirective()", {
  Directive(node) {
    return node.toDirective();
  },

  LabelDirective(_, section, label) {
    return {
      kind: "label",
      section: section.sourceString as "stack" | "heap",
      label: label.sourceString,
      line: { source: "", no: -1 },
    };
  },

  StyleDirective(_, location, style) {
    return {
      kind: "style",
      location: location.toLocationSliced(),
      style: {
        classNames: style.children.map((n) => n.toString()),
      },
      line: { source: "", no: -1 },
    };
  },
});
