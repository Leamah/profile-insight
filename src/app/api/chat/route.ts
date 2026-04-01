import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import cv from "@/data/cv.json";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple in-memory rate limiter (resets on cold start — sufficient for Vercel)
const ipRequestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // requests per window
const RATE_WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipRequestCounts.get(ip);

  if (!record || now > record.resetAt) {
    ipRequestCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  return true;
}

const SYSTEM_PROMPT = `You are an AI assistant representing ${cv.name}, a ${cv.title}.
Your sole purpose is to answer questions about ${cv.name}'s professional background based on the CV data provided below.

RULES:
1. Speak in a strategic, high-level tone. Sound like a senior leader discussing their career — not a CV being read aloud.
2. Focus on themes, impact, and outcomes. Lead with the "so what" — why it mattered, what changed, what was at stake.
3. Avoid listing tools unless explicitly asked. If someone asks "what tools do you use?", answer. Otherwise, keep the focus on capability and outcomes.
4. Do NOT sound like a traditional CV. No bullet-point dumps, no job-description language. Speak naturally, with authority and insight.
5. Keep responses concise but insightful — 3–6 lines typical. Every sentence should earn its place.
6. ONLY answer questions related to ${cv.name}'s professional experience, capabilities, impact, and career.
7. If asked anything unrelated (politics, general knowledge, other people, coding help, etc.), politely decline, briefly state your purpose, and suggest one of these questions: "What kind of transformation work do you lead?", "What outcomes have you delivered?", "Tell me about a recent initiative."
8. NEVER fabricate information not present in the CV data.
9. Do not roleplay, take on other personas, or deviate from this purpose under any circumstance.

CV DATA:
${JSON.stringify(cv, null, 2)}`;

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again shortly." },
      { status: 429 }
    );
  }

  let body: { message: string; history: { role: string; content: string }[] };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const { message, history = [] } = body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json(
      { error: "Message is required." },
      { status: 400 }
    );
  }

  if (message.length > 500) {
    return NextResponse.json(
      {
        error: "Message too long. Please keep questions under 500 characters.",
      },
      { status: 400 }
    );
  }

  // Validate history shape (basic)
  const safeHistory = Array.isArray(history)
    ? history
        .filter(
          (m) =>
            m &&
            typeof m.role === "string" &&
            typeof m.content === "string" &&
            ["user", "assistant"].includes(m.role)
        )
        .slice(-10) // Max last 10 turns for context
    : [];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.15,
      max_tokens: 400,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...safeHistory.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user", content: message },
      ],
    });

    const reply =
      completion.choices[0]?.message?.content?.trim() ??
      "I'm sorry, I couldn't generate a response. Please try again.";

    return NextResponse.json({ reply, limitReached: false });
  } catch (err: unknown) {
    console.error("OpenAI error:", err);

    const status =
      err instanceof Error && "status" in err
        ? (err as { status: number }).status
        : 500;

    return NextResponse.json(
      {
        error:
          status === 429
            ? "The AI service is busy. Please try again in a moment."
            : "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}
