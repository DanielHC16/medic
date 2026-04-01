import Link from "next/link";
import { redirect } from "next/navigation";

import { SignInForm } from "@/components/auth-forms";
import { getCurrentSessionUser, getDefaultRouteForRole } from "@/lib/auth/dal";

type SignInPageProps = {
  searchParams: Promise<{
    code?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const sessionUser = await getCurrentSessionUser();

  if (sessionUser) {
    redirect(getDefaultRouteForRole(sessionUser));
  }

  const resolvedSearchParams = await searchParams;
  const redirectTo = resolvedSearchParams.code
    ? `/join?code=${resolvedSearchParams.code}`
    : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-10">
      <section className="rounded-[2rem] border border-black/5 bg-white/90 p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-primary)]">
          MEDIC
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--foreground)]">
          Sign in to MEDIC
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-muted-foreground)]">
          Patients land on their home dashboard. Caregivers and family members can
          join a patient after signing in.
        </p>
      </section>

      <SignInForm redirectTo={redirectTo} />

      <section className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[var(--foreground)]">Need an account?</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted-foreground)]">
          Create a patient, caregiver, or family-member account and continue with the
          setup flow.
        </p>
        <Link
          href="/sign-up"
          className="medic-button medic-button-primary mt-4"
        >
          Go to sign up
        </Link>
      </section>
    </main>
  );
}
