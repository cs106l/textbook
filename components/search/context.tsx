import { escapeRegExp } from "lodash";
import React from "react";

type ContextRange = { start: number; end: number };

function getRanges(content: string, query: string): ContextRange[] {
  const tokens = query.split(/\s+/).filter(Boolean) as string[];
  const regex = new RegExp(tokens.map(escapeRegExp).join("|"), "gi");
  const ranges = Array.from(content.matchAll(regex)).map((match) => ({
    start: match.index,
    end: match.index + match[0].length,
  }));

  if (ranges.length === 0) return [];

  // Merge overlapping or whitespace separated ranges
  const merged: ContextRange[] = [];
  let { start, end } = ranges[0];

  for (let i = 1; i < ranges.length; i++) {
    const { start: curStart, end: curEnd } = ranges[i];
    if (curStart <= end || content.slice(end, curStart).trim().length === 0) {
      end = Math.max(end, curEnd);
    } else {
      merged.push({ start, end });
      [start, end] = [curStart, curEnd];
    }
  }

  merged.push({ start, end });
  return merged;
}

function getLargest(ranges: ContextRange[]): ContextRange {
  const length = (r: ContextRange) => r.end - r.start;
  let largest: ContextRange = ranges[0];
  for (let i = 1; i < ranges.length; i++) {
    if (length(ranges[i]) > length(largest)) largest = ranges[i];
  }
  return largest;
}

export function buildContextHighlight(
  content: string,
  query: string,
  contextWindow: number
): React.ReactNode {
  if (!content) return "";
  if (!query) return content;
  const ranges = getRanges(content, query);
  if (ranges.length === 0) return content;
  const largest = getLargest(ranges);
  const snippetStart = Math.max(largest.start - contextWindow, 0);

  const result: React.ReactNode[] = [];
  let cursor = snippetStart;

  if (snippetStart > 0) result.push("…");

  ranges.forEach(({ start, end }) => {
    if (end <= cursor) return;
    if (cursor < start) {
      result.push(<span key={cursor}>{content.slice(cursor, start)}</span>);
    }
    result.push(
      <span key={start} className="highlight">
        {content.slice(start, end)}
      </span>
    );
    cursor = end;
  });

  if (cursor < content.length) {
    result.push(<span key={cursor}>{content.slice(cursor)}</span>);
  }

  return result;
}
