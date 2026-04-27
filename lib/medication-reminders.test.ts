import {
  getMedicationIntervalHours,
  getNextReminderSlot,
} from "@/lib/medication-reminders";
import type { MedicationLogRecord, MedicationRecord } from "@/lib/medic-types";

function createMedication(overrides: Partial<MedicationRecord> = {}): MedicationRecord {
  return {
    createdByDisplayName: "Caregiver",
    dosageUnit: "mg",
    dosageValue: "10",
    form: "Tablet",
    id: "med-test",
    imageDataUrl: null,
    instructions: null,
    intervalHours: null,
    isActive: true,
    latestLogStatus: null,
    latestTakenAt: null,
    name: "Test Medication",
    patientUserId: "user-patient",
    scheduleDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    scheduleFrequencyType: "three_times_daily",
    scheduleId: "sched-test",
    scheduleTimes: ["08:00", "16:00", "23:00"],
    ...overrides,
  };
}

function createLog(overrides: Partial<MedicationLogRecord> = {}): MedicationLogRecord {
  return {
    createdAt: "2026-04-27T02:00:00.000Z",
    id: "log-test",
    loggedForDate: "2026-04-27",
    medicationId: "med-test",
    medicationName: "Test Medication",
    notes: null,
    recordedByDisplayName: "Patient",
    scheduledFor: "2026-04-27T00:00:00.000Z",
    source: "online",
    status: "taken",
    takenAt: "2026-04-27T02:00:00.000Z",
    ...overrides,
  };
}

describe("medication reminder intervals", () => {
  it("uses frequency-based interval hours for repeated daily medications", () => {
    expect(getMedicationIntervalHours(createMedication())).toBe(8);
    expect(
      getMedicationIntervalHours(
        createMedication({
          scheduleFrequencyType: "twice_daily",
          scheduleTimes: ["08:00", "20:00"],
        }),
      ),
    ).toBe(12);
  });

  it("pushes the next dose after a late taken dose", () => {
    const medication = createMedication();
    const now = new Date(2026, 3, 27, 10, 15);
    const nextSlot = getNextReminderSlot(
      medication,
      [createLog({ takenAt: new Date(2026, 3, 27, 10, 0).toISOString() })],
      now,
    );

    expect(nextSlot?.getHours()).toBe(18);
    expect(nextSlot?.getMinutes()).toBe(0);
  });

  it("keeps a missed dose as the next actionable slot until it is taken", () => {
    const medication = createMedication();
    const now = new Date(2026, 3, 27, 10, 15);
    const nextSlot = getNextReminderSlot(
      medication,
      [createLog({ status: "missed", takenAt: null })],
      now,
    );

    expect(nextSlot?.getHours()).toBe(8);
    expect(nextSlot?.getMinutes()).toBe(0);
  });
});
