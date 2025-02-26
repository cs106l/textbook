import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_+$",
          varsIgnorePattern: "^_+$",
          destructuredArrayIgnorePattern: "^_+$",
        },
      ],
    },
  },
  {
    ignores: [
      "components/diagrams/grammar.ohm-bundle.d.ts",
      "components/diagrams/grammar.ohm-bundle.js",
    ],
  },
];

export default eslintConfig;
