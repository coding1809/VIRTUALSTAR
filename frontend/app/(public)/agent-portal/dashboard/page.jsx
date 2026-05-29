"use client";

import { useEffect, useState } from "react";

import { createClient } from "../../../../lib/supabase/client";
import HomeView from "./components/HomeView";
import LiveClientSim from "./components/LiveClientSim";
import SimConfig from "./components/SimConfig";
import styles from "./dashboard.module.css";

const navItems = [
  { icon: "home",     label: "Home",     key: "home" },
  { icon: "training", label: "Training", key: "training" },
  { icon: "activity", label: "Activity", key: "activity" },
  { icon: "team",     label: "Team",     key: "team" },
];

function NavIcon({ type }) {
  if (type === "training") return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.navIcon}>
      <path d="M3 9 12 4l9 5-9 5-9-5Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 11v4c0 1.9 2.6 3.4 5 3.4s5-1.5 5-3.4v-4" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
  if (type === "activity") return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.navIcon}>
      <path d="M4 14h3l2-5 3 9 2-6h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (type === "team") return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.navIcon}>
      <circle cx="8" cy="10" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="16" cy="10" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4.6 18c.7-2.1 2.1-3 3.4-3h8c1.3 0 2.7.9 3.4 3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.navIcon}>
      <path d="M4 10.2 12 4l8 6.2V20H4v-9.8Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export default function AgentPortalDashboardPage() {
  const [activeView, setActiveView] = useState("home");
  const [showConfig, setShowConfig] = useState(false);
  const [simConfig, setSimConfig]   = useState(null);
  const [user, setUser]             = useState(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user ?? null));
  }, []);

  function handleCardClick() { setShowConfig(true); }

  function handleConfigStart(config) {
    setShowConfig(false);
    setSimConfig(config);
  }

  function handleSimClose() { setSimConfig(null); }

  return (
    <main className={`${styles.dashboardPage} vi-page-shell vi-grid-bg`}>
      {showConfig && <SimConfig onStart={handleConfigStart} />}
      {simConfig  && <LiveClientSim config={simConfig} onClose={handleSimClose} />}

      <div className={styles.shell}>
        <aside className={styles.sidebar} aria-label="Navigation">
          <nav className={styles.sidebarNav}>
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`${styles.navDot} ${activeView === item.key ? styles.navDotActive : ""}`}
                aria-label={item.label}
                onClick={() => setActiveView(item.key)}
              >
                <NavIcon type={item.icon} />
              </button>
            ))}
          </nav>
        </aside>

        <div className={styles.main}>
          {activeView === "home" && (
            <HomeView user={user} />
          )}

          {activeView === "training" && (
            <div className={styles.trainingView}>
              <p className={styles.viewLabel}>Training Simulators</p>
              <button className={styles.simCard} type="button" onClick={handleCardClick}>
                <span className={styles.simCardBadge}>Live</span>
                <span className={styles.simCardTitle}>Live Client</span>
                <span className={styles.simCardDesc}>Real objections. Real pressure. Answer the call.</span>
                <span className={styles.simCardCta}>Start →</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
