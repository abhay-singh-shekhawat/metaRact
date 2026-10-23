import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // The real `server-only` package throws outside the Next.js runtime.
      // Tests run in plain Node, so map it to a no-op shim here.
      "server-only": path.resolve(__dirname, "tests/shims/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    // No automated test may send real email. The integration suite drives the
    // real enquiry use case, so a developer shell that exports SMTP or Resend
    // values would otherwise deliver genuine mail. Unit tests set their own
    // values on top of these; the provider call itself is stubbed there.
    env: {
      GMAIL_USER: "",
      GMAIL_APP_PASSWORD: "",
      RESEND_API_KEY: "",
      AGENCY_EMAIL: "",
      EMAIL_FROM: "",
      AGENCY_REPLY_TO: "",
      AGENCY_BCC_EMAIL: "",
      AGENCY_NOTIFICATION_EMAIL: "test-team@example.test",
      INTERNAL_NOTIFICATION_EMAIL: "",
    },
  },
});
