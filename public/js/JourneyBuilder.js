function JourneyBuilder({ existingItem, onBack, onSave }) {
  const [legs, setLegs] = useState(existingItem?.legs.map(l => ({ mode: l.mode, origin: l.origin, destination: l.destination })) ?? []);
  const [results, setResults] = useState(existingItem ? { legs: existingItem.legs, summary: existingItem.summary } : null);
  const [itemName, setItemName] = useState(existingItem?.name ?? "");
  const [mode, setMode] = useState("ship");
  const [origin, setOrigin] = useState("");
  const [dest, setDest] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locations, setLocations] = useState({ ship: [], air: [], train: [] });
  const [locationsLoading, setLocationsLoading] = useState(true);
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    async function loadLocations() {
      try {
        const [ports, airports, stations] = await Promise.all([
          fetch("http://localhost:3000/api/locations/ports").then(r => r.json()),
          fetch("http://localhost:3000/api/locations/airports").then(r => r.json()),
          fetch("http://localhost:3000/api/locations/stations").then(r => r.json()),
        ]);
        setLocations({ ship: ports, air: airports, train: stations });
      } catch (e) {
        setError("Could not load location lists from the server.");
      } finally {
        setLocationsLoading(false);
      }
    }
    loadLocations();
  }, []);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setOrigin("");
    setDest("");
  };

  const usesDropdown = mode !== "truck";
  const optionsList = locations[mode] ?? [];

  const callApi = useCallback(async (newLegs) => {
    if (newLegs.length === 0) { setResults(null); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ legs: newLegs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setResults(data);
    } catch (e) {
      setError(e.message);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const addLeg = async () => {
    if (!origin.trim() || !dest.trim()) { setError("Enter an origin and destination."); return; }
    const newLegs = [...legs, { mode, origin: origin.trim(), destination: dest.trim() }];
    setLegs(newLegs);
    setOrigin("");
    setDest("");
    await callApi(newLegs);
  };

  const removeLeg = async (i) => {
    const newLegs = legs.filter((_, idx) => idx !== i);
    setLegs(newLegs);
    await callApi(newLegs);
  };

  const clearAll = () => { setLegs([]); setResults(null); setError(""); };

  const exportCsv = () => {
    const rows = legs.map((l, i) =>
      `${l.mode},${l.origin},${l.destination},${resultLegs[i]?.distanceKm ?? ""},${resultLegs[i]?.totalCO2Kg ?? ""}`
    );
    const csv = ["mode,origin,destination,distanceKm,totalCO2Kg", ...rows].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "niscai-item.csv";
    a.click();
  };

  const importCsv = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const lines = ev.target.result.trim().split("\n");
      const header = lines[0].toLowerCase();
      if (!header.startsWith("mode,origin,destination")) {
        setError("Invalid CSV format. Export an item first, then re-import it.");
        return;
      }
      const parsed = lines.slice(1).map(line => {
        const [mode, origin, destination] = line.split(",");
        return { mode: mode?.trim(), origin: origin?.trim(), destination: destination?.trim() };
      }).filter(l => l.mode && l.origin && l.destination && MODES.includes(l.mode));

      if (parsed.length === 0) {
        setError("No valid legs found in the CSV.");
        return;
      }
      setLegs(parsed);
      await callApi(parsed);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const resultLegs = results?.legs ?? [];
  const summary = results?.summary;
  const maxCO2 = summary ? Math.max(...Object.values(summary.co2ByMode)) : 1;

  const handleSave = () => {
    if (!itemName.trim()) { setError("Give your item a name before saving."); return; }
    if (!summary) { setError("Add at least one leg before saving."); return; }
    onSave({
      id: existingItem?.id ?? makeId(),
      name: itemName.trim(),
      createdAt: existingItem?.createdAt ?? new Date().toISOString(),
      legs: resultLegs.map((l, i) => ({ ...l, origin: legs[i].origin, destination: legs[i].destination })),
      summary,
    });
  };

  return (
    <>
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn btn-ghost" style={{ height: 30, padding: "0 12px", fontSize: 12 }} onClick={onBack}>← Home</button>
          <span className="topbar-logo">Niscai</span>
          <span className="topbar-sub">Freight CO2 Calculator</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="text"
            placeholder="Item name…"
            value={itemName}
            onChange={e => setItemName(e.target.value)}
            style={{ height: 32, fontSize: 13, width: 200 }}
          />
          <button className="btn btn-primary" style={{ height: 32 }} onClick={handleSave}>Save item</button>
        </div>
      </div>

      <div className="layout">
        <div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">{itemName || "Untitled item"}</span>
              {legs.length > 0 && <button className="btn btn-ghost" style={{fontSize:12,height:28,padding:"0 10px"}} onClick={clearAll}>Clear all</button>}
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div>
                  <label>Mode</label>
                  <select value={mode} onChange={e => handleModeChange(e.target.value)}>
                    {MODES.map(m => <option key={m} value={m}>{MODE_LABELS[m]}</option>)}
                  </select>
                </div>
                <div>
                  <label>Origin</label>
                  {usesDropdown ? (
                    <Autocomplete
                      value={origin}
                      onChange={setOrigin}
                      options={optionsList}
                      placeholder={`Search ${MODE_LABELS[mode].toLowerCase()} locations…`}
                      disabled={locationsLoading}
                    />
                  ) : (
                    <input type="text" placeholder="e.g. 51.5074, -0.1278" value={origin} onChange={e => setOrigin(e.target.value)} onKeyDown={e => e.key === "Enter" && addLeg()} />
                  )}
                </div>
                <div>
                  <label>Destination</label>
                  {usesDropdown ? (
                    <Autocomplete
                      value={dest}
                      onChange={setDest}
                      options={optionsList}
                      placeholder={`Search ${MODE_LABELS[mode].toLowerCase()} locations…`}
                      disabled={locationsLoading}
                    />
                  ) : (
                    <input type="text" placeholder="e.g. 48.8566, 2.3522" value={dest} onChange={e => setDest(e.target.value)} onKeyDown={e => e.key === "Enter" && addLeg()} />
                  )}
                </div>
                <div>
                  <label>&nbsp;</label>
                  <button className="btn btn-primary" onClick={addLeg} disabled={loading}>
                    {loading ? "…" : "+ Add leg"}
                  </button>
                </div>
              </div>
              {error && <div className="error">{error}</div>}
            </div>
          </div>

          <div className="timeline">
            {legs.length === 0 && !loading && (
              <div className="empty">Add a leg above to start building your item's journey.</div>
            )}
            {loading && legs.length > 0 && <div className="loading">Calculating…</div>}
            {!loading && resultLegs.map((leg, i) => (
              <div key={i} className="leg-row">
                <div className="leg-spine">
                  <div className={`leg-dot dot-${legs[i]?.mode}`} />
                  <div className="leg-line" />
                </div>
                <div className="leg-card">
                  <div className="leg-left">
                    <span className={`badge badge-${legs[i]?.mode}`}>{MODE_LABELS[legs[i]?.mode]}</span>
                    <span className="leg-route">
                      {legs[i]?.origin} <span>→</span> {legs[i]?.destination}
                    </span>
                  </div>
                  <div className="leg-right">
                    <span className="leg-dist">{leg.distanceKm.toLocaleString()} km</span>
                    <span className="leg-co2">{leg.totalCO2Kg.toLocaleString()} kg CO₂</span>
                    <button className="btn-danger" onClick={() => removeLeg(i)} aria-label="Remove leg">×</button>
                  </div>
                </div>
              </div>
            ))}
            {!loading && legs.length > 0 && (
              <div className="dest-row">
                <div className="dest-dot" />
                <span className="dest-label">Final destination</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-header"><span className="card-title">Summary</span></div>
            <div className="card-body">
              {!summary ? (
                <p style={{fontSize:13, color:"var(--text-muted)"}}>Add legs to see your item summary.</p>
              ) : (
                <>
                  <div className="metric-grid">
                    <div className="metric">
                      <div className="metric-label">Total CO₂</div>
                      <div className="metric-value">{summary.totalCO2Kg.toLocaleString()}</div>
                      <div className="metric-unit">kg</div>
                    </div>
                    <div className="metric">
                      <div className="metric-label">Distance</div>
                      <div className="metric-value">{summary.totalDistanceKm.toLocaleString()}</div>
                      <div className="metric-unit">km</div>
                    </div>
                    <div className="metric">
                      <div className="metric-label">Legs</div>
                      <div className="metric-value">{summary.legCount}</div>
                    </div>
                    <div className="metric">
                      <div className="metric-label">Intensity</div>
                      <div className="metric-value">{Math.round((summary.totalCO2Kg / summary.totalDistanceKm) * 1000)}</div>
                      <div className="metric-unit">g CO₂/km</div>
                    </div>
                  </div>
                  <div className="breakdown-title">Emissions by mode</div>
                  {["air","truck","ship","train"].filter(m => summary.co2ByMode[m]).map(m => {
                    const val = summary.co2ByMode[m];
                    const pct = Math.round((val / summary.totalCO2Kg) * 100);
                    const barW = Math.round((val / maxCO2) * 100);
                    return (
                      <div key={m} className="breakdown-row">
                        <div className="breakdown-label">
                          <span className={`badge badge-${m}`}>{MODE_LABELS[m]}</span>
                        </div>
                        <div className="breakdown-bar-track">
                          <div className="breakdown-bar-fill" style={{width:`${barW}%`, background: BAR_COLORS[m]}} />
                        </div>
                        <div className="breakdown-val">{val.toLocaleString()} kg</div>
                        <div className="breakdown-pct">{pct}%</div>
                      </div>
                    );
                  })}
                </>
              )}
              <div className="actions">
                <input type="file" accept=".csv" ref={fileInputRef} onChange={importCsv} />
                <button className="btn btn-ghost" style={{flex:1}} onClick={() => fileInputRef.current.click()}>
                  Import CSV
                </button>
                {summary && (
                  <button className="btn btn-ghost" style={{flex:1}} onClick={exportCsv}>
                    Export CSV
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}