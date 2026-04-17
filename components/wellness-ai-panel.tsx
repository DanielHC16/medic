"use client";

import { useEffect, useState } from "react";

import { formatDayList } from "@/lib/display";
import type {
  WellnessAiResponse,
  WellnessRoutineSuggestion,
} from "@/lib/wellness-ai-shared";

type WellnessAiPanelProps = {
  canManage: boolean;
  onApplyRoutine: (routine: WellnessRoutineSuggestion) => Promise<void>;
  onLoadRoutineDraft: (routine: WellnessRoutineSuggestion) => void;
  onNotice: (message: string) => void;
  patientUserId: string;
};

type ApiPayload = WellnessAiResponse & {
  message?: string;
  ok: boolean;
};

export function WellnessAiPanel(props: WellnessAiPanelProps) {
  const [insight, setInsight] = useState<WellnessAiResponse | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(true);
  const [generatingRoutine, setGeneratingRoutine] = useState(false);
  const [applyingRoutine, setApplyingRoutine] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/wellness/recommendations?patientId=${encodeURIComponent(props.patientUserId)}`)
      .then((response) => response.json() as Promise<ApiPayload>)
      .then((payload) => {
        if (cancelled) {
          return;
        }

        if (!payload.ok) {
          throw new Error(payload.message || "Unable to load wellness insights.");
        }

        setInsight(payload);
        setError(null);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load wellness insights.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingInsight(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [props.patientUserId]);

  async function handleGenerateRoutine() {
    setGeneratingRoutine(true);
    setError(null);

    try {
      const response = await fetch("/api/wellness/recommendations", {
        body: JSON.stringify({
          patientUserId: props.patientUserId,
          userPrompt: prompt,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as ApiPayload;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Unable to generate a routine.");
      }

      setInsight(payload);
      props.onNotice(
        payload.source === "gemini"
          ? "AI routine ready to review."
          : "Backup routine ready to review while Gemini is unavailable.",
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to generate a routine.",
      );
    } finally {
      setGeneratingRoutine(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-black/5 bg-[linear-gradient(180deg,rgba(26,35,29,0.98)_0%,rgba(47,62,52,0.97)_100%)] p-6 text-white shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#dce5cf]">
            Medic AI Coach
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Personalized wellness guidance
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
            Uses the patient&apos;s medications, routines, appointments, and health notes to
            suggest gentle next steps.
          </p>
        </div>

        {insight ? (
          <span className="self-start rounded-full bg-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
            {insight.source === "gemini" ? "Gemini live" : "Backup guidance"}
          </span>
        ) : null}
      </div>

      <div className="mt-5 rounded-[1.5rem] bg-white/10 p-4 backdrop-blur-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/65">
          Today&apos;s feedback
        </p>
        <p className="mt-3 text-sm leading-7 text-white/90">
          {loadingInsight
            ? "Loading personalized guidance..."
            : insight?.recommendation || "No wellness guidance is available right now."}
        </p>
      </div>

      {props.canManage ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.5rem] bg-white/8 p-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-white">
                Ask for a routine focus
              </span>
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Example: Suggest a low-impact morning routine because walking feels tiring before lunch."
                className="medic-field min-h-28 !bg-white/95 !text-[var(--foreground)]"
              />
            </label>
            <p className="mt-3 text-xs leading-5 text-white/65">
              Leave this blank if you want Medic AI to use the current patient data only.
            </p>
            <button
              type="button"
              onClick={handleGenerateRoutine}
              disabled={generatingRoutine}
              className="medic-button medic-button-primary mt-4"
            >
              {generatingRoutine ? "Generating routine..." : "Generate AI routine"}
            </button>
          </div>

          <div className="rounded-[1.5rem] bg-white/8 p-4">
            <p className="text-sm font-semibold text-white">Routine preview</p>
            {insight?.routine ? (
              <div className="mt-3 grid gap-3">
                <div className="rounded-3xl bg-white/10 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-white">{insight.routine.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/65">
                        {insight.routine.category} / {insight.routine.frequencyType}
                      </p>
                    </div>
                    <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
                      {insight.routine.targetMinutes
                        ? `${insight.routine.targetMinutes} mins`
                        : "Flexible length"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/85">
                    {insight.routine.whyItFits}
                  </p>
                </div>

                <div className="rounded-3xl bg-white/10 p-4 text-sm leading-6 text-white/85">
                  <p>
                    <strong className="text-white">Days:</strong>{" "}
                    {formatDayList(insight.routine.daysOfWeek)}
                  </p>
                  <p className="mt-2">
                    <strong className="text-white">Instructions:</strong>{" "}
                    {insight.routine.instructions}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={applyingRoutine}
                    onClick={async () => {
                      setApplyingRoutine(true);
                      setError(null);

                      try {
                        await props.onApplyRoutine(insight.routine!);
                      } catch (requestError) {
                        setError(
                          requestError instanceof Error
                            ? requestError.message
                            : "Unable to save the AI routine.",
                        );
                      } finally {
                        setApplyingRoutine(false);
                      }
                    }}
                    className="medic-button self-start"
                  >
                    {applyingRoutine ? "Adding routine..." : "Use this routine draft"}
                  </button>
                  <button
                    type="button"
                    disabled={applyingRoutine}
                    onClick={() => {
                      props.onLoadRoutineDraft(insight.routine!);
                      props.onNotice("AI routine loaded into the Add routine form.");
                    }}
                    className="medic-button medic-button-soft self-start"
                  >
                    Edit before saving
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-white/70">
                Generate a routine to preview a draft that can be applied directly into the
                form below.
              </p>
            )}
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-2xl bg-[#fee2e2] px-4 py-3 text-sm text-[#7f1d1d]">
          {error}
        </p>
      ) : null}

      {insight?.source === "fallback" ? (
        <p className="mt-4 text-xs leading-5 text-white/60">
          {insight.message ||
            "Medic is using a backup recommendation from the patient's current data while Gemini is unavailable."}
        </p>
      ) : null}
    </section>
  );
}
