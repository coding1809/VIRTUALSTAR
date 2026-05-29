import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "../../../../lib/supabase/server";
import crypto from "crypto";

function generateApiKey() {
  return "vi_" + crypto.randomBytes(32).toString("hex");
}

function hashKey(key) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

// GET — fetch current VIAOS connection config + recent sync logs
export async function GET() {
  const supabase = await createClient();

  const [{ data: connection }, { data: logs }] = await Promise.all([
    supabase
      .from("integration_connections")
      .select("id, platform, label, is_connected, inbound_api_key_last4, outbound_webhook_url, last_push_at, last_pull_at, last_error, updated_at")
      .eq("platform", "viaos")
      .maybeSingle(),
    supabase
      .from("sync_logs")
      .select("id, direction, status, record_count, bytes_sent, bytes_received, http_status, error_message, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return NextResponse.json({ connection: connection ?? null, logs: logs ?? [] });
}

// POST — update config or perform actions
export async function POST(request) {
  const body = await request.json();
  const service = createServiceClient();

  // ── Generate inbound API key ───────────────────────────
  if (body.action === "generate_api_key") {
    const plain = generateApiKey();
    const hashed = hashKey(plain);
    const last4 = plain.slice(-4);

    const { data, error } = await service
      .from("integration_connections")
      .update({ inbound_api_key: hashed, inbound_api_key_last4: last4 })
      .eq("platform", "viaos")
      .select("id, platform, label, is_connected, inbound_api_key_last4, outbound_webhook_url, last_push_at, last_pull_at, last_error")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ connection: data, plain_key: plain });
  }

  // ── Test outbound webhook ──────────────────────────────
  if (body.action === "test") {
    const { data: conn } = await service
      .from("integration_connections")
      .select("outbound_webhook_url, id")
      .eq("platform", "viaos")
      .single();

    if (!conn?.outbound_webhook_url) {
      return NextResponse.json({ error: "No webhook URL configured." }, { status: 400 });
    }

    let httpStatus = 0;
    let errMsg = null;
    const payload = JSON.stringify({ event: "ping", source: "virtual_impact", timestamp: new Date().toISOString() });

    try {
      const res = await fetch(conn.outbound_webhook_url, {
        method: "POST",
        headers: { "content-type": "application/json", "x-vi-event": "ping" },
        body: payload,
      });
      httpStatus = res.status;
    } catch (e) {
      errMsg = e.message;
      httpStatus = 0;
    }

    const status = httpStatus >= 200 && httpStatus < 300 ? "success" : "failed";

    await service.from("sync_logs").insert({
      integration_id: conn.id,
      direction: "push",
      status,
      bytes_sent: payload.length,
      http_status: httpStatus || null,
      error_message: errMsg,
    });

    const { data: updated } = await service
      .from("integration_connections")
      .update({ last_push_at: new Date().toISOString(), last_error: errMsg, is_connected: status === "success" })
      .eq("platform", "viaos")
      .select("id, platform, label, is_connected, inbound_api_key_last4, outbound_webhook_url, last_push_at, last_pull_at, last_error")
      .single();

    return NextResponse.json({ connection: updated });
  }

  // ── Save webhook URL ───────────────────────────────────
  if (body.outbound_webhook_url !== undefined) {
    const { data, error } = await service
      .from("integration_connections")
      .update({ outbound_webhook_url: body.outbound_webhook_url })
      .eq("platform", "viaos")
      .select("id, platform, label, is_connected, inbound_api_key_last4, outbound_webhook_url, last_push_at, last_pull_at, last_error")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ connection: data });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
