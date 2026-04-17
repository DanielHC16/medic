import { requireCurrentUser } from "@/lib/auth/dal";
import { updateUserAccount } from "@/lib/db/medic-data";
import { revalidateMedicAppPaths } from "@/lib/revalidation";
import { getOptionalString, getRequiredString } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = (await request.json()) as Record<string, unknown>;

    const updatedUser = await updateUserAccount({
      email: getRequiredString(body.email, "Email"),
      firstName: getRequiredString(body.firstName, "First name"),
      lastName: getRequiredString(body.lastName, "Last name"),
      phone: getOptionalString(body.phone),
      userId: user.userId,
    });

    revalidateMedicAppPaths();

    return Response.json({
      ok: true,
      user: updatedUser,
    });
  } catch (error) {
    return Response.json(
      {
        message: error instanceof Error ? error.message : "Failed to update profile.",
        ok: false,
      },
      { status: 400 },
    );
  }
}
