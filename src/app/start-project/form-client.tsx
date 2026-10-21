"use client";

import { useSearchParams } from "next/navigation";
import { EnquiryForm } from "@/components/forms/EnquiryForm";

export function EnquiryFormClient({ turnstileSiteKey }: { turnstileSiteKey: string }) {
  const params = useSearchParams();
  const preselected = params.get("service") || undefined;
  return <EnquiryForm preselected={preselected} turnstileSiteKey={turnstileSiteKey} />;
}
