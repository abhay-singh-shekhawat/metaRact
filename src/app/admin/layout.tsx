import { AdminSubnav } from "@/components/admin/AdminSubnav";

/**
 * Console chrome only. Authentication is enforced per page and per API use case
 * (never here) — a guard in the layout would loop against /admin/sign-in.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminSubnav />
      {children}
    </>
  );
}
