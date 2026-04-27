import { getDefaultRouteForRole } from "@/lib/auth/dal";
import { registerUserWithNeonAuth } from "@/lib/auth/neon-credentials";
import type { InviteApprovalMode, RoleSlug } from "@/lib/medic-types";
import { createUserSession } from "@/lib/security/session";
import {
  assertRole,
  getAssistanceLevel,
  getEmail,
  getInviteApprovalMode,
  getInviteCode,
  getOptionalString,
  getPassword,
  getPersonName,
  getPhoneNumber,
  getSeniorDateOfBirth,
} from "@/lib/validation";

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
    const inviteCode = role === "patient"
      ? undefined
      : getInviteCode(body.inviteCode, { required: false }) ?? undefined;
    const user = await registerUserWithNeonAuth({
      approvalMode: getInviteApprovalMode(body.approvalMode),
      assistanceLevel:
        role === "patient" ? getAssistanceLevel(body.assistanceLevel) : undefined,
      dateOfBirth:
        role === "patient"
          ? getSeniorDateOfBirth(body.dateOfBirth) ?? undefined
          : undefined,
      email: getEmail(body.email),
      emergencyNotes:
        role === "patient"
          ? getOptionalString(body.emergencyNotes, "Emergency notes", 1000) ?? undefined
          : undefined,
      firstName: getPersonName(body.firstName, "First name"),
      inviteCode,
      lastName: getPersonName(body.lastName, "Last name"),
      password: getPassword(body.password),
      phone: getPhoneNumber(body.phone),
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
