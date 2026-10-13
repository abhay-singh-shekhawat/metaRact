export const ENQUIRY_STATUSES = [
  "new",
  "reviewing",
  "awaiting_customer",
  "qualified",
  "declined",
  "converted",
  "archived",
] as const;

export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

const TRANSITIONS: Record<EnquiryStatus, EnquiryStatus[]> = {
  new: ["reviewing", "awaiting_customer", "declined", "archived"],
  reviewing: ["awaiting_customer", "qualified", "declined", "archived"],
  awaiting_customer: ["reviewing", "qualified", "declined", "archived"],
  qualified: ["converted", "reviewing", "declined", "archived"],
  converted: ["archived"],
  declined: ["archived"],
  archived: [],
};

export function isValidTransition(
  from: EnquiryStatus,
  to: EnquiryStatus
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function allowedTransitions(from: EnquiryStatus): EnquiryStatus[] {
  return TRANSITIONS[from] ?? [];
}
