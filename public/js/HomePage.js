function HomePage({ items, onNew, onOpen, onDelete }) {
  return (
    <div className="layout" style={{ gridTemplateColumns: "1fr" }}>
      <div>
        <div className="home-header">
          <h1 className="home-title">Your Items</h1>
          <button className="btn btn-primary" onClick={onNew}>+ New Item</button>
        </div>

        {items.length === 0 ? (
          <div className="empty" style={{ marginTop: "1.5rem" }}>
            No saved items yet. Start a new one to calculate and save your first route.
          </div>
        ) : (
          <div className="item-grid">
            {items.slice().reverse().map(j => {
              const modes = [...new Set(j.legs.map(l => l.mode))];
              return (
                <div key={j.id} className="item-card">
                  <div className="item-card-top">
                    <span className="item-name">{j.name}</span>
                    <button className="btn-danger" onClick={() => onDelete(j.id)} aria-label="Delete item">×</button>
                  </div>
                  <div className="item-modes">
                    {modes.map(m => <span key={m} className={`badge badge-${m}`}>{MODE_LABELS[m]}</span>)}
                  </div>
                  <div className="item-stats">
                    <div><span className="item-stat-val">{j.summary.totalCO2Kg.toLocaleString()}</span> kg CO₂</div>
                    <div><span className="item-stat-val">{j.summary.totalDistanceKm.toLocaleString()}</span> km</div>
                    <div><span className="item-stat-val">{j.legs.length}</span> legs</div>
                  </div>
                  <div className="item-date">Saved {new Date(j.createdAt).toLocaleDateString()}</div>
                  <button className="btn btn-ghost" style={{ width: "100%", marginTop: 10 }} onClick={() => onOpen(j)}>View / Edit</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
