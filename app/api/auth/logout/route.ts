import { neonAuth } from "@/lib/auth/neon";
import { clearUserSession } from "@/lib/security/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await neonAuth.signOut();
  } finally {
    await clearUserSession();
  }

  return Response.json({
    ok: true,
    redirectTo: "/sign-in",
  });
}
