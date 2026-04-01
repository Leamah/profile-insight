"use client";

import { useState, useRef, useEffect } from "react";
import cv from "@/data/cv.json";

const MAX_MESSAGES = 10;

const PROMPT_BUTTONS = [
  {
    label: "Transformation Impact",
    question: "What kind of transformation work do you lead?",
    icon: "📈",
  },
  {
    label: "Outcomes Delivered",
    question: "What outcomes have you delivered?",
    icon: "⚙️",
  },
  {
    label: "Strategic Approach",
    question: "How do you approach complex organisational challenges?",
    icon: "🎯",
  },
  {
    label: "Recent Initiative",
    question: "Tell me about a recent initiative",
    icon: "🚀",
  },
  {
    label: "Change Leadership",
    question: "How do you lead change and manage stakeholders?",
    icon: "🤝",
  },
  {
    label: "Career Journey",
    question: "Walk me through your career journey",
    icon: "📋",
  },
];

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const messageCount = messages.filter((m) => m.role === "user").length;
  const limitReached = messageCount >= MAX_MESSAGES;
  const remaining = MAX_MESSAGES - messageCount;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading || limitReached) return;

    const userMessage: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          history: messages.slice(-8),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Request failed");
      }

      setMessages([
        ...newMessages,
        { role: "assistant", content: data.reply },
      ]);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  }

  function handlePromptClick(question: string) {
    sendMessage(question);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <main className="min-h-screen" style={{ background: "var(--navy)" }}>
      {/* Decorative background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 20% 20%, rgba(201,168,76,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(26,46,69,0.8) 0%, transparent 60%)",
        }}
      />

      <div className="relative max-w-3xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <header className="mb-10 md:mb-14">
          <div
            className="inline-block text-xs font-medium tracking-widest uppercase mb-4 px-3 py-1 rounded-full"
            style={{
              color: "var(--gold)",
              background: "rgba(201,168,76,0.1)",
              border: "1px solid var(--border)",
            }}
          >
            Interactive CV
          </div>
          <h1
            className="text-4xl md:text-5xl font-bold mb-2 leading-tight"
            style={{
              fontFamily: "var(--font-playfair)",
              color: "var(--text-primary)",
            }}
          >
            {cv.name}
          </h1>
          <p
            className="text-base md:text-lg mb-4"
            style={{ color: "var(--gold-light)" }}
          >
            {cv.title}
          </p>
          <p
            className="text-sm md:text-base leading-relaxed max-w-xl"
            style={{ color: "var(--text-muted)" }}
          >
            {cv.summary}
          </p>
          {/* Divider */}
          <div
            className="mt-6 h-px w-24"
            style={{ background: "var(--gold)", opacity: 0.4 }}
          />
        </header>

        {/* Prompt Buttons — PRIMARY UX */}
        <section className="mb-10">
          <p
            className="text-xs font-medium tracking-widest uppercase mb-4"
            style={{ color: "var(--text-muted)" }}
          >
            Ask me about
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PROMPT_BUTTONS.map((prompt) => (
              <button
                key={prompt.label}
                onClick={() => handlePromptClick(prompt.question)}
                disabled={loading || limitReached}
                className="group relative text-left p-4 rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: "var(--navy-mid)",
                  border: "1px solid var(--border)",
                }}
                onMouseEnter={(e) => {
                  if (!loading && !limitReached) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "var(--navy-light)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "var(--gold)";
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      "translateY(-2px)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "var(--navy-mid)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "rgba(201,168,76,0.2)";
                  (e.currentTarget as HTMLButtonElement).style.transform =
                    "translateY(0)";
                }}
              >
                <span className="text-xl mb-2 block">{prompt.icon}</span>
                <span
                  className="text-sm font-medium block"
                  style={{ color: "var(--text-primary)" }}
                >
                  {prompt.label}
                </span>
                <span
                  className="text-xs mt-1 block leading-snug"
                  style={{ color: "var(--text-muted)" }}
                >
                  {prompt.question}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Chat Display */}
        {messages.length > 0 && (
          <section className="mb-6">
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "var(--navy-mid)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="p-4 md:p-6 space-y-4 max-h-96 overflow-y-auto">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 mt-0.5"
                        style={{
                          background: "var(--gold)",
                          color: "var(--navy)",
                        }}
                      >
                        AI
                      </div>
                    )}
                    <div
                      className="max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl text-sm leading-relaxed"
                      style={
                        msg.role === "user"
                          ? {
                              background: "var(--navy-light)",
                              color: "var(--text-primary)",
                              borderBottomRightRadius: "4px",
                            }
                          : {
                              background: "rgba(201,168,76,0.08)",
                              color: "var(--text-primary)",
                              border: "1px solid rgba(201,168,76,0.15)",
                              borderBottomLeftRadius: "4px",
                            }
                      }
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {loading && (
                  <div className="flex justify-start">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0"
                      style={{
                        background: "var(--gold)",
                        color: "var(--navy)",
                      }}
                    >
                      AI
                    </div>
                    <div
                      className="px-4 py-3 rounded-2xl"
                      style={{
                        background: "rgba(201,168,76,0.08)",
                        border: "1px solid rgba(201,168,76,0.15)",
                      }}
                    >
                      <span
                        className="flex gap-1"
                        style={{ color: "var(--gold)" }}
                      >
                        <span
                          className="animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        >
                          ●
                        </span>
                        <span
                          className="animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        >
                          ●
                        </span>
                        <span
                          className="animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        >
                          ●
                        </span>
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          </section>
        )}

        {/* Error */}
        {error && (
          <div
            className="mb-4 px-4 py-3 rounded-lg text-sm"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#fca5a5",
            }}
          >
            {error}
          </div>
        )}

        {/* Secondary Input + Counter */}
        <section>
          {/* Session counter */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {limitReached ? "Session complete" : "Or ask your own question"}
            </p>
            <div
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                color: limitReached ? "#fca5a5" : "var(--gold)",
                background: limitReached
                  ? "rgba(239,68,68,0.1)"
                  : "rgba(201,168,76,0.1)",
                border: `1px solid ${
                  limitReached ? "rgba(239,68,68,0.3)" : "var(--border)"
                }`,
              }}
            >
              {limitReached
                ? "Limit reached"
                : `${remaining} of ${MAX_MESSAGES} remaining`}
            </div>
          </div>

          {limitReached ? (
            <div
              className="w-full px-4 py-4 rounded-xl text-sm text-center"
              style={{
                background: "var(--navy-mid)",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
              }}
            >
              Session limit reached. Refresh the page to start a new session.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about my background..."
                maxLength={500}
                disabled={loading || limitReached}
                className="flex-1 px-4 py-3 rounded-xl text-sm outline-none transition-all disabled:opacity-40"
                style={{
                  background: "var(--navy-mid)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-dm-sans)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--gold)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(201,168,76,0.2)";
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading || limitReached}
                className="px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: "var(--gold)",
                  color: "var(--navy)",
                }}
                onMouseEnter={(e) => {
                  if (!loading && input.trim()) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "var(--gold-light)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "var(--gold)";
                }}
              >
                Ask
              </button>
            </form>
          )}
        </section>

        {/* Footer */}
        <footer
          className="mt-12 pt-6 text-xs text-center"
          style={{
            borderTop: "1px solid var(--border)",
            color: "var(--text-muted)",
          }}
        >
          Powered by AI · CV-scoped responses only · No data stored
        </footer>
      </div>
    </main>
  );
}
