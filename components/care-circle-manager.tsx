"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { CareInvitationPreview, CareRelationship, RoleSlug } from "@/lib/medic-types";

type CareCircleManagerProps = {
  connections: CareRelationship[];
  invitations: CareInvitationPreview[];
  patientUserId: string;
};

export function CareCircleManager({
  connections,
  invitations,
  patientUserId,
}: CareCircleManagerProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleCreateInvite(formData: FormData) {
    setPending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/invitations", {
        body: JSON.stringify({
          approvalMode: formData.get("approvalMode"),
          memberRole: formData.get("memberRole"),
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as {
        invitation?: CareInvitationPreview & { inviteLink: string };
        message?: string;
        ok: boolean;
      };

      if (!response.ok || !payload.ok || !payload.invitation) {
        throw new Error(payload.message || "Failed to create invitation.");
      }

      setMessage(
        `Invite created: ${payload.invitation.code} | Link: ${payload.invitation.inviteLink}`,
      );
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to create invitation.");
    } finally {
      setPending(false);
    }
  }

  async function handleRelationshipAction(
    relationshipId: string,
    action: "approve" | "revoke",
  ) {
    setPending(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/relationships/${relationshipId}/${action}`, {
        method: "POST",
      });

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string };
        throw new Error(payload.message || "Action failed.");
      }

      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Generate Invite
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted-foreground)]">
          Generate an invite code and share the code or link with a caregiver or family
          member. The same payload can be used later for QR sharing.
        </p>

        <form action={handleCreateInvite} className="mt-5 grid gap-4">
          <input type="hidden" name="patientUserId" value={patientUserId} />
          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">
              Invite role
            </span>
            <select
              name="memberRole"
              className="medic-field"
              defaultValue="caregiver"
            >
              <option value="caregiver">Caregiver</option>
              <option value="family_member">Family Member</option>
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">
              Approval mode
            </span>
            <select
              name="approvalMode"
              className="medic-field"
              defaultValue="manual"
            >
              <option value="manual">Patient approves request</option>
              <option value="auto">Auto-approve</option>
            </select>
          </label>

          <button
            type="submit"
            disabled={pending}
            className="medic-button medic-button-primary"
          >
            {pending ? "Generating..." : "Generate code and link"}
          </button>
        </form>

        {message ? (
          <p className="mt-4 rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--foreground)]">
            {message}
          </p>
        ) : null}

        <div className="mt-6 rounded-3xl border border-dashed border-[var(--color-border)] p-4 text-sm leading-6 text-[var(--color-muted-foreground)]">
          QR generation is intentionally left as the next UI enhancement layer. The
          invite code and invite link are already functional.
        </div>
      </section>

      <section className="grid gap-6">
        <div className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Active and Pending Connections
          </h2>
          <div className="mt-4 grid gap-4">
            {connections.length === 0 ? (
              <p className="rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
                No care-circle connections yet.
              </p>
            ) : (
              connections.map((connection) => (
                <article
                  key={connection.id}
                  className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-[var(--foreground)]">
                        {connection.relatedDisplayName}
                      </p>
                      <p className="text-sm text-[var(--color-muted-foreground)]">
                        {connection.memberRole} · {connection.relationshipStatus}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {connection.relationshipStatus === "pending" ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleRelationshipAction(connection.id, "approve")
                          }
                          className="medic-button medic-button-primary px-4 py-2 text-sm"
                        >
                          Approve
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleRelationshipAction(connection.id, "revoke")}
                        className="medic-button px-4 py-2 text-sm"
                      >
                        Remove access
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Invite History
          </h2>
          <div className="mt-4 grid gap-4">
            {invitations.length === 0 ? (
              <p className="rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
                No invites have been generated yet.
              </p>
            ) : (
              invitations.map((invitation) => (
                <article
                  key={invitation.inviteId}
                  className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                >
                  <p className="text-lg font-semibold text-[var(--foreground)]">
                    {invitation.memberRole}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                    Code {invitation.code} · {invitation.status} ·{" "}
                    {invitation.approvalMode} approval
                  </p>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export function JoinPatientPanel(props: {
  defaultCode?: string | null;
  role: Exclude<RoleSlug, "patient">;
}) {
  const router = useRouter();
  const [code, setCode] = useState(props.defaultCode ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [preview, setPreview] = useState<CareInvitationPreview | null>(null);

  async function loadPreview() {
    setPending(true);
    setMessage(null);

    try {
      const trimmedCode = code.trim().toUpperCase();
      const response = await fetch(`/api/invitations?code=${trimmedCode}`);
      const payload = (await response.json()) as {
        ok: boolean;
        preview: CareInvitationPreview | null;
      };

      if (!payload.preview) {
        throw new Error("No active invite matched that code.");
      }

      setPreview(payload.preview);
    } catch (error) {
      setPreview(null);
      setMessage(error instanceof Error ? error.message : "Unable to load invite.");
    } finally {
      setPending(false);
    }
  }

  async function joinPatient() {
    setPending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/invitations/accept", {
        body: JSON.stringify({
          code,
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
        result?: {
          relationshipStatus: string;
        };
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Unable to join this patient.");
      }

      setMessage(`Join request ${payload.result?.relationshipStatus || "submitted"}.`);
      router.push(payload.redirectTo || `/${props.role}/dashboard`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to join.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
      <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        Join a Patient
      </h2>
      <p className="mt-3 text-sm leading-6 text-[var(--color-muted-foreground)]">
        Paste an invite code or open a patient invite link to preview the patient and
        confirm the connection.
      </p>

      <div className="mt-5 flex flex-col gap-3 md:flex-row">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className="medic-field flex-1 uppercase"
          placeholder="CARE123"
        />
        <button
          type="button"
          onClick={loadPreview}
          disabled={pending}
          className="medic-button"
        >
          Preview invite
        </button>
      </div>

      {preview ? (
        <div className="mt-5 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
          <p className="text-lg font-semibold text-[var(--foreground)]">
            {preview.patientDisplayName}
          </p>
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
            Role requested: {preview.memberRole} · Approval: {preview.approvalMode}
          </p>
          <button
            type="button"
            onClick={joinPatient}
            disabled={pending}
            className="medic-button medic-button-primary mt-4"
          >
            Confirm join
          </button>
        </div>
      ) : null}

      {message ? (
        <p className="mt-4 rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--foreground)]">
          {message}
        </p>
      ) : null}
    </section>
  );
}
