"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { AuthenticatedUser } from "@/lib/medic-types";

type ProfileRelationshipItem = {
  id: string;
  subtitle: string;
  title: string;
};

export function AccountProfileManager(props: {
  heading: string;
  relationships: ProfileRelationshipItem[];
  roleNotes?: string[];
  shortcuts?: Array<{
    href: string;
    label: string;
  }>;
  user: AuthenticatedUser;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    email: props.user.email,
    firstName: props.user.firstName,
    lastName: props.user.lastName,
    phone: props.user.phone ?? "",
  });

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/profile", {
        body: JSON.stringify({
          email: formData.get("email"),
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          phone: formData.get("phone"),
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });

      const payload = (await response.json()) as {
        message?: string;
        ok: boolean;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Unable to update the account profile.");
      }

      setMessage("Profile details updated.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to update the account profile.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <article className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          {props.heading}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted-foreground)]">
          Keep your personal details current so the care circle and reminder flows stay
          accurate.
        </p>

        <form action={handleSubmit} className="mt-6 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[var(--foreground)]">
                First name
              </span>
              <input
                name="firstName"
                required
                value={formState.firstName}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    firstName: event.target.value,
                  }))
                }
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
                value={formState.lastName}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    lastName: event.target.value,
                  }))
                }
                className="medic-field"
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Email</span>
            <input
              name="email"
              required
              type="email"
              value={formState.email}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              className="medic-field"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Phone</span>
            <input
              name="phone"
              value={formState.phone}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
              className="medic-field"
              placeholder="09170000000"
            />
          </label>

          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm leading-6 text-[var(--color-muted-foreground)]">
            Current role:{" "}
            <span className="font-semibold text-[var(--foreground)]">
              {props.user.role.replace("_", " ")}
            </span>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="medic-button medic-button-primary"
          >
            {pending ? "Saving profile..." : "Save profile"}
          </button>
        </form>

        {message ? (
          <p className="mt-4 rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--foreground)]">
            {message}
          </p>
        ) : null}
      </article>

      <div className="grid gap-6">
        <article className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Linked access
          </h2>
          <div className="mt-4 grid gap-4">
            {props.relationships.length === 0 ? (
              <p className="rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
                No linked records yet.
              </p>
            ) : (
              props.relationships.map((item) => (
                <article
                  key={item.id}
                  className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                >
                  <p className="text-lg font-semibold text-[var(--foreground)]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                    {item.subtitle}
                  </p>
                </article>
              ))
            )}
          </div>
        </article>

        {props.roleNotes?.length ? (
          <article className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              Role notes
            </h2>
            <div className="mt-4 grid gap-3">
              {props.roleNotes.map((note) => (
                <p
                  key={note}
                  className="rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm leading-6 text-[var(--color-muted-foreground)]"
                >
                  {note}
                </p>
              ))}
            </div>
          </article>
        ) : null}

        {props.shortcuts?.length ? (
          <article className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              Quick links
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {props.shortcuts.map((shortcut) => (
                <Link
                  key={shortcut.href}
                  href={shortcut.href}
                  className="medic-button medic-button-soft text-sm"
                >
                  {shortcut.label}
                </Link>
              ))}
            </div>
          </article>
        ) : null}
      </div>
    </section>
  );
}
