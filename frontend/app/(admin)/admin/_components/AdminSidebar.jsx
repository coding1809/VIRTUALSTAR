"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AdminSidebar.module.css";

const NAV = [
  {
    id: "api",
    href: "/admin/api-panel",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    label: "API",
    sub: "VIAOS Connect · Logs",
  },
  {
    id: "recruitment",
    href: "/admin/recruitment",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    label: "Recruitment Leads",
    sub: "Join Us · Pipeline",
  },
  {
    id: "roles",
    href: "/admin/roles",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        <polyline points="17 21 19 23 23 19" />
      </svg>
    ),
    label: "Roles",
    sub: "Users · Permissions",
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandMark}>VI</span>
        <div>
          <p className={styles.brandName}>Virtual Impact</p>
          <p className={styles.brandRole}>Admin Portal</p>
        </div>
      </div>

      <nav className={styles.nav}>
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
            >
              <span className={`${styles.navIcon} ${active ? styles.navIconActive : ""}`}>
                {item.icon}
              </span>
              <div className={styles.navText}>
                <span className={styles.navLabel}>{item.label}</span>
                <span className={styles.navSub}>{item.sub}</span>
              </div>
              {active && <span className={styles.activeBar} />}
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <p className={styles.footerText}>Virtual Impact © 2025</p>
      </div>
    </aside>
  );
}
