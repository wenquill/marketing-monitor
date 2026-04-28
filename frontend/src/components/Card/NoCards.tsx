interface NoCardProps {
    setShowAdd: (show: boolean) => void;
}

export default function NoCards ({ setShowAdd }: NoCardProps) {
    return (
        <div className="card empty-state">
          <div className="empty-state-icon">📱</div>
          <h3>No apps tracked yet</h3>
          <p>Add a Google Play app to start monitoring its listing page.</p>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            Add your first app
          </button>
        </div>
    )
}