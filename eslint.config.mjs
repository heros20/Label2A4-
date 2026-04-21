import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"

const ignoredPaths = [
  ".next/**",
  "node_modules/**",
  "next-env.d.ts",
  "public/sw.js",
]

const eslintConfig = [
  {
    ignores: ignoredPaths,
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      "@next/next/no-img-element": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react/no-unescaped-entities": "off",
    },
  },
]

export default eslintConfig
