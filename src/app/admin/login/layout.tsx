import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Already signed in? Go to the dashboard. This check is server side and uses the real session record, so a
 * cookie that is still signed but no longer valid (logged out elsewhere, server restarted) can NOT cause the
 * login <-> dashboard redirect loop the old cookie-only middleware check produced.
 */
export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  if (await getSession()) redirect("/admin");
  return <>{children}</>;
}
