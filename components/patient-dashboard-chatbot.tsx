"use client";

import { useEffect, useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";

import type {
  PatientChatMessage,
  PatientChatResponse,
} from "@/lib/chatbot-ai-shared";

type PatientDashboardChatbotProps = {
  enabled: boolean;
};

type ChatbotBootstrapPayload = {
  enabled: boolean;
  message?: string;
  ok: boolean;
  suggestions: string[];
  welcomeMessage: string;
};

type ChatbotReplyPayload = PatientChatResponse & {
  ok: boolean;
};

type LocalMessage = PatientChatMessage & {
  id: string;
};

export function PatientDashboardChatbot(props: PatientDashboardChatbotProps) {
  const [open, setOpen] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [sourceLabel, setSourceLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!props.enabled || !open || bootstrapped || loading) {
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch("/api/chatbot")
      .then((response) => response.json() as Promise<ChatbotBootstrapPayload>)
      .then((payload) => {
        if (cancelled) {
          return;
        }

        if (!payload.ok) {
          throw new Error(payload.message || "Unable to load the chatbot.");
        }

        setMessages([
          {
            content: payload.welcomeMessage,
            id: createMessageId("assistant"),
            role: "assistant",
          },
        ]);
        setSuggestions(payload.suggestions);
        setStatusNote(null);
        setSourceLabel(null);
        setBootstrapped(true);
      })
      .catch((error) => {
        if (!cancelled) {
          setMessages([
            {
              content:
                error instanceof Error
                  ? error.message
                  : "Unable to load the chatbot right now.",
              id: createMessageId("assistant"),
              role: "assistant",
            },
          ]);
          setSuggestions([]);
          setBootstrapped(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bootstrapped, loading, open, props.enabled]);

  if (!props.enabled) {
    return null;
  }

  async function sendMessage(content: string) {
    const trimmed = content.trim();

    if (!trimmed || sending) {
      return;
    }

    const nextMessages = [
      ...messages,
      {
        content: trimmed,
        id: createMessageId("user"),
        role: "user" as const,
      },
    ];

    setMessages(nextMessages);
    setDraft("");
    setSending(true);
    setStatusNote(null);

    try {
      const response = await fetch("/api/chatbot", {
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            content: message.content,
            role: message.role,
          })),
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as ChatbotReplyPayload;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Unable to send the message.");
      }

      setMessages((current) => [
        ...current,
        {
          content: payload.reply,
          id: createMessageId("assistant"),
          role: "assistant",
        },
      ]);
      setSuggestions(payload.suggestions);
      setSourceLabel(payload.source === "gemini" ? "Gemini live" : "Backup reply");
      setStatusNote(payload.source === "fallback" ? payload.message || null : null);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          content:
            error instanceof Error
              ? error.message
              : "Unable to send the message right now.",
          id: createMessageId("assistant"),
          role: "assistant",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Open chatbot"
        onClick={() => setOpen(true)}
        className="pd-icon-btn"
      >
        <Bot className="h-5 w-5" />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 backdrop-blur-sm sm:items-center"
          onClick={() => setOpen(false)}
        >
          <section
            className="mx-4 flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-[2rem] bg-[#F6F7F2] text-[#1A231D] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-black/5 bg-[#2F3E34] px-5 py-4 text-white">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                  Medic AI
                </p>
                <h2 className="mt-1 text-xl font-semibold">Chatbot</h2>
                <p className="mt-1 text-sm text-white/75">
                  Ask about your medications, routines, appointments, and notes.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close chatbot"
                onClick={() => setOpen(false)}
                className="rounded-full bg-white/10 p-2 transition hover:bg-white/15"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#5C8B6B]">
                  <Sparkles className="h-4 w-4" />
                  <span>{sourceLabel || "Ready"}</span>
                </div>
                {sending ? (
                  <span className="text-xs text-[#73847B]">Thinking...</span>
                ) : null}
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 pb-4">
                {loading ? (
                  <p className="rounded-3xl bg-white px-4 py-3 text-sm text-[#73847B] shadow-sm">
                    Loading chatbot...
                  </p>
                ) : null}

                {messages.map((message) => (
                  <article
                    key={message.id}
                    className={`max-w-[88%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${
                      message.role === "assistant"
                        ? "self-start bg-white text-[#1A231D]"
                        : "self-end bg-[#5C8B6B] text-white"
                    }`}
                  >
                    {message.content}
                  </article>
                ))}

                {statusNote ? (
                  <p className="rounded-2xl bg-[#E8EFEA] px-4 py-3 text-xs leading-5 text-[#4E6C57]">
                    {statusNote}
                  </p>
                ) : null}
              </div>

              {suggestions.length > 0 ? (
                <div className="border-t border-black/5 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#73847B]">
                    Suggested questions
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        disabled={sending}
                        onClick={() => void sendMessage(suggestion)}
                        className="rounded-full border border-[#CAD5CC] bg-white px-3 py-2 text-left text-xs font-semibold text-[#2F3E34] transition hover:bg-[#EEF3EF] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void sendMessage(draft);
                }}
                className="border-t border-black/5 px-5 py-4"
              >
                <label className="sr-only" htmlFor="patient-chatbot-input">
                  Ask the chatbot
                </label>
                <div className="flex items-end gap-3">
                  <textarea
                    id="patient-chatbot-input"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Ask about your medications, routines, or appointments."
                    className="medic-field min-h-24 flex-1"
                  />
                  <button
                    type="submit"
                    disabled={sending || draft.trim().length === 0}
                    className="medic-button medic-button-primary self-stretch px-4 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function createMessageId(role: "assistant" | "user") {
  return `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
