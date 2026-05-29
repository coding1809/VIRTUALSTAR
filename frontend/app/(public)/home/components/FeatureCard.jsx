import styles from "../home.module.css";

export default function FeatureCard({ title, description }) {
  return (
    <article className={styles.featureCard}>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDesc}>{description}</p>
    </article>
  );
}
