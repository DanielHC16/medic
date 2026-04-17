import { redirect } from "next/navigation";

import {
  getCareMemberDashboardData,
  getPatientDashboardData,
  getUserById,
  listLinkedPatientsForMember,
} from "@/lib/db/medic-data";
import type { AuthenticatedUser, RoleSlug, SessionUser } from "@/lib/medic-types";
import { readUserSession } from "@/lib/security/session";

export async function getCurrentSessionUser() {
  return readUserSession();
}

export async function getCurrentUser() {
  const session = await getCurrentSessionUser();

  if (!session) {
    return null;
  }

  return getUserById(session.userId);
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return user;
}

export async function requireRole(role: RoleSlug) {
  const user = await requireCurrentUser();

  if (user.role !== role) {
    redirect(getDefaultRouteForRole(user));
  }

  return user;
}

export function getDefaultRouteForRole(
  user: SessionUser | AuthenticatedUser | RoleSlug,
) {
  const role = typeof user === "string" ? user : user.role;

  switch (role) {
    case "patient":
      return "/patient/dashboard";
    case "caregiver":
      return "/caregiver/dashboard";
    case "family_member":
      return "/family/dashboard";
    default:
      return "/";
  }
}

export function getProfileRouteForRole(role: RoleSlug) {
  switch (role) {
    case "patient":
      return "/profile";
    case "caregiver":
      return "/caregiver/profile";
    case "family_member":
      return "/family/profile";
    default:
      return "/";
  }
}

export function getSettingsRouteForRole(role: RoleSlug) {
  return role === "patient" ? "/patient/settings" : "/settings";
}

export async function requirePatientScope(requestedPatientId?: string | null) {
  const user = await requireCurrentUser();

  if (user.role === "patient") {
    return {
      patientUserId: user.userId,
      user,
    };
  }

  const linkedPatients = await listLinkedPatientsForMember(user.userId);
  const activePatients = linkedPatients.filter(
    (relationship) => relationship.relationshipStatus === "active",
  );
  const selectedPatientUserId = requestedPatientId || activePatients[0]?.patientUserId || null;

  if (!selectedPatientUserId) {
    return {
      patientUserId: null,
      user,
    };
  }

  const allowed = activePatients.some(
    (relationship) =>
      relationship.patientUserId === selectedPatientUserId,
  );

  if (!allowed) {
    return {
      patientUserId: null,
      user,
    };
  }

  return {
    patientUserId: selectedPatientUserId,
    user,
  };
}

export async function getDashboardForCurrentUser(patientUserId?: string | null) {
  const user = await requireCurrentUser();

  if (user.role === "patient") {
    return {
      role: "patient" as const,
      data: await getPatientDashboardData(user.userId),
    };
  }

  return {
    role: user.role,
    data: await getCareMemberDashboardData({
      patientUserId,
      userId: user.userId,
    }),
  };
}

export function canManagePatientData(role: RoleSlug) {
  return role === "patient" || role === "caregiver";
}
