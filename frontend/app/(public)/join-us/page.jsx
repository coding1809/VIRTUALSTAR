import JoinUsHeroSection from "./sections/JoinUsHeroSection";
import styles from "./join-us.module.css";

export default function JoinUsPage() {
  return (
    <main className={`${styles.joinUsPage} vi-page-shell`}>
      <JoinUsHeroSection />
    </main>
  );
}
