import MainNav from "../../../components/layout/MainNav";
import styles from "./home.module.css";

import CtaSection from "./sections/CtaSection";
import HeroSection from "./sections/HeroSection";
import OverviewSection from "./sections/OverviewSection";

export default function HomeLandingPage() {
  return (
    <main className={`${styles.homePage} vi-page-shell`}>
      <MainNav />
      <HeroSection />
      <OverviewSection />
      <CtaSection />
    </main>
  );
}
