import { requireCurrentUser } from "@/lib/auth/dal";
import {
  createInvitation,
  getInvitationPreviewByCode,
  listInvitationsForPatient,
} from "@/lib/db/medic-data";
import type { InviteApprovalMode, RoleSlug } from "@/lib/medic-types";
import { assertRole } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const preview = await getInvitationPreviewByCode(code);

    return Response.json({
      ok: true,
      preview,
    });
  }

  const user = await requireCurrentUser();

  if (user.role !== "patient") {
    return Response.json(
      {
        message: "Only patients can list invitations they created.",
        ok: false,
      },
      { status: 403 },
    );
  }

  const invitations = await listInvitationsForPatient(user.userId);

  return Response.json({
    invitations,
    ok: true,
  });
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();

    if (user.role !== "patient") {
      return Response.json(
        {
          message: "Only patients can create new invitations.",
          ok: false,
        },
        { status: 403 },
      );
    }

    const body = (await request.json()) as {
      approvalMode?: InviteApprovalMode;
      memberRole?: RoleSlug;
    };
    const memberRole = assertRole(body.memberRole);

    if (memberRole === "patient") {
      throw new Error("Patient invitations must target caregiver or family roles.");
    }

    const invitation = await createInvitation({
      approvalMode: body.approvalMode ?? "manual",
      createdByUserId: user.userId,
      memberRole,
      patientUserId: user.userId,
    });

    return Response.json({
      invitation,
      ok: true,
    });
  } catch (error) {
    return Response.json(
      {
        message: error instanceof Error ? error.message : "Failed to create invitation.",
        ok: false,
      },
      { status: 400 },
    );
  }
}
