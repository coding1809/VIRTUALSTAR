import { NextResponse } from "next/server";
import { createServiceClient } from "../../../../lib/supabase/server";
import { pushLeadToViaos } from "../../../../lib/viaos/push";

export async function POST(request) {
  const body = await request.json();

  const {
    fullName,
    phone,
    email,
    licensed,
    salesExperience,
    availability,
    investment,
    workPermit,
  } = body;

  if (!fullName?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  }

  const service = createServiceClient();

  // Find the join_us_funnel source id
  const { data: source } = await service
    .from("lead_sources")
    .select("id")
    .eq("name", "join_us_funnel")
    .maybeSingle();

  // Build experience summary from funnel answers
  const experienceParts = [];
  if (licensed) experienceParts.push(`Licensed: ${licensed}`);
  if (salesExperience) experienceParts.push(`Phone/video sales: ${salesExperience}`);
  if (investment) experienceParts.push(`Can invest: ${investment}`);
  if (workPermit) experienceParts.push(`US work auth: ${workPermit}`);

  const leadPayload = {
    full_name: fullName.trim(),
    email: email.trim().toLowerCase(),
    phone: phone?.trim() || null,
    availability: availability || null,
    experience: experienceParts.join(" · ") || null,
    source_id: source?.id ?? null,
    status: "new",
  };

  // Upsert by email so duplicate submissions don't create duplicates
  const { data: lead, error } = await service
    .from("leads")
    .upsert(leadPayload, { onConflict: "email" })
    .select("id, full_name, email, phone, created_at")
    .single();

  if (error) {
    console.error("[join-us] Supabase insert error:", error);
    return NextResponse.json({ error: "Could not save your application. Please try again." }, { status: 500 });
  }

  // Push to VIAOS in the background — don't block the response on this
  pushLeadToViaos(lead).catch((e) => console.error("[join-us] VIAOS push failed:", e));

  return NextResponse.json({ ok: true });
}
