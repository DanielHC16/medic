import { getDefaultRouteForRole } from "@/lib/auth/dal";
import { registerUser } from "@/lib/db/medic-data";
import type { InviteApprovalMode, RoleSlug } from "@/lib/medic-types";
import { createUserSession } from "@/lib/security/session";
import { assertRole } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      approvalMode?: InviteApprovalMode;
      assistanceLevel?: string;
      dateOfBirth?: string;
      email?: string;
      firstName?: string;
      inviteCode?: string;
      lastName?: string;
      password?: string;
      phone?: string;
      role?: RoleSlug;
    };

    const role = assertRole(body.role);
    const user = await registerUser({
      approvalMode: body.approvalMode,
      assistanceLevel: body.assistanceLevel,
      dateOfBirth: body.dateOfBirth,
      email: body.email ?? "",
      firstName: body.firstName ?? "",
      inviteCode: body.inviteCode,
      lastName: body.lastName ?? "",
      password: body.password ?? "",
      phone: body.phone,
      role,
    });

    await createUserSession(user);

    return Response.json({
      ok: true,
      redirectTo: getDefaultRouteForRole(user),
      user,
    });
  } catch (error) {
    return Response.json(
      {
        message: error instanceof Error ? error.message : "Registration failed.",
        ok: false,
      },
      { status: 400 },
    );
  }
}
