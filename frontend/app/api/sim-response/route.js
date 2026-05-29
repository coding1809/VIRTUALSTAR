import { NextResponse } from "next/server";

const buildSystemPrompt = (difficulty = "medium", scenarioContext = "") => `
You are playing a Spanish-speaking insurance prospect receiving a cold call.
${scenarioContext}

Difficulty level: ${difficulty === "hard" ? "You are VERY resistant. You push back hard on everything. Short, dismissive replies." : difficulty === "easy" ? "You are somewhat open to listening, though still cautious." : "You are moderately skeptical — standard cold call resistance."}

Respond ONLY with valid JSON on a single line — no markdown, no code blocks, no extra text:
{"reply": "...", "delta": 0, "status": "ongoing"}

Rules:
- "reply": 1–2 sentences max. Realistic street-level Spanish.
- "delta": integer from -25 to +15.
  Hard difficulty: scale negative deltas by 1.2x, positive by 0.85x. A truly excellent response can still land — reward real effort.
  -25 to -15 → about to hang up
  -14 to -5  → weak response
  -4 to +4   → neutral
  +5 to +10  → handling it well
  +11 to +15 → excellent rapport
- "status": one of:
  "ongoing"          → conversation continues
  "appointment_set"  → client just agreed to a specific time or callback — use this when they say yes to meeting
  "end_call"         → client is firmly done, no interest at all
- Never break character.
`;

function parseResponse(raw) {
  // Strip markdown code fences if present
  const cleaned = raw.replace(/```(?:json)?\n?/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    return {
      reply: parsed.reply ?? cleaned,
      delta: typeof parsed.delta === "number" ? parsed.delta : -5,
      status: parsed.status ?? "ongoing",
    };
  } catch {
    return { reply: cleaned, delta: -5, status: "ongoing" };
  }
}

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "API key not configured." }, { status: 500 });

  const { agentText, history, difficulty = "medium", scenarioContext = "" } = await request.json();
  if (!agentText?.trim()) return NextResponse.json({ error: "No agent text." }, { status: 400 });

  const messages = [
    ...history.map((t) => ({
      role: t.role === "client" ? "assistant" : "user",
      content: t.text,
    })),
    { role: "user", content: agentText },
  ];

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: buildSystemPrompt(difficulty, scenarioContext),
      messages,
    }),
  });

  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: res.status });

  const data = await res.json();
  const raw = data.content?.[0]?.text ?? "";
  const { reply, delta, status } = parseResponse(raw);

  return NextResponse.json({ reply, delta, status });
}
