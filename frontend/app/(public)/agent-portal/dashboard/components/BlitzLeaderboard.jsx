"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./blitz.module.css";

const ROLE_LABELS = {
  admin:           "ADMIN",
  admin_developer: "ADMIN",
  agent_01:        "AGENT 01",
  agent_02:        "AGENT 02",
};

function fmt(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n ?? 0);
}

function fmtDate(ts) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  }).format(new Date(ts));
}

function Avatar({ src, name, size = 36 }) {
  if (src) return (
    <img src={src} alt={name || ""} className={styles.avatarImg}
      style={{ width: size, height: size }} referrerPolicy="no-referrer" />
  );
  return (
    <span className={styles.avatarInitial} style={{ width: size, height: size }}>
      {(name || "?")[0].toUpperCase()}
    </span>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function BlitzLeaderboard({ user, onBack, standalone = false, createClient }) {
  const [entries, setEntries]         = useState([]);
  const [history, setHistory]         = useState([]);
  const [movers, setMovers]           = useState(new Set());
  const [eventId, setEventId]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [addingSale, setAddingSale]   = useState(false);
  const [saleAmount, setSaleAmount]   = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [myRole, setMyRole]           = useState(null);
  const [noEvent, setNoEvent]         = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const [deleteError, setDeleteError]   = useState("");

  const prevRanks  = useRef({});
  const supabaseRef = useRef(null);
  if (!supabaseRef.current) supabaseRef.current = createClient();
  const supabase = supabaseRef.current;

  const fetchData = useCallback(async (evId) => {
    const [{ data: sales }, { data: recentSales }] = await Promise.all([
      supabase.from("blitz_sales").select("user_id, amount").eq("event_id", evId),
      supabase.from("blitz_sales")
        .select("id, user_id, amount, created_at")
        .eq("event_id", evId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (!sales) return;

    const map = {};
    for (const row of sales) {
      if (!map[row.user_id]) map[row.user_id] = { user_id: row.user_id, total: 0, count: 0 };
      map[row.user_id].total += Number(row.amount);
      map[row.user_id].count += 1;
    }

    const userIds    = Object.keys(map);
    const historyIds = [...new Set((recentSales || []).map(r => r.user_id))];
    const allIds     = [...new Set([...userIds, ...historyIds])];

    // Fetch profiles server-side so RLS on the users table never hides other users' names/avatars.
    const { profiles = [], roleByUser: roleMap = {} } = allIds.length
      ? await fetch("/api/blitz/profiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: allIds }),
        }).then(r => r.json())
      : {};

    const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));

    const ranked = Object.values(map)
      .map(e => ({
        ...e,
        display_name: profileMap[e.user_id]?.display_name ?? null,
        avatar_url:   profileMap[e.user_id]?.avatar_url   ?? null,
        role_name:    roleMap[e.user_id] ?? null,
      }))
      .sort((a, b) => b.total - a.total);

    // Patch current user's entry with auth metadata if DB profile is missing
    if (user) {
      const selfIdx = ranked.findIndex(e => e.user_id === user.id);
      if (selfIdx !== -1) {
        if (!ranked[selfIdx].display_name)
          ranked[selfIdx].display_name = user.user_metadata?.full_name ?? null;
        if (!ranked[selfIdx].avatar_url)
          ranked[selfIdx].avatar_url = user.user_metadata?.avatar_url ?? null;
      }
    }

    const newMovers = new Set();
    ranked.forEach((entry, i) => {
      const prev = prevRanks.current[entry.user_id];
      if (prev !== undefined && i < prev) newMovers.add(entry.user_id);
    });
    if (newMovers.size > 0) {
      setMovers(newMovers);
      setTimeout(() => setMovers(new Set()), 900);
    }
    ranked.forEach((entry, i) => { prevRanks.current[entry.user_id] = i; });

    setEntries(ranked);
    setHistory(
      (recentSales || []).map(r => ({
        ...r,
        display_name: profileMap[r.user_id]?.display_name
          ?? (user && r.user_id === user.id ? (user.user_metadata?.full_name ?? null) : null)
          ?? "Agent",
        avatar_url: profileMap[r.user_id]?.avatar_url
          ?? (user && r.user_id === user.id ? (user.user_metadata?.avatar_url ?? null) : null),
      }))
    );
    setLoading(false);
  }, [supabase, user]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    fetch("/api/my-role")
      .then(r => r.json())
      .then(({ role }) => setMyRole(role ?? null));

    let channel;
    supabase.from("events")
      .select("id")
      .eq("event_type", "leaderboard")
      .eq("is_active", true)
      .limit(1)
      .single()
      .then(({ data, error }) => {
        if (!data?.id) {
          setNoEvent(true);
          setLoading(false);
          return;
        }
        setEventId(data.id);
        fetchData(data.id);

        channel = supabase.channel("blitz-rt")
          .on("postgres_changes",
            { event: "INSERT", schema: "public", table: "blitz_sales", filter: `event_id=eq.${data.id}` },
            () => fetchData(data.id))
          .subscribe();
      });

    return () => { if (channel) supabase.removeChannel(channel); };
  }, [user, fetchData, supabase]);

  async function logSale() {
    const amount = parseFloat(saleAmount);
    if (!user || submitting || !amount || amount <= 0) return;
    if (!eventId) {
      setSubmitError("Event not found — run the setup SQL in Supabase first.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    const { error } = await supabase.from("blitz_sales").insert({
      event_id:  eventId,
      user_id:   user.id,
      logged_by: user.id,
      amount,
      points:    1,
    });

    if (error) {
      setSubmitError(error.message);
      setSubmitting(false);
      return;
    }

    // Always manually refresh — don't rely solely on realtime
    await fetchData(eventId);
    setAddingSale(false);
    setSaleAmount("");
    setSubmitError("");
    setSubmitting(false);
  }

  async function deleteUserSales() {
    if (!deleteTarget || !eventId || deleting) return;
    setDeleting(true);
    setDeleteError("");
    const res = await fetch("/api/admin/blitz/delete-user-sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: deleteTarget.user_id, eventId }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      setDeleteError(error || "Failed to delete");
      setDeleting(false);
      return;
    }
    await fetchData(eventId);
    setDeleteTarget(null);
    setDeleting(false);
  }

  const myEntry  = entries.find(e => e.user_id === user?.id);
  const myTotal  = myEntry?.total ?? 0;
  const myRank   = entries.findIndex(e => e.user_id === user?.id) + 1;
  const myName   = user?.user_metadata?.full_name || user?.email || "You";
  const myAvatar = user?.user_metadata?.avatar_url ?? null;
  const isAdmin  = myRole === "admin" || myRole === "admin_developer";
  const loginHref = standalone
    ? `/agent-portal/login?next=${encodeURIComponent("/blitz")}`
    : "/agent-portal/login";

  // ── Not signed in ────────────────────────────────
  if (!user) {
    return (
      <div className={styles.authGate}>
        {!standalone && onBack && (
          <button className={styles.backBtn} type="button" onClick={onBack}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            Back
          </button>
        )}
        <div className={styles.authCard}>
          <div className={styles.authIcon}>⚡</div>
          <h2 className={styles.authTitle}>Sign in to join the Blitz</h2>
          <p className={styles.authDesc}>Connect with Google to compete on the live leaderboard and track your sales.</p>
          <a href={loginHref} className={styles.googleBtn}><GoogleIcon />Sign in with Google</a>
        </div>
      </div>
    );
  }

  // ── Board ─────────────────────────────────────────
  return (
    <div className={styles.board}>

      {!standalone && onBack && (
        <button className={styles.backBtn} type="button" onClick={onBack}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          Back
        </button>
      )}

      <div className={styles.boardHead}>
        <div className={styles.boardTitleRow}>
          <h2 className={styles.boardTitle}>BLITZ LEADERBOARD</h2>
        </div>
        <p className={styles.boardSub}>Real-time sales competition · updates instantly</p>
      </div>

      {/* Grand total team production */}
      <div className={styles.grandTotal}>
        <span className={styles.grandTotalLabel}>Producción Total del Equipo</span>
        <span className={styles.grandTotalAmount}>{fmt(entries.reduce((s, e) => s + e.total, 0))}</span>
      </div>

      {/* My card — always full width, updates live */}
      <div className={styles.myCard}>
        <button className={styles.myAvatarBtn} type="button"
          onClick={() => { setAddingSale(true); setSubmitError(""); }}
          title="Log a sale">
          <Avatar src={myAvatar} name={myName} size={46} />
          <span className={styles.addBadge}>+</span>
        </button>
        <div className={styles.myInfo}>
          <span className={styles.myName}>{myName}</span>
          {myRole && <span className={styles.myRole}>{ROLE_LABELS[myRole] ?? myRole.toUpperCase()}</span>}
        </div>
        <div className={styles.myStats}>
          <span className={styles.myPts}>{fmt(myTotal)}</span>
          {myRank > 0 && <span className={styles.myRankBadge}>#{myRank}</span>}
        </div>
      </div>

      {/* Sale entry */}
      {addingSale && (
        <div className={styles.saleModal}>
          <div className={styles.saleModalInner}>
            <p className={styles.saleModalTitle}>Log a Sale</p>
            <div className={styles.amountRow}>
              <span className={styles.dollarSign}>$</span>
              <input
                className={styles.amountInput}
                type="number"
                placeholder="0"
                min="1"
                step="1"
                value={saleAmount}
                onChange={e => { setSaleAmount(e.target.value); setSubmitError(""); }}
                onKeyDown={e => e.key === "Enter" && logSale()}
                autoFocus
              />
            </div>
            {submitError && <p className={styles.submitError}>{submitError}</p>}
            <div className={styles.saleModalBtns}>
              <button className={styles.confirmBtn} type="button"
                onClick={logSale}
                disabled={submitting || !saleAmount || parseFloat(saleAmount) <= 0}>
                {submitting ? "Logging…" : `Log ${saleAmount ? fmt(saleAmount) : "$0"}`}
              </button>
              <button className={styles.cancelBtn} type="button"
                onClick={() => { setAddingSale(false); setSaleAmount(""); setSubmitError(""); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className={styles.saleModal}>
          <div className={styles.saleModalInner}>
            <p className={styles.saleModalTitle}>Delete all sales for {deleteTarget.display_name || "this user"}?</p>
            <p className={styles.saleModalDesc}>This removes all their data from this leaderboard event. This cannot be undone.</p>
            {deleteError && <p className={styles.submitError}>{deleteError}</p>}
            <div className={styles.saleModalBtns}>
              <button className={styles.deleteConfirmBtn} type="button"
                onClick={deleteUserSales} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
              <button className={styles.cancelBtn} type="button"
                onClick={() => { setDeleteTarget(null); setDeleteError(""); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {noEvent && (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>Leaderboard not set up yet.</p>
          <p className={styles.emptyDesc}>Run the setup SQL in Supabase to create the BLITZ event.</p>
        </div>
      )}

      {/* Rankings */}
      {!noEvent && (
        loading ? (
          <div className={styles.loadingState}>
            <span className={styles.loadingDot} /><span className={styles.loadingDot} /><span className={styles.loadingDot} />
          </div>
        ) : entries.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>No sales logged yet.</p>
            <p className={styles.emptyDesc}>Tap your avatar to log the first one.</p>
          </div>
        ) : (
          <ol className={styles.rankList}>
            {entries.map((entry, i) => {
              const isSelf  = entry.user_id === user.id;
              const isMover = movers.has(entry.user_id);
              return (
                <li key={entry.user_id} className={[
                  styles.rankRow,
                  isMover ? styles.rankUp : "",
                  isSelf  ? styles.rankRowSelf : "",
                ].join(" ")}>
                  <span className={[styles.rankNum,
                    i === 0 ? styles.gold : i === 1 ? styles.silver : i === 2 ? styles.bronze : "",
                  ].join(" ")}>{i + 1}</span>
                  <Avatar src={entry.avatar_url} name={entry.display_name} size={36} />
                  <div className={styles.rankInfo}>
                    <span className={styles.rankName}>
                      {entry.display_name || "Agent"}
                      {isSelf && <span className={styles.youTag}> you</span>}
                    </span>
                    {entry.role_name && (
                      <span className={styles.roleBadge}>
                        {ROLE_LABELS[entry.role_name] ?? entry.role_name.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className={styles.rankScore}>
                    <span className={styles.pts}>{fmt(entry.total)}</span>
                  </div>
                  {isMover && <span className={styles.rankUpArrow} aria-label="Moved up">↑</span>}
                  {isAdmin && (
                    <button
                      className={styles.pencilBtn}
                      type="button"
                      title="Delete leaderboard data"
                      onClick={() => { setDeleteTarget(entry); setDeleteError(""); }}
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        )
      )}

      {/* Sale history feed */}
      {history.length > 0 && (
        <div className={styles.historySection}>
          <p className={styles.historyLabel}>Recent Sales</p>
          <div className={styles.historyList}>
            {history.map(h => (
              <div key={h.id} className={styles.historyRow}>
                <Avatar src={h.avatar_url} name={h.display_name} size={28} />
                <span className={styles.historyName}>{h.display_name || "Agent"}</span>
                <span className={styles.historyAmount}>{fmt(h.amount)}</span>
                <span className={styles.historyDate}>{fmtDate(h.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
