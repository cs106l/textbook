import React from "react";
import CodeBlock from "./code";
import QuizView from "./quiz";
import MemoryDiagramView from "./diagrams/render";

export type PreContent = {
  type: "code" | "quiz" | "memory";
  options: string[];
  content: string;
};

export function getOptions(
  lang?: string | null
): [PreContent["type"], PreContent["options"]] {
  if (!lang) return ["code", []];
  const components = lang.split(",");
  if (components[0] === "yaml" && components.includes("quiz"))
    return ["quiz", components];
  if (components[0] === "memory") return ["memory", components];
  return ["code", components];
}

export default function Pre({ children }: { children: React.ReactNode }) {
  const content = React.useMemo(() => {
    const invalid = new Error("Invalid <code /> structure");

    if (!React.isValidElement(children) || children.type !== "code")
      throw invalid;

    const props = children.props as {
      children?: string;
      className?: string;
    };

    let content = props.children;
    const className = props.className;

    if (typeof content !== "string") throw invalid;
    if (content.endsWith("\n")) content = content.slice(0, -1);

    const langPrefix = "language-";
    const classes = className?.split(" ");
    const lang = classes
      ?.find((c) => c.startsWith(langPrefix))
      ?.slice(langPrefix.length);

    const [type, options] = getOptions(lang);
    return {
      type,
      options,
      content,
    };
  }, [children]);

  if (content.type === "code") return <CodeBlock {...content} />;
  if (content.type === "quiz") return <QuizView {...content} />;
  if (content.type === "memory") return <MemoryDiagramView {...content} />;
  return null;
}
