export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span className="footer-brand">Marketing Monitor</span>
        <span className="footer-copy">© {new Date().getFullYear()} — Google Play listing tracker</span>
      </div>
    </footer>
  );
}
