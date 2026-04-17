import { revalidatePath } from "next/cache";

const MEDIC_APP_PATHS = [
  "/profile",
  "/settings",
  "/wellness",
  "/join",
  "/patient/profile",
  "/patient/dashboard",
  "/patient/care-circle",
  "/patient/alerts",
  "/patient/health-info",
  "/patient/medications",
  "/patient/schedule",
  "/patient/settings",
  "/caregiver/dashboard",
  "/caregiver/monitoring",
  "/caregiver/profile",
  "/family/dashboard",
  "/family/updates",
  "/family/profile",
] as const;

export function revalidateMedicAppPaths(extraPaths: string[] = []) {
  const uniquePaths = new Set([...MEDIC_APP_PATHS, ...extraPaths]);

  for (const path of uniquePaths) {
    revalidatePath(path);
  }
}
