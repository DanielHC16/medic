import { redirect } from "next/navigation";

import { CareMemberBottomNav } from "@/components/care-member-bottom-nav";
import { JoinPatientPanel } from "@/components/care-circle-manager";
import { getCurrentUser } from "@/lib/auth/dal";

type FamilyJoinPageProps = {
  searchParams: Promise<{
    code?: string;
  }>;
};

export default async function FamilyJoinPage({ searchParams }: FamilyJoinPageProps) {
  const user = await getCurrentUser();
  const resolvedSearchParams = await searchParams;

  if (!user) {
    const codeSuffix = resolvedSearchParams.code ? `?code=${resolvedSearchParams.code}` : "";
    redirect(`/sign-in${codeSuffix}`);
  }

  if (user.role === "patient") {
    redirect("/patient/care-circle");
  }

  if (user.role === "caregiver") {
    const codeSuffix = resolvedSearchParams.code ? `?code=${resolvedSearchParams.code}` : "";
    redirect(`/caregiver/join${codeSuffix}`);
  }

  return (
    <div className="min-h-screen bg-[#Eef1f4] pb-32 font-sans">
      <main className="px-6 pt-10">
        <div className="rounded-[2.5rem] bg-white p-6 shadow-sm border border-black/5">
          <JoinPatientPanel
            defaultCode={resolvedSearchParams.code ?? null}
            role={user.role}
          />
        </div>
      </main>

      <CareMemberBottomNav activeItem="join" role="family_member" />
    </div>
  );
}
