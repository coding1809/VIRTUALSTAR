import { createServiceClient } from "../supabase/server";

// Pushes a single lead to VIAOS outbound webhook and logs the event.
// Called internally from the join-us form API route.
export async function pushLeadToViaos(lead) {
  const service = createServiceClient();

  const { data: conn } = await service
    .from("integration_connections")
    .select("id, outbound_webhook_url, is_connected")
    .eq("platform", "viaos")
    .maybeSingle();

  if (!conn?.outbound_webhook_url) return; // not configured, skip silently

  const payload = JSON.stringify({
    event: "new_lead",
    source: "virtual_impact",
    lead: {
      id: lead.id,
      full_name: lead.full_name,
      email: lead.email,
      phone: lead.phone ?? null,
      state: lead.state ?? null,
      income_goal: lead.income_goal ?? null,
      created_at: lead.created_at,
    },
  });

  let httpStatus = 0;
  let errMsg = null;

  try {
    const res = await fetch(conn.outbound_webhook_url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-vi-event": "new_lead",
        "x-vi-signature": process.env.VIAOS_WEBHOOK_SECRET ?? "",
      },
      body: payload,
    });
    httpStatus = res.status;
  } catch (e) {
    errMsg = e.message;
  }

  const status = httpStatus >= 200 && httpStatus < 300 ? "success" : "failed";

  await service.from("sync_logs").insert({
    integration_id: conn.id,
    direction: "push",
    status,
    lead_id: lead.id,
    record_count: 1,
    bytes_sent: payload.length,
    http_status: httpStatus || null,
    error_message: errMsg,
  });

  await service
    .from("integration_connections")
    .update({
      last_push_at: new Date().toISOString(),
      last_error: errMsg,
      is_connected: status === "success" ? true : conn.is_connected,
    })
    .eq("platform", "viaos");

  if (status === "success") {
    await service.from("leads").update({ crm_synced_at: new Date().toISOString() }).eq("id", lead.id);
  }
}
