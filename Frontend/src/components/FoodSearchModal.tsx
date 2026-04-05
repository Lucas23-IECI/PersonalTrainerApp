"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, Plus, Loader2 } from "lucide-react";
import { searchFoods, calcMacros, type FoodItem } from "@/lib/openfoodfacts";

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string, calories: number, protein: number, carbs: number, fat: number) => void;
}

export default function FoodSearchModal({ open, onClose, onAdd }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [grams, setGrams] = useState("100");
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelected(null);
      setGrams("100");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    const items = await searchFoods(q);
    setResults(items);
    setLoading(false);
  }, []);

  function handleQueryChange(val: string) {
    setQuery(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(val), 400);
  }

  function handleAdd() {
    if (!selected) return;
    const g = parseInt(grams, 10) || 100;
    const macros = calcMacros(selected, g);
    const label = selected.brand
      ? `${selected.name} (${selected.brand}) — ${g}g`
      : `${selected.name} — ${g}g`;
    onAdd(label, macros.calories, macros.protein, macros.carbs, macros.fat);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-[540px] max-h-[85vh] rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden"
        style={{ background: "var(--bg-card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <Search size={18} style={{ color: "var(--text-muted)" }} />
          <input
            ref={inputRef}
            type="search"
            placeholder="Buscar alimento..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm"
            style={{ color: "var(--text)" }}
          />
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer p-1" style={{ color: "var(--text-muted)" }}>
            <X size={18} />
          </button>
        </div>

        {/* Selected food detail */}
        {selected && (
          <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-start gap-3">
              {selected.image && (
                <img src={selected.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>{selected.name}</div>
                {selected.brand && <div className="text-[0.65rem]" style={{ color: "var(--text-muted)" }}>{selected.brand}</div>}
                <div className="text-[0.65rem] mt-1" style={{ color: "var(--text-muted)" }}>
                  Por 100g: {selected.per100g.calories}kcal · {selected.per100g.protein}P · {selected.per100g.carbs}C · {selected.per100g.fat}F
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="bg-transparent border-none cursor-pointer p-1" style={{ color: "var(--text-muted)" }}>
                <X size={14} />
              </button>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <label className="text-[0.7rem]" style={{ color: "var(--text-muted)" }}>Cantidad:</label>
              <input
                type="number"
                inputMode="numeric"
                value={grams}
                onChange={(e) => setGrams(e.target.value)}
                className="w-20 text-center text-sm rounded-lg py-1.5 border"
                style={{ background: "var(--bg-elevated)", color: "var(--text)", borderColor: "var(--border)" }}
              />
              <span className="text-[0.7rem]" style={{ color: "var(--text-muted)" }}>g</span>
              {selected.servingSize && (
                <button
                  onClick={() => setGrams(String(selected.servingGrams || 100))}
                  className="text-[0.65rem] px-2 py-1 rounded-lg border-none cursor-pointer"
                  style={{ background: "var(--bg-elevated)", color: "var(--accent)" }}
                >
                  1 porción ({selected.servingSize})
                </button>
              )}
            </div>

            {(() => {
              const g = parseInt(grams, 10) || 100;
              const m = calcMacros(selected, g);
              return (
                <div className="flex gap-3 mt-2 text-[0.7rem] font-bold">
                  <span style={{ color: "var(--accent)" }}>{m.calories} kcal</span>
                  <span style={{ color: "#34C759" }}>{m.protein}g P</span>
                  <span style={{ color: "#FFCC00" }}>{m.carbs}g C</span>
                  <span style={{ color: "#AF52DE" }}>{m.fat}g F</span>
                </div>
              );
            })()}

            <button
              onClick={handleAdd}
              className="w-full mt-3 py-2.5 rounded-xl border-none cursor-pointer text-white font-bold text-sm"
              style={{ background: "#34C759" }}
            >
              <Plus size={14} className="inline mr-1" style={{ verticalAlign: "-2px" }} />
              Agregar
            </button>
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-2" style={{ minHeight: "200px" }}>
          {loading && (
            <div className="flex items-center justify-center py-8" style={{ color: "var(--text-muted)" }}>
              <Loader2 size={20} className="animate-spin mr-2" /> Buscando...
            </div>
          )}
          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="text-center py-8 text-[0.75rem]" style={{ color: "var(--text-muted)" }}>
              No se encontraron resultados
            </div>
          )}
          {!loading && results.map((item) => (
            <button
              key={item.code}
              onClick={() => { setSelected(item); setGrams("100"); }}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl cursor-pointer border-none text-left mb-1 transition-colors"
              style={{
                background: selected?.code === item.code ? "var(--accent)" + "18" : "transparent",
              }}
            >
              {item.image ? (
                <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-[0.6rem]" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>🍽️</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[0.78rem] font-semibold truncate" style={{ color: "var(--text)" }}>{item.name}</div>
                {item.brand && <div className="text-[0.6rem] truncate" style={{ color: "var(--text-muted)" }}>{item.brand}</div>}
                <div className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
                  {item.per100g.calories}kcal · {item.per100g.protein}P · {item.per100g.carbs}C · {item.per100g.fat}F /100g
                </div>
              </div>
            </button>
          ))}
          {!loading && !query && (
            <div className="text-center py-8 text-[0.75rem]" style={{ color: "var(--text-muted)" }}>
              Buscá un alimento por nombre o marca
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
