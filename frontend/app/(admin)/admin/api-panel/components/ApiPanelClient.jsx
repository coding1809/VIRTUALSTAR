"use client";

import { useState } from "react";
import styles from "./ApiPanelClient.module.css";
import ViaosConnectionCard from "./ViaosConnectionCard";
import SyncLogsTable from "./SyncLogsTable";

export default function ApiPanelClient({ connection, logs }) {
  const [conn, setConn] = useState(connection);
  const [logRows, setLogRows] = useState(logs);

  async function refresh() {
    const res = await fetch("/api/admin/viaos-config");
    if (res.ok) {
      const data = await res.json();
      setConn(data.connection);
      setLogRows(data.logs);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Admin · API</p>
          <h1 className={styles.title}>Integrations</h1>
        </div>
        <button className={styles.refreshBtn} onClick={refresh}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Refresh
        </button>
      </div>

      <div className={styles.body}>
        <ViaosConnectionCard connection={conn} onUpdate={setConn} />
        <SyncLogsTable rows={logRows} />
      </div>
    </div>
  );
}
