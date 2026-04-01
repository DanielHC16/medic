import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { JoinPatientPanel } from "@/components/care-circle-manager";
import { getCurrentUser } from "@/lib/auth/dal";

type JoinPageProps = {
  searchParams: Promise<{
    code?: string;
  }>;
};

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    const resolvedSearchParams = await searchParams;
    const codeSuffix = resolvedSearchParams.code ? `?code=${resolvedSearchParams.code}` : "";
    redirect(`/sign-in${codeSuffix}`);
  }

  if (user.role === "patient") {
    redirect("/patient/care-circle");
  }

  const resolvedSearchParams = await searchParams;

  return (
    <AppShell
      user={user}
      title="Join a Patient"
      description="Validate an invite code, preview the patient, and confirm the connection request."
      links={[
        {
          href: `/${user.role === "caregiver" ? "caregiver" : "family"}/dashboard`,
          label: "Back to dashboard",
        },
      ]}
    >
      <JoinPatientPanel
        defaultCode={resolvedSearchParams.code ?? null}
        role={user.role}
      />
    </AppShell>
  );
}
