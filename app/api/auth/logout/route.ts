import { clearUserSession } from "@/lib/security/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  await clearUserSession();

  return Response.json({
    ok: true,
    redirectTo: "/sign-in",
  });
}
