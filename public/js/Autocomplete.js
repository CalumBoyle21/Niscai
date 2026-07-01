function tryParseCoords(input) {
  const coordRegex = /^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/;
  if (!coordRegex.test(input)) return null;
  const [lat, lon] = input.split(",").map(Number);
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { latitude: lat, longitude: lon };
}

function Autocomplete({ value, onChange, options, placeholder, disabled }) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapRef = useRef(null);

  const coords = tryParseCoords(query);
  const isValidCoords = coords !== null;

  React.useEffect(() => { setQuery(value); }, [value]);

  React.useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = query
    ? options.filter(o => o.toLowerCase().includes(query.toLowerCase())).slice(0, 50)
    : options.slice(0, 50);

  const selectOption = (name) => {
    onChange(name);
    setQuery(name);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setActiveIndex(-1);
    setOpen(true);
    if (tryParseCoords(val)) {
      onChange(val);
    } else {
      onChange("");
    }
  };

  const handleKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) { setOpen(true); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && filtered[activeIndex]) selectOption(filtered[activeIndex]);
      else if (tryParseCoords(query)) { onChange(query); setOpen(false); }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="autocomplete" ref={wrapRef}>
      <input
        type="text"
        placeholder={disabled ? "Loading…" : placeholder}
        value={query}
        disabled={disabled}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        style={isValidCoords ? { borderColor: "#3aa76d" } : undefined}
      />
      {isValidCoords && (
        <div style={{ fontSize: 11, color: "#3aa76d", marginTop: 2 }}>
          ✓ Using coordinates: {coords.latitude}, {coords.longitude}
        </div>
      )}
      {open && !disabled && (
        <div className="autocomplete-menu">
          {filtered.length === 0 && <div className="autocomplete-empty">No matches</div>}
          {filtered.map((name, i) => (
            <div
              key={name}
              className={`autocomplete-item ${i === activeIndex ? "active" : ""}`}
              onMouseDown={() => selectOption(name)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              {name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
