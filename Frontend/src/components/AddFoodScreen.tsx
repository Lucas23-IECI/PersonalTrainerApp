"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Search, X, Plus, Loader2, Clock, TrendingUp, ChevronLeft,
  Camera, Heart, Trash2, Edit3, Zap,
} from "lucide-react";
import { searchFoods, calcMacros, type FoodItem } from "@/lib/openfoodfacts";
import {
  getRecentFoods, getFrequentFoods, getMyFoods, saveMyFood, deleteMyFood,
  getFoodFavorites, addFoodFavorite, removeFoodFavorite, generateId,
  type CustomMeal, type FoodFrequency, type MyFood, type FoodFavorite,
} from "@/lib/storage";
import BarcodeScanner from "@/components/BarcodeScanner";
import { t } from "@/lib/i18n";

type FoodTab = "recientes" | "frecuentes" | "buscar" | "mis-alimentos";

interface AddFoodScreenProps {
  open: boolean;
  slot: string;
  onClose: () => void;
  onAdd: (name: string, calories: number, protein: number, carbs: number, fat: number) => void;
}

export default function AddFoodScreen({ open, slot, onClose, onAdd }: AddFoodScreenProps) {
  const [tab, setTab] = useState<FoodTab>("recientes");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [grams, setGrams] = useState("100");
  const [showBarcode, setShowBarcode] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showCreateFood, setShowCreateFood] = useState(false);
  const [editingFood, setEditingFood] = useState<MyFood | null>(null);

  // Data
  const [recents, setRecents] = useState<CustomMeal[]>([]);
  const [frequents, setFrequents] = useState<FoodFrequency[]>([]);
  const [myFoods, setMyFoods] = useState<MyFood[]>([]);
  const [favorites, setFavorites] = useState<FoodFavorite[]>([]);
  const [myFoodFilter, setMyFoodFilter] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (open) {
      setTab("recientes");
      setQuery("");
      setResults([]);
      setSelectedFood(null);
      setGrams("100");
      setShowQuickAdd(false);
      setShowCreateFood(false);
      setEditingFood(null);
      setMyFoodFilter("");
      refreshData();
    }
  }, [open]);

  function refreshData() {
    setRecents(getRecentFoods());
    setFrequents(getFrequentFoods(30));
    setMyFoods(getMyFoods());
    setFavorites(getFoodFavorites());
  }

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

  function handleAddFromSearch() {
    if (!selectedFood) return;
    const g = parseInt(grams, 10) || 100;
    const macros = calcMacros(selectedFood, g);
    const label = selectedFood.brand
      ? `${selectedFood.name} (${selectedFood.brand}) — ${g}g`
      : `${selectedFood.name} — ${g}g`;
    onAdd(label, macros.calories, macros.protein, macros.carbs, macros.fat);
    onClose();
  }

  function handleAddRecent(food: CustomMeal) {
    onAdd(food.name, food.calories, food.protein, food.carbs, food.fat);
    onClose();
  }

  function handleAddFrequent(food: FoodFrequency) {
    onAdd(food.name, food.calories, food.protein, food.carbs, food.fat);
    onClose();
  }

  function handleAddMyFood(food: MyFood) {
    const label = food.brand
      ? `${food.name} (${food.brand}) — ${food.servingSize}`
      : `${food.name} — ${food.servingSize}`;
    onAdd(label, food.calories, food.protein, food.carbs, food.fat);
    onClose();
  }

  function handleBarcodeFound(food: FoodItem) {
    setShowBarcode(false);
    setSelectedFood(food);
    setGrams("100");
    setTab("buscar");
  }

  function isFav(name: string) {
    return favorites.some((f) => f.name === name);
  }

  function toggleFav(name: string, cal: number, pro: number, carbs: number, fat: number) {
    const ex = favorites.find((f) => f.name === name);
    if (ex) removeFoodFavorite(ex.id);
    else addFoodFavorite({ id: generateId(), name, calories: cal, protein: pro, carbs, fat });
    setFavorites(getFoodFavorites());
  }

  if (!open) return null;

  const tabs: { id: FoodTab; label: string; icon: React.ReactNode }[] = [
    { id: "recientes", label: t("food.recent"), icon: <Clock size={13} /> },
    { id: "frecuentes", label: t("food.frequent"), icon: <TrendingUp size={13} /> },
    { id: "buscar", label: t("common.search"), icon: <Search size={13} /> },
    { id: "mis-alimentos", label: t("food.myFoods"), icon: <Heart size={13} /> },
  ];

  const filteredMyFoods = myFoodFilter
    ? myFoods.filter((f) => f.name.toLowerCase().includes(myFoodFilter.toLowerCase()))
    : myFoods;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <button onClick={onClose} className="bg-transparent border-none cursor-pointer p-1" style={{ color: "var(--text)" }}>
          <ChevronLeft size={22} />
        </button>
        <div className="flex-1">
          <div className="text-sm font-bold" style={{ color: "var(--text)" }}>{t("food.addTo")}{slot}</div>
        </div>
        <button
          onClick={() => setShowQuickAdd(true)}
          className="py-1 px-2.5 rounded-lg border-none cursor-pointer text-[0.65rem] font-bold text-white"
          style={{ background: "#FF9500" }}
        >
          <Zap size={11} className="inline mr-0.5" style={{ verticalAlign: "-1px" }} />
          {t("food.quick")}
        </button>
        <button
          onClick={() => { setShowBarcode(true); }}
          className="py-1 px-2.5 rounded-lg border-none cursor-pointer text-[0.65rem] font-bold"
          style={{ background: "var(--bg-elevated)", color: "var(--accent)" }}
        >
          <Camera size={13} className="inline" style={{ verticalAlign: "-1px" }} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 px-3 pt-2 pb-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); if (t.id === "buscar") setTimeout(() => inputRef.current?.focus(), 100); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[0.65rem] font-semibold whitespace-nowrap cursor-pointer border-none transition-colors"
            style={{
              background: tab === t.id ? "var(--accent)" : "var(--bg-elevated)",
              color: tab === t.id ? "white" : "var(--text-muted)",
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* === RECIENTES === */}
        {tab === "recientes" && (
          <div className="px-3 py-2">
            {recents.length === 0 ? (
              <EmptyState text={t("food.noRecentFoods")} />
            ) : (
              recents.map((food, i) => (
                <FoodRow
                  key={i}
                  name={food.name}
                  detail={`${food.calories} kcal · ${food.protein}P · ${food.carbs}C · ${food.fat}F`}
                  isFavorite={isFav(food.name)}
                  onToggleFav={() => toggleFav(food.name, food.calories, food.protein, food.carbs, food.fat)}
                  onAdd={() => handleAddRecent(food)}
                />
              ))
            )}
          </div>
        )}

        {/* === FRECUENTES === */}
        {tab === "frecuentes" && (
          <div className="px-3 py-2">
            {frequents.length === 0 ? (
              <EmptyState text={t("food.frequentHint")} />
            ) : (
              frequents.map((food, i) => (
                <FoodRow
                  key={i}
                  name={food.name}
                  detail={`${food.calories} kcal · ${food.count}${t("food.timesUsed")}`}
                  isFavorite={isFav(food.name)}
                  onToggleFav={() => toggleFav(food.name, food.calories, food.protein, food.carbs, food.fat)}
                  onAdd={() => handleAddFrequent(food)}
                />
              ))
            )}
          </div>
        )}

        {/* === BUSCAR === */}
        {tab === "buscar" && (
          <div>
            {/* Search bar */}
            <div className="flex items-center gap-2 px-4 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
              <Search size={16} style={{ color: "var(--text-muted)" }} />
              <input
                ref={inputRef}
                type="search"
                placeholder={t("food.searchFood")}
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm"
                style={{ color: "var(--text)" }}
                autoFocus
              />
              {query && (
                <button onClick={() => { setQuery(""); setResults([]); setSelectedFood(null); }} className="bg-transparent border-none cursor-pointer p-1" style={{ color: "var(--text-muted)" }}>
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Selected food detail */}
            {selectedFood && (
              <div className="px-4 py-3" style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-start gap-3 mb-3">
                  {selectedFood.image && (
                    <img src={selectedFood.image} alt="" className="w-14 h-14 rounded-xl object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>{selectedFood.name}</div>
                    {selectedFood.brand && <div className="text-[0.65rem]" style={{ color: "var(--text-muted)" }}>{selectedFood.brand}</div>}
                    <div className="text-[0.6rem] mt-0.5" style={{ color: "var(--text-muted)" }}>
                      Por 100g: {selectedFood.per100g.calories}kcal · {selectedFood.per100g.protein}P · {selectedFood.per100g.carbs}C · {selectedFood.per100g.fat}F
                    </div>
                  </div>
                  <button onClick={() => setSelectedFood(null)} className="bg-transparent border-none cursor-pointer p-1" style={{ color: "var(--text-muted)" }}>
                    <X size={16} />
                  </button>
                </div>

                {/* Serving selector */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[0.7rem]" style={{ color: "var(--text-muted)" }}>{t("food.amount")}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={grams}
                    onChange={(e) => setGrams(e.target.value)}
                    className="w-20 text-center text-sm rounded-lg py-1.5 border"
                    style={{ background: "var(--bg-elevated)", color: "var(--text)", borderColor: "var(--border)" }}
                  />
                  <span className="text-[0.7rem]" style={{ color: "var(--text-muted)" }}>g</span>
                  {selectedFood.servingSize && (
                    <button
                      onClick={() => setGrams(String(selectedFood.servingGrams || 100))}
                      className="text-[0.65rem] px-2.5 py-1.5 rounded-lg border-none cursor-pointer"
                      style={{ background: "var(--bg-elevated)", color: "var(--accent)" }}
                    >
                      {t("food.oneServing")}{selectedFood.servingSize})
                    </button>
                  )}
                  {/* Quick gram buttons */}
                  {[50, 100, 150, 200].map((g) => (
                    <button
                      key={g}
                      onClick={() => setGrams(String(g))}
                      className="text-[0.6rem] px-2 py-1 rounded-md border-none cursor-pointer"
                      style={{
                        background: grams === String(g) ? "var(--accent)" : "var(--bg-elevated)",
                        color: grams === String(g) ? "white" : "var(--text-muted)",
                      }}
                    >
                      {g}g
                    </button>
                  ))}
                </div>

                {/* Computed macros */}
                {(() => {
                  const g = parseInt(grams, 10) || 100;
                  const m = calcMacros(selectedFood, g);
                  return (
                    <div className="flex gap-3 mb-3">
                      <MacroPill label="kcal" value={m.calories} color="var(--accent)" />
                      <MacroPill label="P" value={m.protein} color="#34C759" />
                      <MacroPill label="C" value={m.carbs} color="#FFCC00" />
                      <MacroPill label="F" value={m.fat} color="#AF52DE" />
                    </div>
                  );
                })()}

                <button
                  onClick={handleAddFromSearch}
                  className="w-full py-2.5 rounded-xl border-none cursor-pointer text-white font-bold text-sm"
                  style={{ background: "#34C759" }}
                >
                  <Plus size={14} className="inline mr-1" style={{ verticalAlign: "-2px" }} />
                  {t("food.addTo")}{slot}
                </button>
              </div>
            )}

            {/* Search results */}
            <div className="px-3 py-2">
              {loading && (
                <div className="flex items-center justify-center py-10" style={{ color: "var(--text-muted)" }}>
                  <Loader2 size={20} className="animate-spin mr-2" /> {t("common.searching")}
                </div>
              )}
              {!loading && query.length >= 2 && results.length === 0 && (
                <EmptyState text={t("food.noResults")} />
              )}
              {!loading && results.map((item) => (
                <button
                  key={item.code}
                  onClick={() => { setSelectedFood(item); setGrams("100"); }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl cursor-pointer border-none text-left mb-1 transition-colors"
                  style={{
                    background: selectedFood?.code === item.code ? "var(--accent)" + "18" : "transparent",
                  }}
                >
                  {item.image ? (
                    <img src={item.image} alt="" className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-lg flex-shrink-0 flex items-center justify-center text-lg" style={{ background: "var(--bg-elevated)" }}>🍽️</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.78rem] font-semibold truncate" style={{ color: "var(--text)" }}>{item.name}</div>
                    {item.brand && <div className="text-[0.6rem] truncate" style={{ color: "var(--text-muted)" }}>{item.brand}</div>}
                    <div className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
                      {item.per100g.calories} kcal · {item.per100g.protein}P · {item.per100g.carbs}C · {item.per100g.fat}F /100g
                    </div>
                  </div>
                  <Plus size={18} style={{ color: "var(--accent)", flexShrink: 0 }} />
                </button>
              ))}
              {!loading && !query && (
                <EmptyState text={t("food.searchFoodHint")} />
              )}
            </div>
          </div>
        )}

        {/* === MIS ALIMENTOS === */}
        {tab === "mis-alimentos" && (
          <div className="px-3 py-2">
            <div className="flex gap-2 mb-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
                <Search size={14} style={{ color: "var(--text-muted)" }} />
                <input
                  type="text"
                  placeholder={t("food.filterMyFoods")}
                  value={myFoodFilter}
                  onChange={(e) => setMyFoodFilter(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-[0.75rem]"
                  style={{ color: "var(--text)" }}
                />
              </div>
              <button
                onClick={() => { setEditingFood(null); setShowCreateFood(true); }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border-none cursor-pointer text-[0.7rem] font-bold text-white"
                style={{ background: "#34C759" }}
              >
                <Plus size={14} /> {t("common.create")}
              </button>
            </div>

            {filteredMyFoods.length === 0 ? (
              <EmptyState text={myFoodFilter ? t("food.noFoodsFound") : t("food.createFoodHint")} />
            ) : (
              filteredMyFoods.map((food) => (
                <div key={food.id} className="flex items-center gap-2.5 p-2.5 rounded-xl mb-1.5" style={{ background: "var(--bg-card)" }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ background: "var(--bg-elevated)" }}>🥘</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.78rem] font-semibold truncate" style={{ color: "var(--text)" }}>{food.name}</div>
                    <div className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
                      {food.servingSize} · {food.calories}kcal · {food.protein}P · {food.carbs}C · {food.fat}F
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddMyFood(food)}
                    className="py-1.5 px-3 rounded-lg border-none cursor-pointer text-[0.65rem] font-bold text-white"
                    style={{ background: "var(--accent)" }}
                  >
                    <Plus size={12} className="inline" style={{ verticalAlign: "-1px" }} />
                  </button>
                  <button
                    onClick={() => { setEditingFood(food); setShowCreateFood(true); }}
                    className="bg-transparent border-none cursor-pointer p-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => { deleteMyFood(food.id); setMyFoods(getMyFoods()); }}
                    className="bg-transparent border-none cursor-pointer p-1"
                    style={{ color: "#FF3B30" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <QuickAddModal
          slot={slot}
          onAdd={(name, cal, pro, carbs, fat) => { onAdd(name, cal, pro, carbs, fat); onClose(); }}
          onClose={() => setShowQuickAdd(false)}
        />
      )}

      {/* Create/Edit My Food Modal */}
      {showCreateFood && (
        <CreateFoodModal
          existing={editingFood}
          onSave={(food) => {
            saveMyFood(food);
            setMyFoods(getMyFoods());
            setShowCreateFood(false);
            setEditingFood(null);
          }}
          onClose={() => { setShowCreateFood(false); setEditingFood(null); }}
        />
      )}

      {/* Barcode Scanner */}
      <BarcodeScanner
        open={showBarcode}
        onClose={() => setShowBarcode(false)}
        onFound={handleBarcodeFound}
      />
    </div>
  );
}

// === Sub-components ===

function FoodRow({ name, detail, isFavorite, onToggleFav, onAdd }: {
  name: string; detail: string; isFavorite: boolean; onToggleFav: () => void; onAdd: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-xl mb-1.5" style={{ background: "var(--bg-card)" }}>
      <div className="flex-1 min-w-0">
        <div className="text-[0.78rem] font-semibold truncate" style={{ color: "var(--text)" }}>{name}</div>
        <div className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>{detail}</div>
      </div>
      <button onClick={onToggleFav} className="bg-transparent border-none cursor-pointer p-1" style={{ color: isFavorite ? "#FF3B30" : "var(--text-muted)" }}>
        {isFavorite ? <Heart size={14} fill="#FF3B30" /> : <Heart size={14} />}
      </button>
      <button
        onClick={onAdd}
        className="py-1.5 px-3 rounded-lg border-none cursor-pointer text-[0.65rem] font-bold text-white"
        style={{ background: "var(--accent)" }}
      >
        <Plus size={12} className="inline" style={{ verticalAlign: "-1px" }} />
      </button>
    </div>
  );
}

function MacroPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex-1 text-center py-1.5 rounded-lg" style={{ background: color + "15" }}>
      <div className="text-sm font-black" style={{ color }}>{value}</div>
      <div className="text-[0.55rem]" style={{ color }}>{label}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-10 px-6">
      <div className="text-2xl mb-2">🍽️</div>
      <p className="text-[0.75rem]" style={{ color: "var(--text-muted)" }}>{text}</p>
    </div>
  );
}

// Quick Add just calories/macros
function QuickAddModal({ slot, onAdd, onClose }: {
  slot: string;
  onAdd: (name: string, cal: number, pro: number, carbs: number, fat: number) => void;
  onClose: () => void;
}) {
  const [cal, setCal] = useState("");
  const [pro, setPro] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative w-[90%] max-w-[380px] rounded-2xl p-5" style={{ background: "var(--bg-card)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold" style={{ color: "var(--text)" }}>
            <Zap size={14} className="inline mr-1" style={{ color: "#FF9500", verticalAlign: "-2px" }} />
            {t("food.quickAddTo")}{slot}
          </div>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer p-1" style={{ color: "var(--text-muted)" }}>
            <X size={16} />
          </button>
        </div>
        <p className="text-[0.65rem] mb-3" style={{ color: "var(--text-muted)" }}>
          {t("food.quickAddHint")}
        </p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="block text-[0.6rem] mb-0.5 font-bold" style={{ color: "var(--accent)" }}>{t("food.calories")}</label>
            <input type="number" inputMode="numeric" value={cal} onChange={(e) => setCal(e.target.value)} autoFocus
              className="w-full text-center text-lg font-bold rounded-xl py-2.5 border"
              style={{ background: "var(--bg-elevated)", color: "var(--text)", borderColor: "var(--border)" }}
            />
          </div>
          <div>
            <label className="block text-[0.6rem] mb-0.5 font-bold" style={{ color: "#34C759" }}>{t("food.protein")}</label>
            <input type="number" inputMode="numeric" value={pro} onChange={(e) => setPro(e.target.value)}
              className="w-full text-center text-lg font-bold rounded-xl py-2.5 border"
              style={{ background: "var(--bg-elevated)", color: "var(--text)", borderColor: "var(--border)" }}
            />
          </div>
          <div>
            <label className="block text-[0.6rem] mb-0.5 font-bold" style={{ color: "#FFCC00" }}>{t("food.carbs")}</label>
            <input type="number" inputMode="numeric" value={carbs} onChange={(e) => setCarbs(e.target.value)}
              className="w-full text-center text-lg font-bold rounded-xl py-2.5 border"
              style={{ background: "var(--bg-elevated)", color: "var(--text)", borderColor: "var(--border)" }}
            />
          </div>
          <div>
            <label className="block text-[0.6rem] mb-0.5 font-bold" style={{ color: "#AF52DE" }}>{t("food.fat")}</label>
            <input type="number" inputMode="numeric" value={fat} onChange={(e) => setFat(e.target.value)}
              className="w-full text-center text-lg font-bold rounded-xl py-2.5 border"
              style={{ background: "var(--bg-elevated)", color: "var(--text)", borderColor: "var(--border)" }}
            />
          </div>
        </div>
        <button
          onClick={() => {
            if (!cal) return;
            onAdd(
              `${t("food.quickFoodLabel")} — ${cal} kcal`,
              parseInt(cal, 10),
              parseInt(pro, 10) || 0,
              parseInt(carbs, 10) || 0,
              parseInt(fat, 10) || 0
            );
          }}
          disabled={!cal}
          className="w-full py-2.5 rounded-xl border-none cursor-pointer text-white font-bold text-sm disabled:opacity-40"
          style={{ background: "#FF9500" }}
        >
          <Zap size={14} className="inline mr-1" style={{ verticalAlign: "-2px" }} /> {t("food.addBtn")} {cal ? `${cal} kcal` : ""}
        </button>
      </div>
    </div>
  );
}

// Create / Edit My Food
function CreateFoodModal({ existing, onSave, onClose }: {
  existing: MyFood | null;
  onSave: (food: MyFood) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(existing?.name || "");
  const [brand, setBrand] = useState(existing?.brand || "");
  const [serving, setServing] = useState(existing?.servingSize || "100g");
  const [servingGrams, setServingGrams] = useState(String(existing?.servingGrams || 100));
  const [cal, setCal] = useState(String(existing?.calories || ""));
  const [pro, setPro] = useState(String(existing?.protein || ""));
  const [carbs, setCarbs] = useState(String(existing?.carbs || ""));
  const [fat, setFat] = useState(String(existing?.fat || ""));

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative w-[90%] max-w-[420px] rounded-2xl p-5 max-h-[85vh] overflow-y-auto" style={{ background: "var(--bg-card)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold" style={{ color: "var(--text)" }}>
            {existing ? t("food.editFood") : t("food.createFood")}
          </div>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer p-1" style={{ color: "var(--text-muted)" }}>
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-2.5 mb-4">
          <div>
            <label className="block text-[0.6rem] mb-0.5 font-semibold" style={{ color: "var(--text-muted)" }}>{t("food.nameRequired")}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("food.exampleName")}
              className="w-full text-sm rounded-lg py-2.5 px-3 border" autoFocus
              style={{ background: "var(--bg-elevated)", color: "var(--text)", borderColor: "var(--border)" }}
            />
          </div>
          <div>
            <label className="block text-[0.6rem] mb-0.5 font-semibold" style={{ color: "var(--text-muted)" }}>{t("food.brand")}</label>
            <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder={t("food.exampleBrand")}
              className="w-full text-sm rounded-lg py-2.5 px-3 border"
              style={{ background: "var(--bg-elevated)", color: "var(--text)", borderColor: "var(--border)" }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[0.6rem] mb-0.5 font-semibold" style={{ color: "var(--text-muted)" }}>{t("food.serving")}</label>
              <input type="text" value={serving} onChange={(e) => setServing(e.target.value)} placeholder="100g"
                className="w-full text-sm rounded-lg py-2.5 px-3 border"
                style={{ background: "var(--bg-elevated)", color: "var(--text)", borderColor: "var(--border)" }}
              />
            </div>
            <div>
              <label className="block text-[0.6rem] mb-0.5 font-semibold" style={{ color: "var(--text-muted)" }}>{t("food.gramsLabel")}</label>
              <input type="number" inputMode="numeric" value={servingGrams} onChange={(e) => setServingGrams(e.target.value)}
                className="w-full text-sm rounded-lg py-2.5 px-3 border"
                style={{ background: "var(--bg-elevated)", color: "var(--text)", borderColor: "var(--border)" }}
              />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: t("food.kcalLabel"), val: cal, set: setCal, color: "var(--accent)" },
              { label: t("food.protLabel"), val: pro, set: setPro, color: "#34C759" },
              { label: t("food.carbsLabel"), val: carbs, set: setCarbs, color: "#FFCC00" },
              { label: t("food.fatLabel"), val: fat, set: setFat, color: "#AF52DE" },
            ].map((f) => (
              <div key={f.label}>
                <label className="block text-[0.55rem] mb-0.5 font-bold" style={{ color: f.color }}>{f.label}</label>
                <input type="number" inputMode="numeric" value={f.val} onChange={(e) => f.set(e.target.value)}
                  className="w-full text-center text-sm rounded-lg py-2 border"
                  style={{ background: "var(--bg-elevated)", color: "var(--text)", borderColor: "var(--border)" }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border cursor-pointer text-sm font-semibold"
            style={{ background: "transparent", borderColor: "var(--border)", color: "var(--text-muted)" }}>
            {t("common.cancel")}
          </button>
          <button
            onClick={() => {
              if (!name || !cal) return;
              onSave({
                id: existing?.id || generateId(),
                name: name.trim(),
                brand: brand.trim() || undefined,
                servingSize: serving || "100g",
                servingGrams: parseInt(servingGrams, 10) || 100,
                calories: parseInt(cal, 10) || 0,
                protein: parseInt(pro, 10) || 0,
                carbs: parseInt(carbs, 10) || 0,
                fat: parseInt(fat, 10) || 0,
              });
            }}
            disabled={!name || !cal}
            className="flex-[2] py-2.5 rounded-xl border-none cursor-pointer text-white font-bold text-sm disabled:opacity-40"
            style={{ background: "#34C759" }}
          >
            {existing ? t("food.saveChanges") : t("food.createFood")}
          </button>
        </div>
      </div>
    </div>
  );
}
