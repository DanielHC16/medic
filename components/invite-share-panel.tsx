"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import QRCode from "qrcode";

import { getPreferredPublicAppUrl } from "@/lib/app-url";
import { buildInvitePath, buildInviteUrl } from "@/lib/invite-links";

export function InviteSharePanel(props: {
  code: string;
  heading?: string;
  tone?: "embedded" | "standalone";
}) {
  const invitePath = useMemo(() => buildInvitePath(props.code), [props.code]);
  const currentOrigin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin || "",
    () => "",
  );
  const inviteUrl = useMemo(
    () => buildInviteUrl(getPreferredPublicAppUrl(currentOrigin), props.code),
    [currentOrigin, props.code],
  );
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    QRCode.toDataURL(inviteUrl, {
      color: {
        dark: "#2F3E34",
        light: "#F6F7F2",
      },
      margin: 1,
      width: 224,
    })
      .then((value) => {
        if (!cancelled) {
          setQrDataUrl(value);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrDataUrl(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [inviteUrl]);

  async function copyValue(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setFeedback(`${label} copied.`);
    } catch {
      setFeedback(`Unable to copy ${label.toLowerCase()} on this device.`);
    }
  }

  return (
    <section
      className={`rounded-3xl border border-[var(--color-border)] ${
        props.tone === "embedded" ? "bg-white" : "bg-[var(--color-surface-muted)]"
      } p-5`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-xl">
          <p className="text-base font-semibold text-[var(--foreground)]">
            {props.heading || "Share this invite"}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted-foreground)]">
            Scan the QR code or open the join link to continue with the correct MEDIC
            invite.
          </p>

          <div className="mt-4 grid gap-3">
            <InfoRow label="Invite code" value={props.code} />
            <InfoRow label="Join path" value={invitePath} />
            <InfoRow label="Share link" value={inviteUrl} />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => copyValue("Invite code", props.code)}
              className="medic-button"
            >
              Copy code
            </button>
            <button
              type="button"
              onClick={() => copyValue("Invite link", inviteUrl)}
              className="medic-button"
            >
              Copy link
            </button>
            <Link href={invitePath} className="medic-button medic-button-soft">
              Open join page
            </Link>
          </div>

          {feedback ? (
            <p className="mt-4 text-sm text-[var(--color-muted-foreground)]">{feedback}</p>
          ) : null}
        </div>

        <div className="flex min-w-[224px] flex-col items-center gap-3 rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          {qrDataUrl ? (
            <Image
              src={qrDataUrl}
              alt={`QR code for invite ${props.code}`}
              width={224}
              height={224}
              unoptimized
              className="h-56 w-56 rounded-2xl border border-[var(--color-border)] bg-white object-contain p-2"
            />
          ) : (
            <div className="flex h-56 w-56 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-white p-4 text-center text-sm text-[var(--color-muted-foreground)]">
              Generating QR code...
            </div>
          )}
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
            Scan to join
          </p>
        </div>
      </div>
    </section>
  );
}

function InfoRow(props: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
        {props.label}
      </p>
      <p className="mt-2 break-all text-sm leading-6 text-[var(--foreground)]">
        {props.value}
      </p>
    </div>
  );
}
