import { NavLink } from 'react-router-dom';

export default function Header() {
  return (
    <header className="navbar">
      <div className="navbar-brand">Marketing Monitor</div>
      <nav className="navbar-nav">
        <NavLink to="/apps" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Tracked Apps
        </NavLink>
      </nav>
    </header>
  );
}
