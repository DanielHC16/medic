// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { clearUserSessionMock, cookieSetMock, signOutMock } = vi.hoisted(() => ({
  clearUserSessionMock: vi.fn(),
  cookieSetMock: vi.fn(),
  signOutMock: vi.fn(),
}));

vi.mock("@/lib/auth/neon", () => ({
  neonAuth: {
    signOut: signOutMock,
  },
}));

vi.mock("@/lib/security/session", () => ({
  clearUserSession: clearUserSessionMock,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    set: cookieSetMock,
  })),
}));

describe("/api/auth/logout", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    signOutMock.mockResolvedValue(undefined);
    clearUserSessionMock.mockResolvedValue(undefined);
  });

  it("signs out of Neon Auth and clears app and Neon cookies", async () => {
    const { POST } = await import("./route");
    const response = await POST();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      ok: true,
      redirectTo: "/sign-in",
    });
    expect(signOutMock).toHaveBeenCalledOnce();
    expect(clearUserSessionMock).toHaveBeenCalledOnce();
    expect(cookieSetMock).toHaveBeenCalledWith(
      "__Secure-neon-auth.session_token",
      "",
      expect.objectContaining({ maxAge: 0, path: "/", secure: true }),
    );
    expect(cookieSetMock).toHaveBeenCalledWith(
      "neon-auth.session_token",
      "",
      expect.objectContaining({ maxAge: 0, path: "/" }),
    );
  });

  it("still completes logout cleanup when Neon Auth sign out fails", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    signOutMock.mockRejectedValue(new Error("stale session"));

    const { POST } = await import("./route");
    const response = await POST();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(clearUserSessionMock).toHaveBeenCalledOnce();
    expect(cookieSetMock).toHaveBeenCalledWith(
      "__Secure-neon-auth.local.session_data",
      "",
      expect.objectContaining({ maxAge: 0, path: "/", secure: true }),
    );
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});
