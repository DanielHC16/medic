import Link from "next/link";
import { redirect } from "next/navigation";

import { SignUpForm } from "@/components/auth-forms";
import { getCurrentSessionUser, getDefaultRouteForRole } from "@/lib/auth/dal";

type SignUpPageProps = {
  searchParams: Promise<{
    code?: string;
  }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const sessionUser = await getCurrentSessionUser();

  if (sessionUser) {
    redirect(getDefaultRouteForRole(sessionUser));
  }

  const resolvedSearchParams = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-10">
      <section className="rounded-[2rem] border border-black/5 bg-white/90 p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-primary)]">
          MEDIC
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--foreground)]">
          Create your MEDIC account
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-muted-foreground)]">
          Patient accounts start the care circle. Caregivers and family members can
          also register directly, then join a patient using an invite code or link.
        </p>
      </section>

      <SignUpForm defaultInviteCode={resolvedSearchParams.code ?? null} />

      <section className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[var(--foreground)]">
          Already have an account?
        </h2>
        <Link
          href="/sign-in"
          className="medic-button mt-4"
        >
          Go to sign in
        </Link>
      </section>
    </main>
  );
}
