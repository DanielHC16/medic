"use client";

import { startTransition, useState } from "react";

import type { ApiScaffold } from "@/lib/medic-blueprint";

type ResultState = {
  error?: string;
  pending?: boolean;
  payload?: unknown;
  status?: number;
};

type TestLabProps = {
  foundationChecks: ApiScaffold[];
  placeholderChecks: ApiScaffold[];
};

export function TestLab({
  foundationChecks,
  placeholderChecks,
}: TestLabProps) {
  const [results, setResults] = useState<Record<string, ResultState>>({});

  function runCheck(check: ApiScaffold) {
    setResults((current) => ({
      ...current,
      [check.id]: {
        pending: true,
      },
    }));

    startTransition(async () => {
      try {
        const response = await fetch(check.path, {
          headers: {
            "Content-Type": "application/json",
          },
          method: check.method,
        });

        const rawText = await response.text();
        const payload = rawText ? tryParseJson(rawText) : null;

        setResults((current) => ({
          ...current,
          [check.id]: {
            payload,
            pending: false,
            status: response.status,
          },
        }));
      } catch (error) {
        setResults((current) => ({
          ...current,
          [check.id]: {
            error: error instanceof Error ? error.message : "Unknown request error",
            pending: false,
          },
        }));
      }
    });
  }

  return (
    <div className="space-y-8">
      <TestSection
        title="Foundation Checks"
        description="Start here first. These checks confirm the app is alive, Neon is reachable, and the initial MEDIC test data can be prepared."
        checks={foundationChecks}
        results={results}
        onRun={runCheck}
      />
      <TestSection
        title="Feature Route Checks"
        description="These endpoints represent the current patient, caregiver, family, medication, schedule, and sync scaffolds."
        checks={placeholderChecks}
        results={results}
        onRun={runCheck}
      />
    </div>
  );
}

type TestSectionProps = {
  title: string;
  description: string;
  checks: ApiScaffold[];
  results: Record<string, ResultState>;
  onRun: (check: ApiScaffold) => void;
};

function TestSection({
  title,
  description,
  checks,
  results,
  onRun,
}: TestSectionProps) {
  return (
    <section className="rounded-[2rem] border border-white/15 bg-[var(--color-surface)] p-6 shadow-[0_20px_48px_rgba(6,18,11,0.18)]">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          {title}
        </h2>
        <p className="max-w-3xl text-base leading-7 text-[var(--color-muted-foreground)]">
          {description}
        </p>
      </div>

      <div className="mt-6 grid gap-5">
        {checks.map((check) => {
          const result = results[check.id];
          const tone = getMethodTone(check.method);

          return (
            <article
              key={check.id}
              className="rounded-[1.85rem] border border-[var(--color-border)] bg-white p-5 shadow-[0_12px_24px_rgba(47,62,52,0.07)]"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className="font-label rounded-full px-3 py-1 text-xs font-semibold tracking-wide"
                      style={{
                        backgroundColor: tone.background,
                        color: tone.foreground,
                      }}
                    >
                      {check.method}
                    </span>
                    <code className="text-sm font-semibold text-[var(--foreground)]">
                      {check.path}
                    </code>
                    <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-medium text-[var(--color-muted-foreground)]">
                      {check.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[var(--color-muted-foreground)]">
                    {check.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onRun(check)}
                  className="medic-button medic-button-primary"
                  aria-busy={result?.pending ? "true" : undefined}
                >
                  {result?.pending ? "Running..." : "Run Check"}
                </button>
              </div>

              <div className="mt-5 rounded-[1.5rem] bg-[var(--color-primary-strong)] p-4 text-sm text-[var(--color-surface)]">
                <p className="mb-3 font-label text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-secondary)]">
                  {result?.status
                    ? `HTTP ${result.status}`
                    : "No response captured yet"}
                </p>
                <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs leading-6 text-[rgba(246,247,242,0.92)]">
                  {formatResult(result)}
                </pre>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function formatResult(result?: ResultState) {
  if (!result) {
    return "Run this endpoint to capture a response.";
  }

  if (result.pending) {
    return "Request in progress...";
  }

  if (result.error) {
    return result.error;
  }

  return JSON.stringify(result.payload, null, 2);
}

function tryParseJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function getMethodTone(method: ApiScaffold["method"]) {
  switch (method) {
    case "POST":
      return {
        background: "rgba(233, 196, 106, 0.24)",
        foreground: "var(--color-primary-strong)",
      };
    case "PATCH":
      return {
        background: "rgba(93, 173, 226, 0.22)",
        foreground: "var(--color-primary-strong)",
      };
    case "GET":
    default:
      return {
        background: "rgba(163, 177, 138, 0.28)",
        foreground: "var(--color-primary-strong)",
      };
  }
}
