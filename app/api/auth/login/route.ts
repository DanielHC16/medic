import { getDefaultRouteForRole } from "@/lib/auth/dal";
import { authenticateUserWithNeonAuth } from "@/lib/auth/neon-credentials";
import { createUserSession } from "@/lib/security/session";
import {
  getLoginIdentifier,
  getLoginPassword,
  getOptionalRedirectPath,
} from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      identifier?: string;
      password?: string;
      redirectTo?: string;
    };
    const user = await authenticateUserWithNeonAuth({
      identifier: getLoginIdentifier(body.identifier),
      password: getLoginPassword(body.password),
    });

    await createUserSession(user);

    return Response.json({
      ok: true,
      redirectTo: getOptionalRedirectPath(body.redirectTo) || getDefaultRouteForRole(user),
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
