import Image from "next/image";
import styles from "../home.module.css";

export default function HeroSection() {
  return (
    <section className={`${styles.hero} vi-grid-bg`}>
      <div className={`vi-container ${styles.heroGrid}`}>
        <div>
          <Image
            src="/icons/VLOGO-Photoroom.png"
            alt="Virtual Impact logo"
            width={72}
            height={72}
            style={{ marginBottom: "10px", animation: "float 4s ease-in-out infinite" }}
            priority
          />
          <p className={styles.eyebrow}>
            Virtual Impact
          </p>
          <h1 className={styles.heroTitle}>
            Refined Excellence In Virtual Sales.
          </h1>
          <p className={styles.heroCopy}>
            Empowering Agencies To scale, close virtually, and dominate online. Get started or build with VI.
          </p>
          <div className={styles.heroActions}>
            <button className={styles.heroBtn} type="button">Get Started</button>
            <button className={styles.heroBtnGhost} type="button">Build with VI</button>
          </div>
        </div>

        <aside className={styles.metricCard}>
          <p className={styles.metricLabel}>
            Our Impact in 2025
          </p>
          <p className={styles.metricValue}>$2M+</p>
          <p className={styles.metricDesc}>In total insurance coverage delivered to families nationwide.</p>
        </aside>
      </div>
    </section>
  );
}
