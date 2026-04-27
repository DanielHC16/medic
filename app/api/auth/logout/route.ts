import { cookies } from "next/headers";

import { neonAuth } from "@/lib/auth/neon";
import { clearUserSession } from "@/lib/security/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NEON_AUTH_COOKIE_NAMES = [
  "__Secure-neon-auth.session_token",
  "__Secure-neon-auth.local.session_data",
  "__Secure-neon-auth.session_data",
  "__Secure-neon-auth.dont_remember",
  "__Secure-neon-auth.session_challange",
  "__Secure-neon-auth.session_challenge",
  "neon-auth.session_token",
  "neon-auth.local.session_data",
  "neon-auth.session_data",
  "neon-auth.dont_remember",
  "neon-auth.session_challange",
  "neon-auth.session_challenge",
];

async function clearNeonAuthCookies() {
  const cookieStore = await cookies();

  for (const cookieName of NEON_AUTH_COOKIE_NAMES) {
    cookieStore.set(cookieName, "", {
      httpOnly: true,
      maxAge: 0,
      path: "/",
      sameSite: "lax",
      secure:
        cookieName.startsWith("__Secure-") || process.env.NODE_ENV === "production",
    });
  }
}

export async function POST() {
  try {
    await neonAuth.signOut();
  } catch (error) {
    console.warn("[auth/logout] Neon Auth sign out failed; clearing local cookies.", error);
  }

  await clearUserSession();
  await clearNeonAuthCookies();

  return Response.json({
    ok: true,
    redirectTo: "/sign-in",
  });
}
