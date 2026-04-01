import { getDefaultRouteForRole } from "@/lib/auth/dal";
import { authenticateUser } from "@/lib/db/medic-data";
import { createUserSession } from "@/lib/security/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      identifier?: string;
      password?: string;
      redirectTo?: string;
    };
    const user = await authenticateUser({
      identifier: body.identifier ?? "",
      password: body.password ?? "",
    });

    await createUserSession(user);

    return Response.json({
      ok: true,
      redirectTo: body.redirectTo || getDefaultRouteForRole(user),
      user,
    });
  } catch (error) {
    return Response.json(
      {
        message: error instanceof Error ? error.message : "Login failed.",
        ok: false,
      },
      { status: 401 },
    );
  }
}
