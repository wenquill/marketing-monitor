import styles from './Footer.module.scss';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span className={styles.brand}>Marketing Monitor</span>
        <span className={styles.copy}>© {new Date().getFullYear()} — Google Play listing tracker</span>
      </div>
    </footer>
  );
}
