// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireCurrentUserMock,
  revalidateMedicAppPathsMock,
  updateUserAccountMock,
} = vi.hoisted(() => ({
  requireCurrentUserMock: vi.fn(),
  revalidateMedicAppPathsMock: vi.fn(),
  updateUserAccountMock: vi.fn(),
}));

vi.mock("@/lib/auth/dal", () => ({
  requireCurrentUser: requireCurrentUserMock,
}));

vi.mock("@/lib/db/medic-data", () => ({
  updateUserAccount: updateUserAccountMock,
}));

vi.mock("@/lib/revalidation", () => ({
  revalidateMedicAppPaths: revalidateMedicAppPathsMock,
}));

function createUser() {
  return {
    accountStatus: "active",
    email: "patient@example.com",
    firstName: "Walter",
    lastName: "White",
    onboardingStatus: "ready",
    phone: "09170000000",
    preferences: {
      chatbotEnabled: true,
      dailySummaryEnabled: true,
      highContrastEnabled: false,
      largeTextEnabled: false,
      preferredContactMethod: "app",
      timeFormat: "12h",
    },
    profileImageDataUrl: "data:image/png;base64,AAA",
    role: "patient",
    userId: "patient-1",
  };
}

describe("/api/profile", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    requireCurrentUserMock.mockResolvedValue(createUser());
    updateUserAccountMock.mockResolvedValue(createUser());
  });

  it("returns the signed-in user for GET requests", async () => {
    const { GET } = await import("./route");
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.user).toEqual(expect.objectContaining({ userId: "patient-1" }));
  });

  it("passes email, phone, and profile image updates through PATCH", async () => {
    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost/api/profile", {
        body: JSON.stringify({
          email: "updated@example.com",
          firstName: "Walter",
          lastName: "White",
          phone: "09181112222",
          profileImageDataUrl: "data:image/png;base64,BBB",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(updateUserAccountMock).toHaveBeenCalledWith({
      email: "updated@example.com",
      firstName: "Walter",
      lastName: "White",
      phone: "09181112222",
      profileImageDataUrl: "data:image/png;base64,BBB",
      userId: "patient-1",
    });
    expect(revalidateMedicAppPathsMock).toHaveBeenCalled();
  });
});
