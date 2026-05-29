"use client";

import { useState } from "react";
import styles from "./RecruitmentClient.module.css";
import FormSourceCard from "./FormSourceCard";
import LeadsTable from "./LeadsTable";

export default function RecruitmentClient({ leads, formSources, users }) {
  const [selectedSourceId, setSelectedSourceId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = leads.filter((l) => {
    if (selectedSourceId && l.source_id !== selectedSourceId) return false;
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Admin · Recruitment</p>
          <h1 className={styles.title}>Recruitment Leads</h1>
        </div>
        <span className={styles.totalPill}>{leads.length} total leads</span>
      </div>

      {/* Form source cards */}
      <section className={styles.section}>
        <p className={styles.sectionLabel}>Form Sources</p>
        <div className={styles.sourceGrid}>
          {formSources.map((src) => (
            <FormSourceCard
              key={src.id}
              source={src}
              users={users}
              active={selectedSourceId === src.id}
              onSelect={() => setSelectedSourceId(selectedSourceId === src.id ? null : src.id)}
              leadsCount={leads.filter((l) => l.source_id === src.id).length}
            />
          ))}
        </div>
      </section>

      {/* Leads table */}
      <section className={styles.section}>
        <div className={styles.tableControls}>
          <p className={styles.sectionLabel}>
            {selectedSourceId
              ? `Leads from: ${formSources.find((s) => s.id === selectedSourceId)?.label}`
              : "All Leads"}
            <span className={styles.countBadge}>{filtered.length}</span>
          </p>
          <div className={styles.filters}>
            {["all", "new", "contacted", "qualified", "disqualified", "hired"].map((s) => (
              <button
                key={s}
                className={`${styles.filterBtn} ${statusFilter === s ? styles.filterBtnActive : ""}`}
                onClick={() => setStatusFilter(s)}
              >
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <LeadsTable leads={filtered} />
      </section>
    </div>
  );
}
