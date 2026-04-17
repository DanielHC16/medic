import type { WellnessContext } from "@/lib/wellness-ai-shared";
import {
  buildFallbackWellnessInsight,
  sanitizeRoutineSuggestion,
} from "@/lib/wellness-ai-shared";

function createContext(overrides?: Partial<WellnessContext>): WellnessContext {
  return {
    activityLogs: [],
    activityPlans: [],
    activitySummary: {
      activePlans: 2,
      completedToday: 1,
      missedToday: 0,
    },
    appointments: [
      {
        appointmentAt: "2099-04-20T10:00:00.000Z",
        id: "appointment-1",
        location: "Clinic A",
        notes: "Bring medication list",
        providerName: "Dr. Cruz",
        status: "scheduled",
        title: "Follow-up visit",
      },
    ],
    careCircle: {
      activeCaregivers: 1,
      activeFamilyMembers: 1,
      pendingRequests: 0,
    },
    medicationSummary: {
      activeMedications: 2,
      dueToday: 2,
      loggedToday: 1,
      missedToday: 0,
      skippedToday: 0,
      takenToday: 1,
    },
    medications: [
      {
        createdByDisplayName: "Caregiver One",
        dosageUnit: "mg",
        dosageValue: "5",
        form: "Tablet",
        id: "med-1",
        imageDataUrl: null,
        instructions: "Take after breakfast.",
        isActive: true,
        latestLogStatus: "taken",
        latestTakenAt: "2099-04-19T08:00:00.000Z",
        name: "Amlodipine",
        patientUserId: "patient-1",
        scheduleDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        scheduleFrequencyType: "daily",
        scheduleId: "sched-1",
        scheduleTimes: ["08:00"],
      },
    ],
    patientProfile: {
      assistanceLevel: "caregiver_assistance",
      dateOfBirth: "1958-09-07",
      emergencyNotes: "Use chair support when balance feels off.",
      patientUserId: "patient-1",
    },
    patientUserId: "patient-1",
    user: {
      accountStatus: "active",
      email: "patient@example.com",
      firstName: "Walter",
      lastName: "White",
      onboardingStatus: "ready",
      phone: null,
      preferences: {
        chatbotEnabled: true,
        dailySummaryEnabled: true,
        highContrastEnabled: false,
        largeTextEnabled: false,
        preferredContactMethod: "app",
        timeFormat: "12h",
      },
      profileImageDataUrl: null,
      role: "patient",
      userId: "patient-1",
    },
    ...overrides,
  };
}

describe("sanitizeRoutineSuggestion", () => {
  it("normalizes days, frequency, and minutes from raw model output", () => {
    const routine = sanitizeRoutineSuggestion({
      category: " Walking ",
      daysOfWeek: ["monday", "wed", "Friday"],
      frequencyType: "selected days",
      instructions: "  Keep it light and steady.  ",
      targetMinutes: 18.7,
      title: " Morning Walk ",
      whyItFits: " Fits the patient schedule. ",
    });

    expect(routine).toEqual({
      category: "Walking",
      daysOfWeek: ["Mon", "Wed", "Fri"],
      frequencyType: "weekly",
      instructions: "Keep it light and steady.",
      targetMinutes: 19,
      title: "Morning Walk",
      whyItFits: "Fits the patient schedule.",
    });
  });

  it("returns null when the model response does not include a usable title and category", () => {
    expect(
      sanitizeRoutineSuggestion({
        daysOfWeek: ["Mon"],
        instructions: "Example",
      }),
    ).toBeNull();
  });
});

describe("buildFallbackWellnessInsight", () => {
  it("creates a gentle mobility-focused routine when the profile suggests support needs", () => {
    const insight = buildFallbackWellnessInsight(createContext(), {
      requestType: "routine",
      userPrompt: "Need a simple routine for tight mornings.",
    });

    expect(insight.source).toBe("fallback");
    expect(insight.routine).not.toBeNull();
    expect(insight.routine?.category).toBe("mobility");
    expect(insight.routine?.instructions).toContain("Use a stable chair");
  });

  it("prioritizes medication attention in the fallback recommendation text", () => {
    const insight = buildFallbackWellnessInsight(
      createContext({
        medicationSummary: {
          activeMedications: 2,
          dueToday: 2,
          loggedToday: 2,
          missedToday: 1,
          skippedToday: 1,
          takenToday: 0,
        },
      }),
      {
        requestType: "recommendation",
      },
    );

    expect(insight.recommendation).toContain("2 medication entries");
    expect(insight.routine).toBeNull();
  });

  it("uses the next scheduled medication in the fallback recommendation when the day is fully completed", () => {
    const insight = buildFallbackWellnessInsight(
      createContext({
        activitySummary: {
          activePlans: 2,
          completedToday: 2,
          missedToday: 0,
        },
        appointments: [],
        medicationSummary: {
          activeMedications: 2,
          dueToday: 2,
          loggedToday: 2,
          missedToday: 0,
          skippedToday: 0,
          takenToday: 2,
        },
      }),
      {
        requestType: "recommendation",
      },
    );

    expect(insight.recommendation).toContain("Amlodipine");
    expect(insight.recommendation).toContain("8:00 AM");
  });
});
