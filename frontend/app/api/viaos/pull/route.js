import { NextResponse } from "next/server";
import { createServiceClient } from "../../../../lib/supabase/server";
import crypto from "crypto";

// GET /api/viaos/pull
// VIAOS calls this with: Authorization: Bearer <inbound_api_key>
// Returns new leads since last pull, logs the event
export async function GET(request) {
  const service = createServiceClient();

  // Authenticate
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return NextResponse.json({ error: "Missing API key." }, { status: 401 });

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const { data: conn } = await service
    .from("integration_connections")
    .select("id, inbound_api_key, outbound_webhook_url, last_pull_at")
    .eq("platform", "viaos")
    .maybeSingle();

  if (!conn || conn.inbound_api_key !== tokenHash) {
    return NextResponse.json({ error: "Invalid API key." }, { status: 403 });
  }

  const since = request.nextUrl.searchParams.get("since") ?? conn.last_pull_at ?? new Date(0).toISOString();

  // Fetch leads submitted after the last pull
  const { data: leads, error } = await service
    .from("leads")
    .select("id, full_name, email, phone, city, state, country, income_goal, experience, availability, motivation, status, source_id, created_at")
    .gt("created_at", since)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const payload = { leads: leads ?? [], count: leads?.length ?? 0, pulled_at: new Date().toISOString() };
  const payloadStr = JSON.stringify(payload);

  // Log the pull event
  await service.from("sync_logs").insert({
    integration_id: conn.id,
    direction: "pull",
    status: "success",
    record_count: payload.count,
    bytes_sent: payloadStr.length,
    http_status: 200,
  });

  // Update last_pull_at
  await service
    .from("integration_connections")
    .update({ last_pull_at: new Date().toISOString(), is_connected: true })
    .eq("platform", "viaos");

  // Mark pulled leads as CRM synced
  if (leads && leads.length > 0) {
    await service
      .from("leads")
      .update({ crm_synced_at: new Date().toISOString() })
      .in("id", leads.map((l) => l.id));
  }

  return NextResponse.json(payload);
}
