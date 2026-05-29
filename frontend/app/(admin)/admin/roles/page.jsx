import { redirect } from "next/navigation";
import { createClient, createServiceClient, getUserRole } from "../../../../lib/supabase/server";
import RolesClient from "./components/RolesClient";

export const metadata = { title: "Roles — Admin · Virtual Impact" };

export default async function RolesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/agent-portal/login?next=/admin/roles");

  const db = createServiceClient();
  const callerRole = await getUserRole(db, user.id);
  if (callerRole !== "admin" && callerRole !== "admin_developer") {
    redirect("/agent-portal/login?denied=1");
  }

  const [{ data: users }, { data: roles }, { data: userRoles }] = await Promise.all([
    db.from("users").select("id, email, display_name, avatar_url, is_active").order("email"),
    db.from("roles").select("id, name, label").order("name"),
    db.from("user_roles").select("user_id, role_id"),
  ]);

  // Build role name lookup without FK join
  const roleById = Object.fromEntries((roles || []).map(r => [r.id, r.name]));
  const roleByUser = Object.fromEntries(
    (userRoles || []).map(r => [r.user_id, roleById[r.role_id] ?? null])
  );

  const enriched = (users || []).map(u => ({
    ...u,
    role_name: roleByUser[u.id] ?? null,
  }));

  return <RolesClient users={enriched} roles={roles ?? []} />;
}
