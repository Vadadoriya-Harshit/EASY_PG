import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function VerifyOtpLayout({ children }: { children: React.ReactNode }) {
  if (await getSession()) redirect("/admin");
  return <>{children}</>;
}
