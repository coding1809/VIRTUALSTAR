"use client";

import { useState } from "react";
import styles from "./FormSourceCard.module.css";

const STATUS_ICONS = {
  join_us_funnel: "📋",
  direct_referral: "🤝",
  instagram: "📸",
  facebook: "👥",
  tiktok: "🎵",
  youtube: "▶️",
  manual: "✏️",
};

export default function FormSourceCard({ source, users, active, onSelect, leadsCount }) {
  const owner = source.form_source_owners?.[0];
  const verified = !!owner?.verified_at;

  const [configOpen, setConfigOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(owner?.owner_user_id ?? "");
  const [saving, setSaving] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [msg, setMsg] = useState("");

  async function assignOwner() {
    if (!selectedUserId) return;
    setSaving(true);
    setMsg("");
    const res = await fetch(`/api/admin/form-sources/${source.id}/assign-owner`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ owner_user_id: selectedUserId }),
    });
    const data = await res.json();
    setMsg(res.ok ? "Owner assigned." : (data.error ?? "Failed."));
    setSaving(false);
  }

  async function sendVerification() {
    setSendingCode(true);
    setMsg("");
    const res = await fetch(`/api/admin/form-sources/${source.id}/send-verification`, {
      method: "POST",
    });
    const data = await res.json();
    setMsg(res.ok ? `Verification code sent to ${owner?.users?.email}.` : (data.error ?? "Failed."));
    setSendingCode(false);
  }

  return (
    <div className={`${styles.card} ${active ? styles.cardActive : ""}`}>
      <button className={styles.cardMain} onClick={onSelect}>
        <span className={styles.icon}>{STATUS_ICONS[source.name] ?? "📄"}</span>
        <div className={styles.info}>
          <p className={styles.label}>{source.label}</p>
          <p className={styles.meta}>
            {leadsCount} lead{leadsCount !== 1 ? "s" : ""}
            {owner && (
              <span className={`${styles.ownerTag} ${verified ? styles.ownerVerified : styles.ownerPending}`}>
                {verified ? "✓" : "⏳"} {owner.users?.email ?? "Unknown"}
              </span>
            )}
          </p>
        </div>
        <button
          className={styles.configBtn}
          onClick={(e) => { e.stopPropagation(); setConfigOpen(!configOpen); }}
          aria-label="Configure"
        >
          ⚙
        </button>
      </button>

      {configOpen && (
        <div className={styles.config}>
          <p className={styles.configLabel}>Form Owner</p>
          <p className={styles.configHint}>
            Assign a VI user as the data owner. Once assigned, send them a verification code to confirm ownership.
          </p>

          {owner?.verified_at ? (
            <div className={styles.ownerBadge}>
              <span className={styles.ownerBadgeIcon}>✓</span>
              <div>
                <p className={styles.ownerBadgeName}>{owner.users?.full_name ?? owner.users?.email} owns this data</p>
                <p className={styles.ownerBadgeEmail}>{owner.users?.email}</p>
              </div>
              {owner.api_key_last4 && (
                <span className={styles.apiKeyChip}>API key ••••{owner.api_key_last4}</span>
              )}
            </div>
          ) : (
            <>
              <div className={styles.assignRow}>
                <select
                  className={styles.select}
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value="">— Select user —</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.full_name ? `${u.full_name} (${u.email})` : u.email}</option>
                  ))}
                </select>
                <button className={styles.assignBtn} onClick={assignOwner} disabled={saving || !selectedUserId}>
                  {saving ? "Saving…" : "Assign"}
                </button>
              </div>

              {owner && !verified && (
                <button className={styles.verifyBtn} onClick={sendVerification} disabled={sendingCode}>
                  {sendingCode ? "Sending…" : "Send Verification Code"}
                </button>
              )}
            </>
          )}

          {msg && <p className={styles.msg}>{msg}</p>}
        </div>
      )}
    </div>
  );
}
