import { NextResponse } from "next/server";

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "API key not configured." }, { status: 500 });

  const { history = [], scenarioContext = "" } = await request.json();

  const system = `You are a master insurance sales coach helping an agent during a live call.
${scenarioContext}

Based on the conversation so far, give the agent ONE specific sentence to say right now that would most likely build trust and move toward setting an appointment.
Keep it natural and conversational — not scripted. In Spanish.

Respond ONLY with valid JSON on a single line: {"hint": "..."}`;

  const messages = history.map((t) => ({
    role: t.role === "client" ? "assistant" : "user",
    content: t.text,
  }));

  // Need at least one assistant message for context
  if (!messages.some((m) => m.role === "assistant")) {
    return NextResponse.json({
      hint: "Preséntese con confianza y explique brevemente quién lo refirió o el motivo de su llamada.",
    });
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      system,
      messages,
    }),
  });

  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: res.status });

  const data = await res.json();
  const raw = data.content?.[0]?.text ?? "";
  const cleaned = raw.replace(/```(?:json)?\n?/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    return NextResponse.json({ hint: parsed.hint ?? cleaned });
  } catch {
    return NextResponse.json({ hint: cleaned });
  }
}
