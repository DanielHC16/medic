import { getDefaultRouteForRole, requireCurrentUser } from "@/lib/auth/dal";
import { acceptInvitation } from "@/lib/db/medic-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();

    if (user.role === "patient") {
      return Response.json(
        {
          message: "Patients do not join care circles using invitation codes.",
          ok: false,
        },
        { status: 403 },
      );
    }

    const body = (await request.json()) as {
      code?: string;
    };
    const result = await acceptInvitation({
      code: body.code ?? "",
      userId: user.userId,
    });

    return Response.json({
      ok: true,
      redirectTo: getDefaultRouteForRole(user),
      result,
    });
  } catch (error) {
    return Response.json(
      {
        message: error instanceof Error ? error.message : "Failed to accept invitation.",
        ok: false,
      },
      { status: 400 },
    );
  }
}
