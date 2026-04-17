import type { ReactNode } from "react";

import { requireRole } from "@/lib/auth/dal";

export default async function FamilyLayout(props: { children: ReactNode }) {
  await requireRole("family_member");
  return props.children;
}
