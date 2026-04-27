import { getErrorMessage } from "@/lib/api/errors";
import {
  createActivityPlan,
  createAppointment,
  createInvitation,
  createMedicationWithSchedule,
  getUserById,
  registerUser,
} from "@/lib/db/medic-data";
import { isTestingWorkbenchEnabled } from "@/lib/testing";
import {
  assertRole,
  getAssistanceLevel,
  getDateTime,
  getDosageUnit,
  getDosageValue,
  getEmail,
  getEntityId,
  getInviteApprovalMode,
  getOptionalString,
  getPassword,
  getPersonName,
  getPhoneNumber,
  getPositiveInteger,
  getRequiredString,
  getRoutineFrequency,
  getMedicationFrequency,
  getSafeText,
  getSeniorDateOfBirth,
  getTimeArray,
  getWeekdayArray,
} from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TestingBody = Record<string, unknown> & {
  kind?: string;
};

function ensureWorkbenchEnabled() {
  if (!isTestingWorkbenchEnabled()) {
    throw new Error(
      "The direct testing workbench is disabled. Enable it only for local testing environments.",
    );
  }
}

async function resolveCreatorUserId(
  createdByUserId: unknown,
  patientUserId: string,
) {
  if (typeof createdByUserId === "string" && createdByUserId.trim().length > 0) {
    return getEntityId(createdByUserId, "Creator");
  }

  return patientUserId;
}

async function ensurePatientUser(userId: string) {
  const user = await getUserById(userId);

  if (!user || user.role !== "patient") {
    throw new Error("Select a valid patient record.");
  }

  return user;
}

export async function POST(request: Request) {
  try {
    ensureWorkbenchEnabled();
    const body = (await request.json()) as TestingBody;
    const kind = getRequiredString(body.kind, "Testing action");

    if (kind === "user") {
      const role = assertRole(body.role);
      const createdUser = await registerUser({
        assistanceLevel:
          role === "patient" ? getAssistanceLevel(body.assistanceLevel) : undefined,
        dateOfBirth:
          role === "patient"
            ? getSeniorDateOfBirth(body.dateOfBirth) ?? undefined
            : undefined,
        email: getEmail(body.email),
        firstName: getPersonName(body.firstName, "First name"),
        lastName: getPersonName(body.lastName, "Last name"),
        password: body.password ? getPassword(body.password) : "MedicTest123!",
        phone: getPhoneNumber(body.phone, "Phone", { required: false }) || undefined,
        role,
      });

      return Response.json({
        created: createdUser,
        message: `${createdUser.firstName} ${createdUser.lastName} was added as ${createdUser.role}.`,
        ok: true,
      });
    }

    if (kind === "invite") {
      const patientUserId = getEntityId(body.patientUserId, "Patient");
      await ensurePatientUser(patientUserId);
      const memberRole = assertRole(body.memberRole);

      if (memberRole === "patient") {
        throw new Error("Invite role must be caregiver or family member.");
      }

      const invitation = await createInvitation({
        approvalMode: getInviteApprovalMode(body.approvalMode),
        createdByUserId: await resolveCreatorUserId(body.createdByUserId, patientUserId),
        memberRole,
        patientUserId,
      });

      return Response.json({
        invitation,
        message: `Invite ${invitation.code} was created for ${invitation.memberRole}.`,
        ok: true,
      });
    }

    if (kind === "medication") {
      const patientUserId = getEntityId(body.patientUserId, "Patient");
      await ensurePatientUser(patientUserId);
      const medicationId = await createMedicationWithSchedule({
        createdByUserId: await resolveCreatorUserId(body.createdByUserId, patientUserId),
        daysOfWeek: getWeekdayArray(body.daysOfWeek),
        dosageUnit: getDosageUnit(body.dosageUnit),
        dosageValue: getDosageValue(body.dosageValue),
        form: getSafeText(body.form, "Form", { maxLength: 60 }),
        frequencyType: getMedicationFrequency(body.frequencyType),
        instructions: getOptionalString(body.instructions, "Instructions", 1000),
        name: getSafeText(body.name, "Medication name", {
          maxLength: 100,
          minLength: 2,
        }),
        patientUserId,
        timesOfDay: getTimeArray(body.timesOfDay),
      });

      return Response.json({
        medicationId,
        message: "Medication record added to the database.",
        ok: true,
      });
    }

    if (kind === "activity") {
      const patientUserId = getEntityId(body.patientUserId, "Patient");
      await ensurePatientUser(patientUserId);

      await createActivityPlan({
        category: getSafeText(body.category, "Category", { maxLength: 60 }),
        createdByUserId: await resolveCreatorUserId(body.createdByUserId, patientUserId),
        daysOfWeek: getWeekdayArray(body.daysOfWeek),
        frequencyType: getRoutineFrequency(body.frequencyType),
        instructions: getOptionalString(body.instructions, "Instructions", 1000),
        patientUserId,
        targetMinutes: getPositiveInteger(body.targetMinutes, "Target minutes", {
          max: 240,
          required: false,
        }),
        title: getSafeText(body.title, "Activity title", {
          maxLength: 100,
          minLength: 2,
        }),
      });

      return Response.json({
        message: "Activity routine added to the database.",
        ok: true,
      });
    }

    if (kind === "appointment") {
      const patientUserId = getEntityId(body.patientUserId, "Patient");
      await ensurePatientUser(patientUserId);

      await createAppointment({
        appointmentAt: getDateTime(body.appointmentAt, "Appointment date and time"),
        createdByUserId: await resolveCreatorUserId(body.createdByUserId, patientUserId),
        location: getOptionalString(body.location, "Location", 200),
        notes: getOptionalString(body.notes, "Notes", 1000),
        patientUserId,
        providerName: getOptionalString(body.providerName, "Provider name", 120),
        title: getSafeText(body.title, "Appointment title", {
          maxLength: 120,
          minLength: 2,
        }),
      });

      return Response.json({
        message: "Appointment added to the database.",
        ok: true,
      });
    }

    return Response.json(
      {
        message: `Unknown testing action: ${kind}.`,
        ok: false,
      },
      { status: 400 },
    );
  } catch (error) {
    return Response.json(
      {
        message: getErrorMessage(error),
        ok: false,
      },
      { status: 400 },
    );
  }
}
