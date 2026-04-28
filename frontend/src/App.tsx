import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppsPage from './pages/AppsPage';
import TimelinePage from './pages/TimelinePage.tsx';
import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/apps" replace />} />
          <Route path="/apps" element={<AppsPage />} />
          <Route path="/apps/:id/timeline" element={<TimelinePage />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}
