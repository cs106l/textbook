export type PreOptions =
  | { type: "code"; language?: string; runnable?: boolean }
  | { type: "quiz" };

export type PreContent = {
  options: PreOptions;
  initialContent: string;
};

export function getOptions(lang?: string | null) {
  if (!lang) return { type: "code" };
  const components = lang.split(",");
  if (components[0] === "yaml" && components.includes("quiz"))
    return { type: "quiz" };
  return {
    type: "code",
    language: components[0],
    runnable: components.includes("runnable"),
  };
}
