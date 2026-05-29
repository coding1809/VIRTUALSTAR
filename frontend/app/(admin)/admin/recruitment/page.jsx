import { createClient } from "../../../../lib/supabase/server";
import RecruitmentClient from "./components/RecruitmentClient";

export const metadata = { title: "Recruitment — Admin · Virtual Impact" };

export default async function RecruitmentPage() {
  const supabase = await createClient();

  const [{ data: leads }, { data: formSources }, { data: users }] = await Promise.all([
    supabase
      .from("leads")
      .select("id, full_name, email, phone, state, income_goal, status, created_at, source_id, crm_synced_at")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("lead_sources")
      .select(`
        id, name, label, is_active,
        form_source_owners (
          id, owner_user_id, verified_at, api_key_last4,
          users:owner_user_id ( email, full_name )
        )
      `),
    supabase
      .from("users")
      .select("id, email, full_name"),
  ]);

  return (
    <RecruitmentClient
      leads={leads ?? []}
      formSources={formSources ?? []}
      users={users ?? []}
    />
  );
}
