"use client";

import styles from "./SyncLogsTable.module.css";

const DIR_LABEL = { push: "→ Push", pull: "← Pull" };
const STATUS_CLASS = { success: styles.success, failed: styles.failed, partial: styles.partial };

function formatBytes(b) {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

function ago(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function SyncLogsTable({ rows }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.tableHeader}>
        <h3 className={styles.tableTitle}>Sync Logs</h3>
        <span className={styles.rowCount}>{rows.length} events</span>
      </div>

      {rows.length === 0 ? (
        <div className={styles.empty}>No sync events yet. Logs appear here after the first push or pull.</div>
      ) : (
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Direction</th>
                <th>Status</th>
                <th>Records</th>
                <th>Sent</th>
                <th>Received</th>
                <th>HTTP</th>
                <th>Time</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={STATUS_CLASS[row.status] ?? ""}>
                  <td>
                    <span className={`${styles.dirPill} ${row.direction === "push" ? styles.push : styles.pull}`}>
                      {DIR_LABEL[row.direction] ?? row.direction}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusDot} ${STATUS_CLASS[row.status]}`} />
                    {row.status}
                  </td>
                  <td>{row.record_count ?? "—"}</td>
                  <td className={styles.mono}>{formatBytes(row.bytes_sent)}</td>
                  <td className={styles.mono}>{formatBytes(row.bytes_received)}</td>
                  <td className={`${styles.mono} ${row.http_status >= 400 ? styles.httpErr : ""}`}>
                    {row.http_status ?? "—"}
                  </td>
                  <td className={styles.time}>{ago(row.created_at)}</td>
                  <td className={styles.error}>{row.error_message ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
