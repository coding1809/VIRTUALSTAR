import FeatureCard from "../components/FeatureCard";
import styles from "../home.module.css";

const stats = [
  { number: "$2M+", label: "Premium Sold", description: "In total insurance coverage delivered." },
  { number: "1,000+", label: "Families Protected", description: "Trusted by families nationwide." },
  { number: "50+", label: "Carrier Partners", description: "Top-rated insurance providers." },
  { number: "25+", label: "Licensed Agents", description: "Dedicated professionals serving clients." },
];

const featureItems = [
  {
    title: "Trusted Partners",
    description: "We collaborate with the most respected names in insurance to deliver exceptional products and unmatched service.",
  },
  {
    title: "National Coverage",
    description: "Access to 50+ top-rated carriers means comprehensive options for every client need.",
  },
  {
    title: "Expert Guidance",
    description: "Licensed professionals dedicated to finding the perfect coverage solution.",
  },
];

export default function OverviewSection() {
  return (
    <section className={styles.overview}>
      <div className="vi-container">
        <h2 className={styles.overviewTitle}>Our Impact in 2025</h2>
        <p className={styles.overviewSubtitle}>Building stronger communities through comprehensive insurance solutions.</p>
        <div className={styles.statsGrid}>
          {stats.map((stat, i) => (
            <div key={stat.label} className={styles.statCard}>
              <span className={styles.statIndex}>0{i + 1}</span>
              <p className={styles.statNumber}>{stat.number}</p>
              <p className={styles.statLabel}>{stat.label}</p>
              <p className={styles.statDesc}>{stat.description}</p>
            </div>
          ))}
        </div>
        <div className={styles.featureGrid}>
          {featureItems.map((item) => (
            <FeatureCard key={item.title} title={item.title} description={item.description} />
          ))}
        </div>
      </div>
    </section>
  );
}
