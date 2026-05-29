"use client";

import { useEffect, useState } from "react";

import { createClient } from "../../../lib/supabase/client";
import BlitzLeaderboard from "../agent-portal/dashboard/components/BlitzLeaderboard";
import styles from "./blitz-page.module.css";

export default function BlitzPage() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user ?? null));
  }, []);

  if (user === undefined) {
    return (
      <main className={styles.page}>
        <div className={styles.loadingWrap}>
          <span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} />
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <span className={styles.viLogo}>V</span>
          <span className={styles.viName}>BLITZ LEADERBOARD</span>
        </div>
      </header>

      <div className={styles.content}>
        <BlitzLeaderboard
          user={user}
          standalone
          createClient={createClient}
        />
      </div>
    </main>
  );
}
