import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import AppsPage from './pages/AppsPage';
import TimelinePage from './pages/TimelinePage.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <header className="navbar">
        <div className="navbar-brand">Marketing Monitor</div>
        <nav className="navbar-nav">
          <NavLink to="/apps" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Tracked Apps
          </NavLink>
        </nav>
      </header>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/apps" replace />} />
          <Route path="/apps" element={<AppsPage />} />
          <Route path="/apps/:id/timeline" element={<TimelinePage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
