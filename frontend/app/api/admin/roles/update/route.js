import { NextResponse } from "next/server";
import { createClient, createServiceClient, getUserRole } from "../../../../../lib/supabase/server";

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServiceClient();
  const callerRoleName = await getUserRole(db, user.id);
  if (callerRoleName !== "admin" && callerRoleName !== "admin_developer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, roleName } = await request.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  await db.from("user_roles").delete().eq("user_id", userId);

  if (roleName) {
    const { data: role } = await db.from("roles").select("id").eq("name", roleName).single();
    if (!role) return NextResponse.json({ error: "Role not found" }, { status: 400 });
    const { error } = await db.from("user_roles").insert({ user_id: userId, role_id: role.id });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
