import Image from "next/image";

import JoinUsFunnel from "../components/JoinUsFunnel";
import styles from "../join-us.module.css";

const proofItems = [
  {
    label: "Training",
    value: "Proven systems that close",
  },
  {
    label: "Leads",
    value: "Warm leads provided",
  },
  {
    label: "Income",
    value: "$10K–$50K+/month",
  },
];

export default function JoinUsHeroSection() {
  return (
    <section className={styles.hero}>
      <div className={`vi-container ${styles.heroGrid}`}>
        <JoinUsFunnel />

        <div className={styles.copyBlock}>
          <div className={styles.eyebrow}>
            <Image
              src="/icons/VLOGO-Photoroom.png"
              alt="Virtual Impact V logo"
              width={28}
              height={28}
              priority
            />
            <span>Virtual Impact</span>
          </div>
          <h1 className={styles.headline}>
            7 Figure Virtual Sales Academy.
            <span className={styles.headlineAccent}>Training. Systems. Leads.</span>
          </h1>
          <p className={styles.lead}>
            Helping agents earn $10K–$50K+/month selling life insurance 100% remotely.
            No office. No cold calling strangers. Just results.
          </p>
          <p className={styles.joinCta}>↑ Join Us ↑</p>
          <div className={styles.proofStrip}>
            {proofItems.map((item) => (
              <div key={item.label} className={styles.proofCard}>
                <span className={styles.proofLabel}>{item.label}</span>
                <span className={styles.proofValue}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
