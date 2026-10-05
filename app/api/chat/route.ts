import { connection } from "next/server";

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

const MAX_TURNS = 16;
const MAX_CONTEXT = 80_000;

function provider() {
  if (process.env.OPENAI_API_KEY) return "openai" as const;
  if (process.env.GEMINI_API_KEY) return "gemini" as const;
  return null;
}

function systemPrompt(context: string) {
  return [
    "You are the Yaadhum CRM assistant for Yaadhum International Technologies, a training institute in Tamil Nadu.",
    "Answer ONLY from the CRM data snapshot below. If the data doesn't contain the answer, say so briefly.",
    "Reply in the same language the user writes in (English, Tamil, or Tanglish). Be concise and friendly.",
    "Use short markdown: **bold**, '- ' bullet lists. Currency is INR (₹, Indian digit grouping).",
    "When you mention a record that has an `href`, link it as [Name](href). Never invent links.",
    "",
    "CRM DATA SNAPSHOT (JSON):",
    context,
  ].join("\n");
}

async function askOpenAI(system: string, turns: ChatTurn[]) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: process.env.AI_MODEL || "gpt-4o-mini",
      temperature: 0.3,
      messages: [{ role: "system", content: system }, ...turns],
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? `OpenAI error ${res.status}`);
  return String(json.choices?.[0]?.message?.content ?? "");
}

async function askGemini(system: string, turns: ChatTurn[]) {
  const model = process.env.AI_MODEL || "gemini-2.0-flash";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: turns.map((t) => ({ role: t.role === "assistant" ? "model" : "user", parts: [{ text: t.content }] })),
      generationConfig: { temperature: 0.3 },
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? `Gemini error ${res.status}`);
  return String(json.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "");
}

export async function GET() {
  await connection();
  return Response.json({ provider: provider() });
}

export async function POST(request: Request) {
  const active = provider();
  if (!active) return Response.json({ fallback: true, provider: null });

  let body: { messages?: ChatTurn[]; context?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const turns = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  if (!turns.length || turns[turns.length - 1].role !== "user") {
    return Response.json({ error: "Last message must be from the user" }, { status: 400 });
  }

  const system = systemPrompt(String(body.context ?? "{}").slice(0, MAX_CONTEXT));
  try {
    const reply = active === "openai" ? await askOpenAI(system, turns) : await askGemini(system, turns);
    return Response.json({ reply, provider: active });
  } catch (err) {
    return Response.json(
      { fallback: true, provider: active, error: err instanceof Error ? err.message : "AI request failed" },
      { status: 502 },
    );
  }
}
