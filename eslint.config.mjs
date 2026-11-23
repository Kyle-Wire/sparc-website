import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // Other checkouts of this repo that tools place inside it (git worktrees),
      // each with its own build output. They are linted where they live.
      ".claude/**",
      // The map library's worker, copied from node_modules by scripts/copy-map-worker.mjs.
      "public/vendor/**",
      // Print and social marketing files and their generator scripts; not part of the app.
      "marketing/**",
    ],
  },
];

export default eslintConfig;
