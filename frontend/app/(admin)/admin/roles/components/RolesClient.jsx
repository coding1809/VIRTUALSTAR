"use client";

import { useState } from "react";
import styles from "./roles.module.css";

const ROLE_LABELS = {
  admin:           "Admin",
  admin_developer: "Admin Developer",
  agent_01:        "Agent 01",
  agent_02:        "Agent 02",
};

function Avatar({ src, name, size = 32 }) {
  if (src) return (
    <img src={src} alt={name || ""} width={size} height={size}
      style={{ borderRadius: "999px", objectFit: "cover", display: "block", flexShrink: 0 }}
      referrerPolicy="no-referrer" />
  );
  return (
    <span style={{
      width: size, height: size, borderRadius: "999px",
      background: "rgba(245,166,35,0.18)", color: "#ffd18a",
      fontSize: "0.78rem", fontWeight: 800,
      display: "grid", placeItems: "center", flexShrink: 0,
    }}>
      {(name || "?")[0].toUpperCase()}
    </span>
  );
}

export default function RolesClient({ users, roles }) {
  const [pending, setPending] = useState({});
  const [saved,   setSaved]   = useState({});
  const [errors,  setErrors]  = useState({});
  const [localRoles, setLocalRoles] = useState(
    Object.fromEntries(users.map(u => [u.id, u.role_name ?? ""]))
  );

  async function save(userId) {
    setPending(p => ({ ...p, [userId]: true }));
    setErrors(e => ({ ...e, [userId]: null }));

    const res = await fetch("/api/admin/roles/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, roleName: localRoles[userId] || null }),
    });

    setPending(p => ({ ...p, [userId]: false }));
    if (!res.ok) {
      const { error } = await res.json();
      setErrors(e => ({ ...e, [userId]: error || "Failed" }));
    } else {
      setSaved(s => ({ ...s, [userId]: true }));
      setTimeout(() => setSaved(s => ({ ...s, [userId]: false })), 2000);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Roles</h1>
        <p className={styles.sub}>Assign or change each user's access role.</p>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>User</th>
              <th className={styles.th}>Role</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th} />
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const isDirty = localRoles[u.id] !== (u.role_name ?? "");
              return (
                <tr key={u.id} className={styles.row}>
                  <td className={styles.td}>
                    <div className={styles.userCell}>
                      <Avatar src={u.avatar_url} name={u.display_name || u.email} />
                      <div>
                        <p className={styles.userName}>{u.display_name || "—"}</p>
                        <p className={styles.userEmail}>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <select
                      className={styles.select}
                      value={localRoles[u.id] ?? ""}
                      onChange={e => setLocalRoles(r => ({ ...r, [u.id]: e.target.value }))}
                    >
                      <option value="">— No role —</option>
                      {roles.map(r => (
                        <option key={r.id} value={r.name}>
                          {ROLE_LABELS[r.name] ?? r.label ?? r.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={styles.td}>
                    <span className={u.is_active ? styles.activeTag : styles.inactiveTag}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className={styles.td}>
                    {errors[u.id] && <span className={styles.errMsg}>{errors[u.id]}</span>}
                    {saved[u.id] && <span className={styles.savedMsg}>Saved</span>}
                    {(isDirty || pending[u.id]) && !saved[u.id] && (
                      <button
                        className={styles.saveBtn}
                        onClick={() => save(u.id)}
                        disabled={pending[u.id]}
                      >
                        {pending[u.id] ? "Saving…" : "Save"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
