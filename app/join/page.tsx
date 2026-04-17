import { redirect } from "next/navigation";

import { JoinPatientPanel } from "@/components/care-circle-manager";
import { getCurrentUser } from "@/lib/auth/dal";

type JoinPageProps = {
  searchParams: Promise<{
    code?: string;
  }>;
};

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const user = await getCurrentUser();
  const resolvedSearchParams = await searchParams;

  if (!user) {
    const codeSuffix = resolvedSearchParams.code ? `?code=${resolvedSearchParams.code}` : "";
    redirect(`/sign-in${codeSuffix}`);
  }

  // If a patient accidentally lands here, send them to their own care circle management
  if (user.role === "patient") {
    redirect("/patient/care-circle");
  }

  return (
    <div className="min-h-screen bg-[#Eef1f4] pb-32 font-sans">
      <main className="px-6 pt-10">
        
        {/* --- JOIN PANEL CONTENT --- */}
        <div className="rounded-[2.5rem] bg-white p-6 shadow-sm border border-black/5">
          <JoinPatientPanel
            defaultCode={resolvedSearchParams.code ?? null}
            role={user.role}
          />
        </div>
      </main>
    </div>
  );
}
