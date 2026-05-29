"use client";

import styles from "./LeadsTable.module.css";

const STATUS_COLORS = {
  new: styles.statusNew,
  contacted: styles.statusContacted,
  qualified: styles.statusQualified,
  disqualified: styles.statusDisqualified,
  hired: styles.statusHired,
};

function ago(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  return `${d}d ago`;
}

export default function LeadsTable({ leads }) {
  if (leads.length === 0) {
    return <div className={styles.empty}>No leads match the current filter.</div>;
  }

  return (
    <div className={styles.tableWrap}>
      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Location</th>
              <th>Income Goal</th>
              <th>Status</th>
              <th>Synced</th>
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td className={styles.name}>{lead.full_name}</td>
                <td className={styles.email}>{lead.email}</td>
                <td className={styles.mono}>{lead.phone ?? "—"}</td>
                <td>{lead.state ?? "—"}</td>
                <td>{lead.income_goal ?? "—"}</td>
                <td>
                  <span className={`${styles.statusPill} ${STATUS_COLORS[lead.status] ?? ""}`}>
                    {lead.status}
                  </span>
                </td>
                <td>
                  {lead.crm_synced_at
                    ? <span className={styles.synced}>✓ VIAOS</span>
                    : <span className={styles.unsynced}>Pending</span>
                  }
                </td>
                <td className={styles.time}>{ago(lead.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
