/**
 * Contains code for parsing and rendering styled text,
 * e.g. for highlighted code/markers.
 *
 * Implements a simple recursive descent parser.
 */

export type ReducerContext = Record<string, unknown>;
export type Reducer = (text: string) => string;
export type ContextReducer = (text: string, context: ReducerContext) => string;

export type MatcherRule =
  | { kind: "delimeted"; start: string; end: string }
  | { kind: "exact"; value: string };

export type Matcher = {
  /** A unique identifier for this matcher */
  kind: string;
  /** Converts symbols in markdown to style-aware symbols */
  markdown: Reducer;
  /** How this matcher should be parsed */
  rule: MatcherRule;
  /** Renders this rule to DOM nodes */
  render: ContextReducer;
};

type TreeNode =
  /** Leaf node containing raw text */
  | { matcher: null; value: string }
  /** Compound node wrapping an array of children */
  | { matcher: Matcher; children: TreeNode[] };

type Match = {
  matcher: Matcher;
  start: number;
  end: number;
  open?: boolean;
};

export class ParseTree {
  private readonly tree: TreeNode[];

  constructor(tree: TreeNode[]) {
    this.tree = tree;
  }

  /** Reduces this tree to only its raw text content. */
  clean(): string {
    const reducer = (text: string) => text;
    return this.reduce(this.tree, reducer, () => reducer, {});
  }

  /**
   * Renders this tree to DOM, including styling information.
   *
   * @param textReducer Converts raw text to styled text.
   *                    Can be used for syntax highlighting.
   * @param context Shared context passed to the `render` reducers.
   */
  render(textReducer: Reducer, context: ReducerContext = {}): string {
    return this.reduce(
      this.tree,
      textReducer,
      (matcher) => matcher.render,
      context
    );
  }

  private reduce(
    nodes: TreeNode[],
    textReducer: Reducer,
    reducerSelector: (matcher: Matcher) => ContextReducer,
    context: ReducerContext
  ): string {
    return nodes
      .map((node) => {
        if (node.matcher === null) return textReducer(node.value);
        return reducerSelector(node.matcher)(
          this.reduce(node.children, textReducer, reducerSelector, context),
          context
        );
      })
      .join("");
  }
}

export class StyleParser {
  private readonly matchers: Matcher[];

  private input: string = "";
  private pos = 0;

  constructor(matchers: Matcher[]) {
    this.matchers = matchers;
  }

  /**
   * Converts markdown to style-aware text.
   */
  markdown(input: string): string {
    return this.matchers.reduce(
      (text, matcher) => matcher.markdown(text),
      input
    );
  }

  parse(input: string): ParseTree {
    this.input = input;
    this.pos = 0;
    return new ParseTree(this.parseRec());
  }

  private parseRec(match?: Match): TreeNode[] {
    const nodes: TreeNode[] = [];
    while (this.pos < this.input.length) {
      const next = this.nextMatch();

      if (!next) {
        // No match found, consume rest of input
        nodes.push({ matcher: null, value: this.input.slice(this.pos) });
        this.pos = this.input.length;
        break;
      }

      const { matcher, start, end, open } = next;

      if (start > this.pos) {
        // Space between next match
        nodes.push({ matcher: null, value: this.input.slice(this.pos, start) });
      }

      this.pos = end; // Advance to after match

      // Next match is exact
      if (matcher.rule.kind === "exact") {
        nodes.push({ matcher, children: [] });
        continue;
      }

      // Next match opens a new context
      if (open) {
        const children = this.parseRec(next);
        nodes.push({ matcher, children });
        continue;
      }

      // Closing match does not match opening one, treat as raw text
      if (matcher.kind !== match?.matcher.kind) {
        nodes.push({ matcher: null, value: this.input.slice(start, end) });
        continue;
      }

      // Closing match found, return to parent context
      break;
    }

    return nodes;
  }

  private nextMatch(): Match | null {
    const matches = this.matchers
      .flatMap((matcher) => {
        const matches: Match[] = [];
        if (matcher.rule.kind === "delimeted") {
          const start = this.input.indexOf(matcher.rule.start, this.pos);
          const end = this.input.indexOf(matcher.rule.end, this.pos);
          matches.push({
            matcher,
            start,
            end: start + matcher.rule.start.length,
            open: true,
          });
          matches.push({
            matcher,
            start: end,
            end: end + matcher.rule.end.length,
            open: false,
          });
        } else if (matcher.rule.kind === "exact") {
          const start = this.input.indexOf(matcher.rule.value, this.pos);
          matches.push({
            matcher,
            start,
            end: start + matcher.rule.value.length,
          });
        }
        return matches;
      })
      .filter((match) => match.start >= 0)
      .sort(matchComparator);

    if (matches.length === 0) return null;
    return matches[0];
  }
}

/**
 * Sorts matches.
 *
 * Exact matches come first as they can be immediately consumed.
 * Closed matches come before open matches in order to close already open delimeters.
 */
function matchComparator(a: Match, b: Match): number {
  const diff = a.start - b.start;
  if (diff !== 0) return diff;

  if (a.open === b.open) return 0;
  if (a.open === undefined) return -1;
  if (b.open === undefined) return 1;
  return a.open ? 1 : -1;
}
