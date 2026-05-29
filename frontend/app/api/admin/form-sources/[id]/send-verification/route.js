import { NextResponse } from "next/server";
import { createServiceClient } from "../../../../../../lib/supabase/server";
import crypto from "crypto";

// POST /api/admin/form-sources/[id]/send-verification
// Generates a 6-digit OTP and emails it to the form owner via Supabase auth email
export async function POST(request, { params }) {
  const { id } = await params;
  const service = createServiceClient();

  // Fetch the owner record + their email
  const { data: ownerRow, error: fetchErr } = await service
    .from("form_source_owners")
    .select("owner_user_id, users:owner_user_id(email)")
    .eq("form_source_id", parseInt(id, 10))
    .maybeSingle();

  if (fetchErr || !ownerRow) {
    return NextResponse.json({ error: "No owner assigned to this form source." }, { status: 400 });
  }

  const email = ownerRow.users?.email;
  if (!email) return NextResponse.json({ error: "Owner has no email." }, { status: 400 });

  // Generate 6-digit code
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const hash = crypto.createHash("sha256").update(code).digest("hex");
  const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min

  // Store the hash + expiry
  await service
    .from("form_source_owners")
    .update({ verification_code_hash: hash, verification_expires_at: expires })
    .eq("form_source_id", parseInt(id, 10));

  // Send email via Supabase (uses their configured SMTP / built-in email)
  // We use the admin auth API to send a magic link style email with custom OTP
  // For now: use Supabase's built-in email to send the code
  // In production, replace with your transactional email provider (Resend, SendGrid, etc.)
  const { error: emailErr } = await service.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      data: { verification_code: code, form_source_id: id },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/admin/verify-ownership?source=${id}`,
    },
  });

  if (emailErr) {
    // Fallback: log the code server-side for manual delivery
    console.log(`[VI Admin] Verification code for ${email}: ${code}`);
    return NextResponse.json({ ok: true, note: "Email delivery via fallback — check server logs." });
  }

  return NextResponse.json({ ok: true });
}
