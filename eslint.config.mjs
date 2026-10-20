import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      ".open-next/**",
      ".wrangler/**",
      "out/**",
      "playwright-report/**",
      "test-results/**",
      ".data/**",
      "cloudflare-env.d.ts",
      "worker-configuration.d.ts",
    ],
  },
];

export default config;
