import { requireCurrentUser } from "@/lib/auth/dal";
import { updateUserAccount } from "@/lib/db/medic-data";
import { revalidateMedicAppPaths } from "@/lib/revalidation";
import {
  getEmail,
  getOptionalImageDataUrl,
  getPersonName,
  getPhoneNumber,
} from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireCurrentUser();

  return Response.json({
    ok: true,
    user,
  });
}

export async function PATCH(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = (await request.json()) as Record<string, unknown>;

    const updatedUser = await updateUserAccount({
      email: getEmail(body.email),
      firstName: getPersonName(body.firstName, "First name"),
      lastName: getPersonName(body.lastName, "Last name"),
      phone: getPhoneNumber(body.phone, "Phone", { required: false }),
      profileImageDataUrl: getOptionalImageDataUrl(body.profileImageDataUrl, "Profile photo"),
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
