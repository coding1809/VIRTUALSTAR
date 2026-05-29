import { NextResponse } from "next/server";

const HANGUP_PROMPT = `You are a virtual sales coach analyzing a failed cold call for a life insurance agent.
The prospect just hung up.
Respond ONLY with valid JSON on a single line — no markdown:
{"reason": "1–2 sentences in Spanish explaining why they hung up", "tips": ["specific phrase in Spanish", "another phrase in Spanish", "one more option in Spanish"]}
Be direct and actionable. Phrases must sound natural and human.`;

const SUCCESS_PROMPT = `You are a virtual sales coach analyzing a successful cold call where the agent booked an appointment.
Respond ONLY with valid JSON on a single line — no markdown:
{"highlight": "1 sentence in Spanish on the key thing the agent did right", "tips": ["one thing to do at the actual appointment in Spanish", "how to confirm and not lose the appointment in Spanish", "one objection to prepare for in Spanish"]}`;

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "API key not configured." }, { status: 500 });

  const { history, type = "hangup" } = await request.json();

  const transcript = history
    .map((t) => `${t.role === "client" ? "Cliente" : "Agente"}: ${t.text}`)
    .join("\n");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: type === "success" ? SUCCESS_PROMPT : HANGUP_PROMPT,
      messages: [{ role: "user", content: `Transcripción:\n${transcript}` }],
    }),
  });

  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: res.status });

  const data = await res.json();
  const raw = (data.content?.[0]?.text ?? "").replace(/```(?:json)?\n?/g, "").trim();

  try {
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json(
      type === "success"
        ? { highlight: "Buen trabajo cerrando la cita.", tips: ["Confirma la hora por mensaje.", "Prepara una pregunta de calificación.", "Llega puntual y con energía."] }
        : { reason: "El cliente perdió interés.", tips: ["Conéctate primero como persona.", "Haz una pregunta antes de vender.", "Habla con calma y confianza."] }
    );
  }
}
