import { cancellationRefundPolicyDoc } from "./cancellation-refund-policy";
import { intellectualPropertyPolicyDoc } from "./intellectual-property-policy";
import { privacyPolicyDoc } from "./privacy-policy";
import { termsOfServiceDoc } from "./terms-of-service";
import type { LegalDoc } from "./types";

export type { LegalBlock, LegalDoc, LegalSection } from "./types";

/**
 * The four published policies, in the order they appear in the footer.
 *
 * The text itself is generated from `docs/legal/*.md` by `pnpm legal:import` — never
 * edit the modules in this folder by hand.
 */
export const legalDocs: readonly LegalDoc[] = [
  privacyPolicyDoc,
  termsOfServiceDoc,
  cancellationRefundPolicyDoc,
  intellectualPropertyPolicyDoc,
];

/** Every policy except the one being read, for cross-references and the footer of a policy page. */
export function otherLegalDocs(doc: LegalDoc): LegalDoc[] {
  return legalDocs.filter((candidate) => candidate.href !== doc.href);
}
