import { NextResponse } from "next/server";

export async function POST(request) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Groq API key not configured." }, { status: 500 });
  }

  const incoming = await request.formData();
  const audioFile = incoming.get("audio");

  if (!audioFile) {
    return NextResponse.json({ error: "No audio provided." }, { status: 400 });
  }

  const form = new FormData();
  form.append("file", audioFile, "recording.webm");
  form.append("model", "whisper-large-v3-turbo");
  form.append("response_format", "json");
  // No language forced — Whisper auto-detects for Spanglish/code-switching

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json({ text: data.text ?? "" });
}
