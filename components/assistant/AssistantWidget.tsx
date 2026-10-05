"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bot, Eraser, Loader2, SendHorizontal, Sparkles, X } from "lucide-react";
import {
  answerLocally,
  buildSnapshot,
  snapshotForAi,
  STARTER_PROMPTS,
  type AssistantReply,
  type ChatMessage,
} from "@/lib/assistant";
import { useSession } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { ChatMarkdown } from "./ChatMarkdown";

type Provider = "openai" | "gemini" | null;

interface Bubble extends ChatMessage {
  suggestions?: string[];
  source?: "local" | "ai";
}

const PROVIDER_LABEL: Record<"openai" | "gemini", string> = { openai: "OpenAI", gemini: "Gemini" };

function welcome(name?: string): Bubble {
  return {
    role: "assistant",
    source: "local",
    content: `Vanakkam${name ? ` ${name.split(" ")[0]}` : ""}! 👋 Ask me anything about your leads, students, fees, onboarding or HR. I answer from live CRM data.`,
    suggestions: STARTER_PROMPTS,
  };
}

async function askServer(history: ChatMessage[], context: string): Promise<{ reply?: string; fallback?: boolean; error?: string }> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history, context }),
    });
    return await res.json();
  } catch {
    return { fallback: true, error: "Network error" };
  }
}

export function AssistantWidget() {
  const session = useSession();
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState<Provider>(null);
  const [messages, setMessages] = useState<Bubble[]>(() => [welcome()]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (session?.name) setMessages((m) => (m.length === 1 ? [welcome(session.name)] : m));
  }, [session?.name]);

  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then((j: { provider: Provider }) => setProvider(j.provider ?? null))
      .catch(() => setProvider(null));
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    setInput("");
    const next: Bubble[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setBusy(true);

    const snapshot = await buildSnapshot();
    let reply: AssistantReply | null = null;
    let source: Bubble["source"] = "local";

    if (provider) {
      const history = next.slice(1).map(({ role, content }) => ({ role, content }));
      const res = await askServer(history, snapshotForAi(snapshot));
      if (res.reply) {
        reply = { text: res.reply };
        source = "ai";
      } else if (res.error) {
        const local = answerLocally(question, snapshot);
        reply = { ...local, text: `${local.text}\n\n_AI is unavailable right now (${res.error}). Showing the built-in answer._` };
      }
    }

    const final = reply ?? answerLocally(question, snapshot);
    setMessages((m) => [...m, { role: "assistant", content: final.text, suggestions: final.suggestions, source }]);
    setBusy(false);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  if (!session) return null;

  return (
    <div className="print:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close assistant" : "Open AI assistant"}
        title="AI assistant (Ctrl/⌘ + J)"
        className={cn(
          "bg-brand-gradient fixed right-5 bottom-5 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg shadow-brand-900/40 ring-4 ring-white/70 transition hover:scale-105 active:scale-95",
          open && "max-sm:hidden",
        )}
      >
        {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
        {!open && <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 animate-pulse rounded-full bg-ember-400 ring-2 ring-white" />}
      </button>

      {open && (
        <section
          role="dialog"
          aria-label="Yaadhum AI assistant"
          className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-cream-50 shadow-2xl sm:inset-auto sm:right-5 sm:bottom-24 sm:h-[min(620px,calc(100vh-8rem))] sm:w-[400px] sm:rounded-2xl sm:ring-1 sm:ring-brand-100"
        >
          <header className="bg-sidebar flex items-center gap-3 px-4 py-3 text-white">
            <span className="bg-brand-gradient flex h-9 w-9 items-center justify-center rounded-xl">
              <Bot className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base leading-tight font-bold tracking-wide">Yaadhum AI</p>
              <p className="flex items-center gap-1.5 text-[11px] text-cream-200/80">
                <span className={cn("h-1.5 w-1.5 rounded-full", provider ? "bg-emerald-400" : "bg-ember-400")} />
                {provider ? `Powered by ${PROVIDER_LABEL[provider]}` : "Built-in assistant · offline"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMessages([welcome(session.name)])}
              className="rounded-lg p-2 text-cream-200/80 transition hover:bg-white/10 hover:text-white"
              title="Clear chat"
            >
              <Eraser className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-2 text-cream-200/80 transition hover:bg-white/10 hover:text-white"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex flex-col gap-2", m.role === "user" ? "items-end" : "items-start")}>
                <div
                  className={cn(
                    "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    m.role === "user"
                      ? "bg-brand-gradient rounded-br-md text-white"
                      : "rounded-bl-md bg-white text-ink-700 shadow-sm ring-1 ring-brand-100",
                  )}
                >
                  {m.role === "user" ? m.content : <ChatMarkdown text={m.content} />}
                  {m.source === "ai" && (
                    <p className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-ink-600/60">
                      <Sparkles className="h-3 w-3" /> AI generated · verify important numbers
                    </p>
                  )}
                </div>
                {m.suggestions && i === messages.length - 1 && !busy && (
                  <div className="flex flex-wrap gap-1.5">
                    {m.suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => send(s)}
                        className="rounded-full bg-white px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-50"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {busy && (
              <div className="flex items-center gap-2 text-xs text-ink-600">
                <Loader2 className="h-4 w-4 animate-spin text-brand-600" /> Thinking…
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="flex items-end gap-2 border-t border-brand-100 bg-white p-3">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Ask about leads, fees, staff…"
              className="max-h-28 min-h-10 flex-1 resize-none rounded-xl bg-cream-50 px-3 py-2.5 text-sm text-ink-900 ring-1 ring-brand-100 outline-none placeholder:text-ink-600/50 focus:ring-2 focus:ring-brand-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || busy}
              aria-label="Send"
              className="bg-brand-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition hover:brightness-110 disabled:opacity-40"
            >
              <SendHorizontal className="h-4 w-4" />
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
