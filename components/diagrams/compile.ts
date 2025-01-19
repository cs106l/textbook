import { MemoryAssignment, MemoryDiagram, MemoryLocation, MemoryValue } from "./types";

import grammar from "./grammar.ohm-bundle";
import { Node } from "ohm-js";

export default function compileDiagram(content: string): MemoryDiagram {
  const lines = getLines(content);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const directives = splitDirectives(lines);

  const diagram: MemoryDiagram = {
    stack: { label: "Stack", frames: [] },
    heap: { label: "Heap", assignments: [] },
  };

  for (const line of lines) {
    // Check to see if this is the start of a new frame
    if (line.endsWith(":")) {
      diagram.stack.frames.push({ label: line.slice(0, -1), assignments: [] });
      continue;
    }

    // Make sure there is a frame available
    if (diagram.stack.frames.length === 0) {
      diagram.stack.frames.push({ assignments: [] });
    }

    // const frame = diagram.stack.frames[diagram.stack.frames.length - 1];
  }

  throw new Error("Not implemented");
}

function getLines(content: string): string[] {
  const lines = content.split("\n");
  return lines.map((line) => line.trim()).filter(Boolean);
}

function splitDirectives(lines: string[]): string[] {
  const directives: string[] = [];
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].startsWith("#")) directives.unshift(lines.splice(i, 1)[0]);
  }
  return directives;
}

const semantics = grammar.createSemantics();

semantics.addOperation<MemoryValue>("toValue()", {
  Value(val) {
    return val.toValue();
  },

  Object(type, _, fields, __) {
    return {
      kind: "object",
      type: type.numChildren > 0 ? type.child(0).toString() : undefined,
      value: Object.fromEntries(
        fields.asIteration().children.map((n) => n.toPair())
      ),
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
      value: loc.toLocation()
    }
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
});

semantics.addOperation<string>("toString()", {
  identifier(chars) {
    return chars.children.map((n) => n.sourceString).join("");
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
})

semantics.addOperation<number>("toNumber()", {
  number(minus, digits) {
    return (minus.numChildren > 0 ? -1 : 1) * digits.toNumber();
  },

  zero() {
    return 0;
  },

  nonzero(first, rest) {
    const str = [first, ...rest.children.map((n) => n.sourceString)].join("");
    return Number.parseInt(str);
  },
});
