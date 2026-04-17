import type { ReactNode } from "react";

import { requireRole } from "@/lib/auth/dal";

export default async function PatientLayout(props: { children: ReactNode }) {
  await requireRole("patient");
  return props.children;
}
