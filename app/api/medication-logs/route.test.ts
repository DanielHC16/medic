// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  canManagePatientDataMock,
  listMedicationLogsForPatientMock,
  markMedicationLogTakenMock,
  recordMedicationLogMock,
  requirePatientScopeMock,
  revalidateMedicAppPathsMock,
} = vi.hoisted(() => ({
  canManagePatientDataMock: vi.fn(),
  listMedicationLogsForPatientMock: vi.fn(),
  markMedicationLogTakenMock: vi.fn(),
  recordMedicationLogMock: vi.fn(),
  requirePatientScopeMock: vi.fn(),
  revalidateMedicAppPathsMock: vi.fn(),
}));

vi.mock("@/lib/auth/dal", () => ({
  canManagePatientData: canManagePatientDataMock,
  requirePatientScope: requirePatientScopeMock,
}));

vi.mock("@/lib/db/medic-data", () => ({
  listMedicationLogsForPatient: listMedicationLogsForPatientMock,
  markMedicationLogTaken: markMedicationLogTakenMock,
  recordMedicationLog: recordMedicationLogMock,
}));

vi.mock("@/lib/revalidation", () => ({
  revalidateMedicAppPaths: revalidateMedicAppPathsMock,
}));

describe("/api/medication-logs", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    canManagePatientDataMock.mockReturnValue(true);
    requirePatientScopeMock.mockResolvedValue({
      patientUserId: "user-patient",
      user: {
        role: "patient",
        userId: "user-patient",
      },
    });
    listMedicationLogsForPatientMock.mockResolvedValue([]);
    markMedicationLogTakenMock.mockResolvedValue("log-missed");
    recordMedicationLogMock.mockResolvedValue("log-new");
  });

  it("resolves an existing missed log when taking it now", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/medication-logs", {
        body: JSON.stringify({
          localDate: "2026-04-27",
          logId: "log-missed",
          medicationId: "med-aspirin",
          patientUserId: "user-patient",
          scheduledFor: "2026-04-27T08:00:00.000Z",
          status: "taken",
          takenAt: "2026-04-27T10:00:00.000Z",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ logId: "log-missed", ok: true });
    expect(markMedicationLogTakenMock).toHaveBeenCalledWith(
      expect.objectContaining({
        logId: "log-missed",
        medicationId: "med-aspirin",
        patientUserId: "user-patient",
        scheduledFor: "2026-04-27T08:00:00.000Z",
        takenAt: "2026-04-27T10:00:00.000Z",
      }),
    );
    expect(recordMedicationLogMock).not.toHaveBeenCalled();
  });

  it("creates a new medication log when no missed log is being resolved", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/medication-logs", {
        body: JSON.stringify({
          localDate: "2026-04-27",
          medicationId: "med-aspirin",
          patientUserId: "user-patient",
          scheduledFor: "2026-04-27T08:00:00.000Z",
          status: "missed",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ logId: "log-new", ok: true });
    expect(recordMedicationLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        medicationId: "med-aspirin",
        patientUserId: "user-patient",
        status: "missed",
      }),
    );
    expect(markMedicationLogTakenMock).not.toHaveBeenCalled();
  });
});
