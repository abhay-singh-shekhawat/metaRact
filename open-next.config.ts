import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * OpenNext adapter configuration for Cloudflare Workers.
 *
 * Nothing is overridden on purpose:
 * - There is no ISR / incremental cache in this app (the admin console is
 *   `force-dynamic`, the marketing pages are fully static), so no R2 bucket
 *   binding is needed. Add `incrementalCache` here if that changes.
 * - No queue or tag-cache overrides are required for the current feature set.
 *
 * See CLOUDFLARE_DEPLOYMENT.md for the deployment procedure.
 */
export default defineCloudflareConfig();
