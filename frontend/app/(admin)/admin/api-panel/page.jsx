import { createClient } from "../../../../lib/supabase/server";
import ApiPanelClient from "./components/ApiPanelClient";

export const metadata = { title: "API — Admin · Virtual Impact" };

export default async function ApiPanelPage() {
  const supabase = await createClient();

  const [{ data: connection }, { data: logs }] = await Promise.all([
    supabase
      .from("integration_connections")
      .select("id, platform, label, is_connected, inbound_api_key_last4, outbound_webhook_url, last_push_at, last_pull_at, last_error, updated_at")
      .eq("platform", "viaos")
      .maybeSingle(),
    supabase
      .from("sync_logs")
      .select("id, direction, status, record_count, bytes_sent, bytes_received, http_status, error_message, created_at, lead_id, form_source_id")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return <ApiPanelClient connection={connection ?? null} logs={logs ?? []} />;
}
