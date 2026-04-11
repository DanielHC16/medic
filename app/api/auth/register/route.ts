import { getDefaultRouteForRole } from "@/lib/auth/dal";
import { registerUser } from "@/lib/db/medic-data";
import type { InviteApprovalMode, RoleSlug } from "@/lib/medic-types";
import { createUserSession } from "@/lib/security/session";
import { assertRole, getOptionalString, getRequiredString } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      approvalMode?: InviteApprovalMode;
      assistanceLevel?: string;
      dateOfBirth?: string;
      email?: string;
      emergencyNotes?: string;
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
      assistanceLevel: getOptionalString(body.assistanceLevel) ?? undefined,
      dateOfBirth:
        role === "patient"
          ? getRequiredString(body.dateOfBirth, "Date of birth")
          : getOptionalString(body.dateOfBirth) ?? undefined,
      email: getRequiredString(body.email, "Email"),
      emergencyNotes:
        role === "patient" ? getOptionalString(body.emergencyNotes) ?? undefined : undefined,
      firstName: getRequiredString(body.firstName, "First name"),
      inviteCode: getOptionalString(body.inviteCode) ?? undefined,
      lastName: getRequiredString(body.lastName, "Last name"),
      password: getRequiredString(body.password, "Password"),
      phone: getRequiredString(body.phone, "Phone"),
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
