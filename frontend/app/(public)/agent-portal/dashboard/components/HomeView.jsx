"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import styles from "./homeView.module.css";

const EVENT_POSTS = [
  {
    id: "blitz",
    href: "/blitz",
    title: "BLITZ LEADERBOARD",
    tag: "LIVE",
    desc: "Real-time sales competition. Every sale moves the board.",
  },
];

export default function HomeView({ user }) {
  const router = useRouter();
  const [screen, setScreen] = useState("feed"); // "feed" | "events"

  if (screen === "events") {
    return (
      <div className={styles.eventsView}>
        <button className={styles.backBtn} type="button" onClick={() => setScreen("feed")}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back
        </button>

        <p className={styles.viewLabel}>Events</p>

        <div className={styles.eventPostList}>
          {EVENT_POSTS.map((post) => (
            <button
              key={post.id}
              className={styles.eventPost}
              type="button"
              onClick={() => router.push(post.href)}
            >
              <span className={styles.eventPostTag}>
                {post.tag}
              </span>
              <span className={styles.eventPostTitle}>{post.title}</span>
              <span className={styles.eventPostDesc}>{post.desc}</span>
              <span className={styles.eventPostCta}>Open →</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.homeFeed}>
      <p className={styles.viewLabel}>Home</p>

      <div className={styles.cardGrid}>
        <button
          className={styles.eventsCard}
          type="button"
          onClick={() => setScreen("events")}
        >
          <span className={styles.cardIconWrap}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
            </svg>
          </span>
          <span className={styles.cardTitle}>Events</span>
          <span className={styles.cardDesc}>Competitions, challenges &amp; live boards</span>
          <span className={styles.cardCta}>View →</span>
        </button>
      </div>
    </div>
  );
}
