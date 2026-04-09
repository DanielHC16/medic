"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { buildInvitePath, normalizeInviteCode } from "@/lib/invite-links";
import type {
  CareInvitationPreview,
  CareRelationship,
  RoleSlug,
  ShareableInvitation,
} from "@/lib/medic-types";

import { InviteScanner } from "@/components/invite-scanner";
import { InviteSharePanel } from "@/components/invite-share-panel";

type CareCircleManagerProps = {
  connections: CareRelationship[];
  invitations: CareInvitationPreview[];
  patientUserId: string;
};

function formatRoleLabel(role: RoleSlug) {
  return role === "family_member" ? "Family member" : "Caregiver";
}

export function CareCircleManager({
  connections,
  invitations,
  patientUserId,
}: CareCircleManagerProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [latestInvitation, setLatestInvitation] = useState<ShareableInvitation | null>(null);
  const [expandedInviteCode, setExpandedInviteCode] = useState<string | null>(
    invitations[0]?.code ?? null,
  );

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
        invitation?: ShareableInvitation;
        message?: string;
        ok: boolean;
      };

      if (!response.ok || !payload.ok || !payload.invitation) {
        throw new Error(payload.message || "Failed to create invitation.");
      }

      setLatestInvitation(payload.invitation);
      setExpandedInviteCode(payload.invitation.code);
      setMessage(`Invite ${payload.invitation.code} is ready to share.`);
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

      setMessage(
        action === "approve" ? "Connection approved." : "Access removed successfully.",
      );
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setPending(false);
    }
  }

  const activeSharedInvitation =
    latestInvitation ||
    invitations.find((invitation) => invitation.code === expandedInviteCode) ||
    null;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="grid gap-6">
        <article className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Generate invite
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted-foreground)]">
            Create a caregiver or family-member invite, then share the code, deep link,
            or QR code directly from this screen.
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
                <option value="family_member">Family member</option>
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
                <option value="auto">Auto-approve after join</option>
              </select>
            </label>

            <button
              type="submit"
              disabled={pending}
              className="medic-button medic-button-primary"
            >
              {pending ? "Generating..." : "Generate invite QR and link"}
            </button>
          </form>

          {message ? (
            <p className="mt-4 rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--foreground)]">
              {message}
            </p>
          ) : null}
        </article>

        {activeSharedInvitation ? (
          <InviteSharePanel
            code={activeSharedInvitation.code}
            heading={`Share ${formatRoleLabel(activeSharedInvitation.memberRole)} invite`}
            tone="embedded"
          />
        ) : null}
      </section>

      <section className="grid gap-6">
        <div className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Active and pending connections
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
                        {formatRoleLabel(connection.memberRole)} /{" "}
                        {connection.relationshipStatus}
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
            Invite history
          </h2>
          <div className="mt-4 grid gap-4">
            {invitations.length === 0 ? (
              <p className="rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
                No invites have been generated yet.
              </p>
            ) : (
              invitations.map((invitation) => {
                const isExpanded = expandedInviteCode === invitation.code;

                return (
                  <article
                    key={invitation.inviteId}
                    className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-[var(--foreground)]">
                          {formatRoleLabel(invitation.memberRole)}
                        </p>
                        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                          Code {invitation.code} / {invitation.status} /{" "}
                          {invitation.approvalMode} approval
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedInviteCode(isExpanded ? null : invitation.code)
                        }
                        className="medic-button medic-button-soft px-4 py-2 text-sm"
                      >
                        {isExpanded ? "Hide QR" : "Show QR"}
                      </button>
                    </div>

                    {isExpanded ? (
                      <div className="mt-4">
                        <InviteSharePanel code={invitation.code} tone="embedded" />
                      </div>
                    ) : null}
                  </article>
                );
              })
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

  const loadPreviewFromCode = useCallback(async (rawCode: string) => {
    setPending(true);
    setMessage(null);

    try {
      const trimmedCode = normalizeInviteCode(rawCode);
      const response = await fetch(`/api/invitations?code=${trimmedCode}`);
      const payload = (await response.json()) as {
        ok: boolean;
        preview: CareInvitationPreview | null;
      };

      if (!payload.preview || payload.preview.status !== "active") {
        throw new Error("No active invite matched that code.");
      }

      setCode(trimmedCode);
      setPreview(payload.preview);
    } catch (error) {
      setPreview(null);
      setMessage(error instanceof Error ? error.message : "Unable to load invite.");
    } finally {
      setPending(false);
    }
  }, []);

  useEffect(() => {
    if (props.defaultCode) {
      void loadPreviewFromCode(props.defaultCode);
    }
  }, [loadPreviewFromCode, props.defaultCode]);

  async function joinPatient() {
    setPending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/invitations/accept", {
        body: JSON.stringify({
          code: normalizeInviteCode(code),
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

  const roleMismatch = preview ? preview.memberRole !== props.role : false;

  return (
    <section className="grid gap-6 rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Join a patient
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted-foreground)]">
          Paste the invite code, open a join link, or scan the QR code to preview the
          patient before confirming the connection.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className="medic-field flex-1 uppercase"
          placeholder="QRCAR8"
        />
        <button
          type="button"
          onClick={() => loadPreviewFromCode(code)}
          disabled={pending}
          className="medic-button"
        >
          Preview invite
        </button>
      </div>

      <InviteScanner
        onCodeDetected={(nextCode) => {
          setCode(nextCode);
          void loadPreviewFromCode(nextCode);
        }}
      />

      {preview ? (
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
          <p className="text-lg font-semibold text-[var(--foreground)]">
            {preview.patientDisplayName}
          </p>
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
            Role requested: {formatRoleLabel(preview.memberRole)} / Approval:{" "}
            {preview.approvalMode}
          </p>
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
            Deep link: {buildInvitePath(preview.code)}
          </p>

          {roleMismatch ? (
            <p className="mt-4 rounded-2xl bg-[rgba(217,123,123,0.14)] px-4 py-3 text-sm text-[var(--foreground)]">
              This invite is for a {formatRoleLabel(preview.memberRole)} account. Sign in
              or sign up with the matching role to continue.
            </p>
          ) : (
            <button
              type="button"
              onClick={joinPatient}
              disabled={pending}
              className="medic-button medic-button-primary mt-4"
            >
              Confirm join
            </button>
          )}
        </div>
      ) : null}

      {message ? (
        <p className="rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--foreground)]">
          {message}
        </p>
      ) : null}
    </section>
  );
}
