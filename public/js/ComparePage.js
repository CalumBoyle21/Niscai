function ComparePage({ items, onBack }) {
  const [selected, setSelected] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapRef = React.useRef(null);

  React.useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleItem = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectedItems = items.filter(i => selected.includes(i.id));
  const maxCO2 = selectedItems.length > 0
    ? Math.max(...selectedItems.map(i => i.summary.totalCO2Kg))
    : 1;

  return (
    <>
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn btn-ghost" style={{ height: 30, padding: "0 12px", fontSize: 12 }} onClick={onBack}>← Home</button>
          <img src="/Images/NiscaiLogo.png" alt="Niscai Logo" style={{ width: 120, height: "auto" }} />
          <span className="topbar-sub">Freight CO2 Calculator</span>
        </div>
      </div>

      <div className="layout" style={{ gridTemplateColumns: "1fr" }}>
        <div>
          <div className="home-header" style={{ marginBottom: "1.5rem" }}>
            <h1 className="home-title">Compare Items</h1>
          </div>

          <div ref={wrapRef} className="compare-dropdown">
            <div className="compare-dropdown-trigger" onClick={() => setOpen(o => !o)}>
              <span style={{ color: selected.length === 0 ? "var(--text-muted)" : "var(--text-primary)" }}>
                {selected.length === 0
                  ? "Select items to compare…"
                  : `${selected.length} item${selected.length > 1 ? "s" : ""} selected`}
              </span>
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{open ? "▲" : "▼"}</span>
            </div>

            {open && (
              <div className="compare-dropdown-menu">
                {items.length === 0 && (
                  <div className="autocomplete-empty">No items saved yet.</div>
                )}
                {items.map(item => (
                  <div
                    key={item.id}
                    onMouseDown={() => toggleItem(item.id)}
                    className={`compare-dropdown-item ${selected.includes(item.id) ? "selected" : ""}`}
                  >
                    <span className={`compare-checkbox ${selected.includes(item.id) ? "checked" : ""}`}>
                      {selected.includes(item.id) && <span className="compare-checkbox-tick">✓</span>}
                    </span>
                    <span>{item.name}</span>
                    <span className="compare-item-co2">{item.summary.totalCO2Kg.toLocaleString()} kg CO₂</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedItems.length === 0 ? (
            <div className="empty">Select at least one item above to start comparing.</div>
          ) : (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Total CO₂ Comparison</span>
              </div>
              <div className="card-body">
                {[...selectedItems]
                  .sort((a, b) => a.summary.totalCO2Kg - b.summary.totalCO2Kg)
                  .map((item, i) => {
                    const barW = Math.round((item.summary.totalCO2Kg / maxCO2) * 100);
                    const isLowest = i === 0 && selectedItems.length > 1;
                    return (
                      <div key={item.id} className="compare-bar-row">
                        <div className="compare-bar-header">
                          <span className="compare-bar-name">
                            {item.name}
                            {isLowest && <span className="compare-lowest-badge">LOWEST</span>}
                          </span>
                          <span className="compare-bar-value">
                            {item.summary.totalCO2Kg.toLocaleString()} kg CO₂
                          </span>
                        </div>
                        <div className="compare-bar-track">
                          <div className={`compare-bar-fill ${isLowest ? "lowest" : "normal"}`}
                            style={{ width: `${barW}%` }} />
                        </div>
                        <div className="compare-bar-meta">
                          {item.summary.totalDistanceKm.toLocaleString()} km · {item.legs.length} leg{item.legs.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}