function Root() {
  const [view, setView] = useState("home");
  const [activeItem, setActiveItem] = useState(null);
  const [items, setItems] = useState(() => loadItems());

  const openNew = () => { setActiveItem(null); setView("builder"); };
  const openExisting = (item) => { setActiveItem(item); setView("builder"); };
  const goHome = () => { setView("home"); setActiveItem(null); };

  const handleSave = (item) => {
    setItems(prev => {
      const exists = prev.some(i => i.id === item.id);
      const next = exists ? prev.map(i => i.id === item.id ? item : i) : [...prev, item];
      saveItems(next);
      return next;
    });
    goHome();
  };

  const handleDelete = (id) => {
    setItems(prev => {
      const next = prev.filter(i => i.id !== id);
      saveItems(next);
      return next;
    });
  };

  if (view === "home") {
    return <HomePage items={items} onNew={openNew} onOpen={openExisting} onDelete={handleDelete} />;
  }
  return <JourneyBuilder existingItem={activeItem} onBack={goHome} onSave={handleSave} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);