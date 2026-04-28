import { NavLink } from 'react-router-dom';
import styles from './Header.module.scss';

export default function Header() {
  return (
    <header className={styles.navbar}>
      <div className={styles.brand}>Marketing Monitor</div>
      <nav className={styles.nav}>
        <NavLink
          to="/apps"
          className={({ isActive }) => `${styles.navLink}${isActive ? ` ${styles.active}` : ''}`}
        >
          Tracked Apps
        </NavLink>
      </nav>
    </header>
  );
}
