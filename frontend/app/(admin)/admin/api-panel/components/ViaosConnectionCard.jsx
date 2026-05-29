"use client";

import { useState } from "react";
import styles from "./ViaosConnectionCard.module.css";

export default function ViaosConnectionCard({ connection, onUpdate }) {
  const [webhookUrl, setWebhookUrl] = useState(connection?.outbound_webhook_url ?? "");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [apiKeyPlain, setApiKeyPlain] = useState(null); // shown once after generation

  const connected = connection?.is_connected;

  async function saveWebhook() {
    setSaving(true);
    setSavedMsg("");
    const res = await fetch("/api/admin/viaos-config", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ outbound_webhook_url: webhookUrl }),
    });
    const data = await res.json();
    if (res.ok) { onUpdate(data.connection); setSavedMsg("Saved."); }
    else setSavedMsg(data.error ?? "Failed to save.");
    setSaving(false);
  }

  async function generateApiKey() {
    setGenerating(true);
    setSavedMsg("");
    const res = await fetch("/api/admin/viaos-config", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "generate_api_key" }),
    });
    const data = await res.json();
    if (res.ok) {
      onUpdate(data.connection);
      setApiKeyPlain(data.plain_key); // shown once, not stored
    } else {
      setSavedMsg(data.error ?? "Failed.");
    }
    setGenerating(false);
  }

  async function testConnection() {
    setSaving(true);
    setSavedMsg("");
    const res = await fetch("/api/admin/viaos-config", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "test" }),
    });
    const data = await res.json();
    setSavedMsg(res.ok ? "Test ping sent." : (data.error ?? "Test failed."));
    if (res.ok) onUpdate(data.connection);
    setSaving(false);
  }

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.cardLogo}>V</div>
        <div className={styles.cardMeta}>
          <h2 className={styles.cardTitle}>VIAOS CRM</h2>
          <p className={styles.cardDesc}>Push leads to VIAOS on submission · VIAOS pulls on demand</p>
        </div>
        <span className={`${styles.statusPill} ${connected ? styles.statusConnected : styles.statusDisconnected}`}>
          <span className={styles.statusDot} />
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>

      <div className={styles.divider} />

      {/* Inbound API Key — VIAOS pastes this into their Connect Integration */}
      <div className={styles.section}>
        <p className={styles.sectionLabel}>Inbound API Key</p>
        <p className={styles.sectionHint}>
          Paste this key into VIAOS → Connect Integration → Virtual Impact. VIAOS uses it to authenticate pull requests.
        </p>
        <div className={styles.keyRow}>
          <div className={styles.keyDisplay}>
            {connection?.inbound_api_key_last4
              ? <><span className={styles.keyMask}>••••••••••••••••••••••••••••</span><span className={styles.keyLast4}>{connection.inbound_api_key_last4}</span></>
              : <span className={styles.keyNone}>No key generated yet</span>
            }
          </div>
          <button className={styles.genBtn} onClick={generateApiKey} disabled={generating}>
            {generating ? "Generating…" : connection?.inbound_api_key_last4 ? "Regenerate" : "Generate Key"}
          </button>
        </div>

        {/* Show plain key once after generation */}
        {apiKeyPlain && (
          <div className={styles.keyReveal}>
            <p className={styles.keyRevealLabel}>Copy this now — it will not be shown again</p>
            <div className={styles.keyRevealRow}>
              <code className={styles.keyRevealCode}>{apiKeyPlain}</code>
              <button className={styles.copyBtn} onClick={() => { navigator.clipboard.writeText(apiKeyPlain); }}>Copy</button>
            </div>
          </div>
        )}
      </div>

      <div className={styles.divider} />

      {/* Outbound Webhook — VI pushes here when a lead submits */}
      <div className={styles.section}>
        <p className={styles.sectionLabel}>Outbound Webhook URL</p>
        <p className={styles.sectionHint}>
          Virtual Impact POSTs each new lead to this URL the moment it is submitted. Get this from VIAOS → Connect Integration → Virtual Impact.
        </p>
        <div className={styles.inputRow}>
          <input
            className={styles.input}
            type="url"
            placeholder="https://viaos.app/webhooks/vi-leads/..."
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
          />
          <button className={styles.saveBtn} onClick={saveWebhook} disabled={saving || !webhookUrl}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className={styles.divider} />

      {/* Actions */}
      <div className={styles.actions}>
        <button className={styles.testBtn} onClick={testConnection} disabled={saving || !connection?.outbound_webhook_url}>
          Send Test Ping
        </button>
        {connection?.last_push_at && (
          <span className={styles.lastSync}>
            Last push: {new Date(connection.last_push_at).toLocaleString()}
          </span>
        )}
        {savedMsg && <span className={styles.savedMsg}>{savedMsg}</span>}
      </div>

      {connection?.last_error && (
        <p className={styles.errorBanner}>Last error: {connection.last_error}</p>
      )}
    </div>
  );
}
