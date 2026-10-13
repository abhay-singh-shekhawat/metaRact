"use client";

import { useSearchParams } from "next/navigation";
import { EnquiryForm } from "@/components/forms/EnquiryForm";

export function EnquiryFormClient() {
  const params = useSearchParams();
  const preselected = params.get("service") || undefined;
  return <EnquiryForm preselected={preselected} />;
}
