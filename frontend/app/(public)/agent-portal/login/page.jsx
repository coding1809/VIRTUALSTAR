"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { createClient } from "../../../../lib/supabase/client";
import styles from "./portal-login.module.css";

const highlights = ["Agents Only", "Google Sign-In", "Virtual Impact Academy"];

function LoginCard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/agent-portal/dashboard";
  const denied = searchParams.get("denied");

  async function handleGoogleSignIn() {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  }

  return (
    <div className={styles.portalCard}>
      <p className={styles.portalCardEyebrow}>Welcome back</p>
      <h2 className={styles.portalCardTitle}>Sign in to start training</h2>
      <p className={styles.portalCardText}>
        Use your authorized Google account to access the agent portal.
        No email or password required.
      </p>

      {denied && (
        <p className={styles.portalError}>
          Access denied. Your Google account is not authorized for this portal. Contact your upline.
        </p>
      )}

      {error && <p className={styles.portalError}>{error}</p>}

      <button
        className={styles.googleButton}
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        <span className={styles.googleBadge}>G</span>
        {loading ? "Redirecting…" : "Continue with Google"}
      </button>

      <p className={styles.portalHint}>
        Only authorized Virtual Impact agents may sign in. Contact your upline if you need access.
      </p>
    </div>
  );
}

export default function AgentPortalLoginPage() {
  return (
    <main className={`${styles.portalPage} vi-page-shell`}>
      <div className={styles.portalWrap}>

        <div className={styles.portalCopy}>
          <div className={styles.portalEyebrow}>
            <Image
              src="/icons/VLOGO-Photoroom.png"
              alt="Virtual Impact V logo"
              width={32}
              height={32}
              priority
            />
            <span>Agent Portal</span>
          </div>
          <h1 className={styles.portalHeadline}>
            Your training
            <span className={styles.portalAccent}>starts here.</span>
          </h1>
          <p className={styles.portalLead}>
            Access your tools, training, and leads. This portal is reserved for
            authorized Virtual Impact agents only.
          </p>
          <div className={styles.portalMeta}>
            {highlights.map((item) => (
              <span key={item} className={styles.portalPill}>{item}</span>
            ))}
          </div>
        </div>

        <Suspense fallback={<div className={styles.portalCard} />}>
          <LoginCard />
        </Suspense>

      </div>
    </main>
  );
}
