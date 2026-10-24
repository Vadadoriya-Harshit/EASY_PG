import { NextResponse } from "next/server";
import { getSession, type AdminSession, type Role } from "./auth";
import { jsonError } from "./http";

/**
 * Server-side authorization for admin route handlers.
 * The middleware only does a cheap signature check; THIS verifies the server-side session record,
 * the account status and the role from the database. Every admin route must call it.
 */
export async function requireAdmin(opts: { roles?: Role[] } = {}): Promise<{ session: AdminSession } | { res: NextResponse }> {
  let session: AdminSession | null = null;
  try {
    session = await getSession();
  } catch (e) {
    console.error("[guard] session lookup failed");
    return { res: jsonError("Service temporarily unavailable.", 503) };
  }
  if (!session) return { res: jsonError("Authentication required.", 401) };
  if (opts.roles && !opts.roles.includes(session.role)) return { res: jsonError("You do not have permission to do this.", 403) };
  return { session };
}
