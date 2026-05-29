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

  const { targetUserId, eventId } = await request.json();
  if (!targetUserId || !eventId) {
    return NextResponse.json({ error: "targetUserId and eventId required" }, { status: 400 });
  }

  const { error } = await db
    .from("blitz_sales")
    .delete()
    .eq("user_id", targetUserId)
    .eq("event_id", eventId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
