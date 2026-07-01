const { useState, useCallback, useRef } = React;

const API = "http://localhost:3000/api/journey";

const MODES = ["ship", "air", "truck", "train"];
const MODE_LABELS = { ship: "Ship", air: "Air", truck: "Truck", train: "Train" };
const BAR_COLORS = { ship: "#378add", air: "#7f77dd", truck: "#ba7517", train: "#639922" };

const STORAGE_KEY = "niscai_items";

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}