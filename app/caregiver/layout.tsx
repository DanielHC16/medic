import type { ReactNode } from "react";

import { requireRole } from "@/lib/auth/dal";

export default async function CaregiverLayout(props: { children: ReactNode }) {
  await requireRole("caregiver");
  return props.children;
}
