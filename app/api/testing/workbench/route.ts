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
  getOptionalString,
  getRequiredString,
} from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TestingBody = Record<string, unknown> & {
  kind?: string;
};

function getCsvArray(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

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
    return createdByUserId.trim();
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
        assistanceLevel: getOptionalString(body.assistanceLevel) || undefined,
        dateOfBirth: getOptionalString(body.dateOfBirth) || undefined,
        email: getRequiredString(body.email, "Email"),
        firstName: getRequiredString(body.firstName, "First name"),
        lastName: getRequiredString(body.lastName, "Last name"),
        password: getOptionalString(body.password) || "MedicTest123!",
        phone: getOptionalString(body.phone) || undefined,
        role,
      });

      return Response.json({
        created: createdUser,
        message: `${createdUser.firstName} ${createdUser.lastName} was added as ${createdUser.role}.`,
        ok: true,
      });
    }

    if (kind === "invite") {
      const patientUserId = getRequiredString(body.patientUserId, "Patient");
      await ensurePatientUser(patientUserId);
      const memberRole = assertRole(body.memberRole);

      if (memberRole === "patient") {
        throw new Error("Invite role must be caregiver or family member.");
      }

      const invitation = await createInvitation({
        approvalMode:
          getRequiredString(body.approvalMode, "Approval mode") === "auto"
            ? "auto"
            : "manual",
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
      const patientUserId = getRequiredString(body.patientUserId, "Patient");
      await ensurePatientUser(patientUserId);
      const medicationId = await createMedicationWithSchedule({
        createdByUserId: await resolveCreatorUserId(body.createdByUserId, patientUserId),
        daysOfWeek: getCsvArray(body.daysOfWeek),
        dosageUnit: getOptionalString(body.dosageUnit),
        dosageValue: getRequiredString(body.dosageValue, "Dosage value"),
        form: getRequiredString(body.form, "Form"),
        frequencyType: getRequiredString(body.frequencyType, "Frequency"),
        instructions: getOptionalString(body.instructions),
        name: getRequiredString(body.name, "Medication name"),
        patientUserId,
        timesOfDay: getCsvArray(body.timesOfDay),
      });

      return Response.json({
        medicationId,
        message: "Medication record added to the database.",
        ok: true,
      });
    }

    if (kind === "activity") {
      const patientUserId = getRequiredString(body.patientUserId, "Patient");
      await ensurePatientUser(patientUserId);

      await createActivityPlan({
        category: getRequiredString(body.category, "Category"),
        createdByUserId: await resolveCreatorUserId(body.createdByUserId, patientUserId),
        daysOfWeek: getCsvArray(body.daysOfWeek),
        frequencyType: getRequiredString(body.frequencyType, "Frequency"),
        instructions: getOptionalString(body.instructions),
        patientUserId,
        targetMinutes:
          typeof body.targetMinutes === "number"
            ? body.targetMinutes
            : Number(body.targetMinutes || 0) || null,
        title: getRequiredString(body.title, "Activity title"),
      });

      return Response.json({
        message: "Activity routine added to the database.",
        ok: true,
      });
    }

    if (kind === "appointment") {
      const patientUserId = getRequiredString(body.patientUserId, "Patient");
      await ensurePatientUser(patientUserId);

      await createAppointment({
        appointmentAt: getRequiredString(body.appointmentAt, "Appointment date and time"),
        createdByUserId: await resolveCreatorUserId(body.createdByUserId, patientUserId),
        location: getOptionalString(body.location),
        notes: getOptionalString(body.notes),
        patientUserId,
        providerName: getOptionalString(body.providerName),
        title: getRequiredString(body.title, "Appointment title"),
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
