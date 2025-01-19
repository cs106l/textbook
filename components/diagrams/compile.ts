import { MemoryDiagram } from "./types";

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
