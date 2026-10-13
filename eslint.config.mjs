import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "playwright-report/**", "test-results/**", ".data/**"],
  },
];

export default config;
