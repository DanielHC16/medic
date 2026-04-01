"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { RoleSlug } from "@/lib/medic-types";

export function SignInForm(props: { redirectTo?: string | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        body: JSON.stringify({
          identifier: formData.get("identifier"),
          password: formData.get("password"),
          redirectTo: props.redirectTo,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const payload = (await response.json()) as {
        message?: string;
        ok: boolean;
        redirectTo?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Unable to sign in.");
      }

      router.push(payload.redirectTo || "/");
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to sign in.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      action={handleSubmit}
      className="rounded-[2rem] border border-black/5 bg-white/90 p-8 shadow-sm"
    >
      <h2 className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">
        Sign In
      </h2>
      <p className="mt-3 text-sm leading-6 text-[var(--color-muted-foreground)]">
        Use email or phone plus password. Demo accounts are seeded for quick testing.
      </p>

      <div className="mt-6 grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-[var(--foreground)]">
            Email or phone
          </span>
          <input
            name="identifier"
            required
            className="medic-field"
            placeholder="patient.demo@medic.local"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-[var(--foreground)]">
            Password
          </span>
          <input
            name="password"
            required
            type="password"
            className="medic-field"
            placeholder="DemoPass123!"
          />
        </label>
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="medic-button medic-button-primary mt-6"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

export function SignUpForm(props: { defaultInviteCode?: string | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [role, setRole] = useState<RoleSlug>("patient");

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        body: JSON.stringify({
          approvalMode: formData.get("approvalMode"),
          assistanceLevel: formData.get("assistanceLevel"),
          dateOfBirth: formData.get("dateOfBirth"),
          email: formData.get("email"),
          firstName: formData.get("firstName"),
          inviteCode: formData.get("inviteCode"),
          lastName: formData.get("lastName"),
          password: formData.get("password"),
          phone: formData.get("phone"),
          role: formData.get("role"),
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const payload = (await response.json()) as {
        message?: string;
        ok: boolean;
        redirectTo?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Unable to create the account.");
      }

      router.push(payload.redirectTo || "/");
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to create the account.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      action={handleSubmit}
      className="rounded-[2rem] border border-black/5 bg-white/90 p-8 shadow-sm"
    >
      <h2 className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">
        Create Account
      </h2>
      <p className="mt-3 text-sm leading-6 text-[var(--color-muted-foreground)]">
        Patients can start their profile immediately. Caregivers and family members can
        join later using an invite code or link.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-[var(--foreground)]">
            First name
          </span>
          <input
            name="firstName"
            required
            className="medic-field"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-[var(--foreground)]">
            Last name
          </span>
          <input
            name="lastName"
            required
            className="medic-field"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-[var(--foreground)]">
            Email
          </span>
          <input
            name="email"
            required
            type="email"
            className="medic-field"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-[var(--foreground)]">
            Phone
          </span>
          <input
            name="phone"
            className="medic-field"
            placeholder="09170000004"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-[var(--foreground)]">Role</span>
          <select
            name="role"
            value={role}
            onChange={(event) => setRole(event.target.value as RoleSlug)}
            className="medic-field"
          >
            <option value="patient">Patient</option>
            <option value="caregiver">Caregiver</option>
            <option value="family_member">Family Member</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-[var(--foreground)]">
            Password
          </span>
          <input
            name="password"
            required
            type="password"
            className="medic-field"
          />
        </label>
      </div>

      {role === "patient" ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">
              Date of birth
            </span>
            <input
              name="dateOfBirth"
              type="date"
              className="medic-field"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">
              Assistance level
            </span>
            <select
              name="assistanceLevel"
              className="medic-field"
            >
              <option value="independent">Independent</option>
              <option value="minimal_assistance">Minimal assistance</option>
              <option value="caregiver_assistance">Needs caregiver assistance</option>
              <option value="family_support">Needs family support</option>
            </select>
          </label>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">
              Invite code
            </span>
            <input
              name="inviteCode"
              defaultValue={props.defaultInviteCode ?? ""}
              className="medic-field uppercase"
              placeholder="CARE123"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">
              Approval handling
            </span>
            <select
              name="approvalMode"
              className="medic-field"
            >
              <option value="manual">Request approval</option>
              <option value="auto">Auto-approve if allowed</option>
            </select>
          </label>
        </div>
      )}

      {error ? (
        <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="medic-button medic-button-primary mt-6"
      >
        {pending ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
