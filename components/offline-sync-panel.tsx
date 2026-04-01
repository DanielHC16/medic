"use client";

import { useState } from "react";

import type { MedicationRecord } from "@/lib/medic-types";

type OfflineOperation = {
  clientRef: string;
  medicationId: string;
  patientUserId: string;
  scheduledFor: string;
  status: "taken";
  takenAt: string;
};

function getQueueKey(patientUserId: string) {
  return `medic-offline-queue:${patientUserId}`;
}

function readQueue(patientUserId: string) {
  if (typeof window === "undefined") {
    return [] as OfflineOperation[];
  }

  const rawValue = window.localStorage.getItem(getQueueKey(patientUserId));

  if (!rawValue) {
    return [] as OfflineOperation[];
  }

  try {
    return JSON.parse(rawValue) as OfflineOperation[];
  } catch {
    return [] as OfflineOperation[];
  }
}

function writeQueue(patientUserId: string, operations: OfflineOperation[]) {
  window.localStorage.setItem(getQueueKey(patientUserId), JSON.stringify(operations));
}

export function OfflineSyncPanel(props: {
  medications: MedicationRecord[];
  patientUserId: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [operations, setOperations] = useState<OfflineOperation[]>(() =>
    readQueue(props.patientUserId),
  );
  const [selectedMedicationId, setSelectedMedicationId] = useState(
    props.medications[0]?.id ?? "",
  );

  async function queueOfflineLog() {
    if (!selectedMedicationId) {
      setMessage("Select a medication first.");
      return;
    }

    const nextOperation: OfflineOperation = {
      clientRef: `offline-${crypto.randomUUID()}`,
      medicationId: selectedMedicationId,
      patientUserId: props.patientUserId,
      scheduledFor: new Date().toISOString(),
      status: "taken",
      takenAt: new Date().toISOString(),
    };
    const nextQueue = [...operations, nextOperation];

    writeQueue(props.patientUserId, nextQueue);
    setOperations(nextQueue);
    setMessage("Medication log queued locally for later sync.");
  }

  async function pushQueue() {
    if (operations.length === 0) {
      setMessage("No offline operations are waiting.");
      return;
    }

    const response = await fetch("/api/sync/push", {
      body: JSON.stringify({
        deviceId: "browser-local",
        operations,
        patientUserId: props.patientUserId,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const payload = (await response.json()) as {
      message?: string;
      ok: boolean;
      result?: {
        appliedCount: number;
      };
    };

    if (!response.ok || !payload.ok) {
      setMessage(payload.message || "Offline sync failed.");
      return;
    }

    writeQueue(props.patientUserId, []);
    setOperations([]);
    setMessage(`Synced ${payload.result?.appliedCount || 0} queued medication logs.`);
  }

  async function pullLatest() {
    const response = await fetch("/api/sync/pull", {
      body: JSON.stringify({
        patientUserId: props.patientUserId,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const payload = (await response.json()) as {
      ok: boolean;
      payload?: {
        medications?: unknown[];
        recentLogs?: unknown[];
      };
    };

    if (!response.ok || !payload.ok) {
      setMessage("Unable to pull the latest schedules and logs.");
      return;
    }

    setMessage(
      `Pulled ${payload.payload?.medications?.length || 0} schedules and ${
        payload.payload?.recentLogs?.length || 0
      } recent logs from the cloud.`,
    );
  }

  return (
    <section className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
      <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        Offline Sync Skeleton
      </h2>
      <p className="mt-3 text-sm leading-6 text-[var(--color-muted-foreground)]">
        This first offline layer stores medication log actions locally in the browser,
        then pushes them to Neon using the sync API. It is designed as the initial
        bridge before the dedicated SQLite/OPFS layer is added.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto_auto_auto]">
        <select
          value={selectedMedicationId}
          onChange={(event) => setSelectedMedicationId(event.target.value)}
          className="medic-field"
        >
          {props.medications.map((medication) => (
            <option key={medication.id} value={medication.id}>
              {medication.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={queueOfflineLog}
          className="medic-button text-sm"
        >
          Queue offline log
        </button>
        <button
          type="button"
          onClick={pushQueue}
          className="medic-button medic-button-primary text-sm"
        >
          Sync push
        </button>
        <button
          type="button"
          onClick={pullLatest}
          className="medic-button text-sm"
        >
          Sync pull
        </button>
      </div>

      <div className="mt-5 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
        <p className="text-sm font-medium text-[var(--foreground)]">
          Queued operations: {operations.length}
        </p>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-xs text-[var(--color-muted-foreground)]">
          {JSON.stringify(operations, null, 2)}
        </pre>
      </div>

      {message ? (
        <p className="mt-4 rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--foreground)]">
          {message}
        </p>
      ) : null}
    </section>
  );
}
