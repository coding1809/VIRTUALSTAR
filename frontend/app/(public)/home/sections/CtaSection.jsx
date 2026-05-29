import styles from "../home.module.css";

const perks = [
  {
    title: "Virtual Sales Growth",
    description: "Work remotely selling life insurance policies that protect families nationwide.",
  },
  {
    title: "Save Lives & Change Futures",
    description: "Provide financial security for families when they need it most.",
  },
  {
    title: "Unlimited Earning Potential",
    description: "Performance-based commissions with industry-leading compensation structure.",
  },
];

export default function CtaSection() {
  return (
    <section className={styles.cta}>
      <div className="vi-container">
        <div className={styles.ctaCard}>
          <p className={styles.eyebrow}>Careers</p>
          <h2>Join Our Team</h2>
          <p>
            Help us protect families and change lives through virtual life insurance sales. We&apos;re building the future of financial security, one policy at a time.
          </p>
          <div className={styles.perksList}>
            {perks.map((perk) => (
              <div key={perk.title} className={styles.perkItem}>
                <strong>{perk.title}</strong>
                <span>{perk.description}</span>
              </div>
            ))}
          </div>
          <button className={styles.ctaBtn} type="button">View Careers</button>
        </div>
      </div>
    </section>
  );
}
