"use client";

import { useState } from "react";
import { ACTIVITY_CATEGORIES, estimateCalories, saveActivity, type LoggedActivity, type ActivityCategory } from "@/data/activities";
import { getProfileData } from "@/data/profile";
import { X, Plus, Minus } from "lucide-react";

interface AddActivityModalProps {
  onClose: () => void;
  onSaved: () => void;
}

export default function AddActivityModal({ onClose, onSaved }: AddActivityModalProps) {
  const [selected, setSelected] = useState<ActivityCategory | null>(null);
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [customName, setCustomName] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const profile = getProfileData();
  const metValue = selected?.metValue || 5;
  const calories = estimateCalories(metValue, profile.weight, duration);

  function handleSave() {
    if (!selected && !customName.trim()) return;

    const activity: LoggedActivity = {
      id: `act-${Date.now()}`,
      categoryId: selected?.id || "custom",
      name: selected?.name || customName.trim(),
      date: new Date().toISOString().split("T")[0],
      durationMin: duration,
      caloriesEstimated: calories,
      rating,
      notes: notes.trim() || undefined,
    };

    saveActivity(activity);
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div
        className="card w-full max-w-[540px] rounded-t-2xl rounded-b-none p-5 pb-8"
        style={{ maxHeight: "85vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>Registrar Actividad</h3>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer p-1" style={{ color: "var(--text-muted)" }}>
            <X size={20} />
          </button>
        </div>

        {/* Category grid */}
        {!selected && !showCustom && (
          <>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {ACTIVITY_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelected(cat)}
                  className="flex flex-col items-center gap-1 py-3 rounded-xl border-none cursor-pointer transition-colors"
                  style={{ background: "var(--bg-elevated)" }}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-[0.68rem] font-semibold" style={{ color: "var(--text)" }}>{cat.name}</span>
                  <span className="text-[0.55rem]" style={{ color: "var(--text-muted)" }}>MET {cat.metValue}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowCustom(true)}
              className="w-full py-2.5 rounded-xl text-[0.78rem] font-semibold cursor-pointer border-none"
              style={{ background: "var(--bg-elevated)", color: "var(--accent)" }}
            >
              + Actividad personalizada
            </button>
          </>
        )}

        {/* Custom activity name input */}
        {showCustom && !selected && (
          <div className="mb-4">
            <label className="text-[0.68rem] block mb-1" style={{ color: "var(--text-muted)" }}>Nombre de la actividad</label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="ej: Padel, Escalada..."
              className="w-full py-2 px-3 rounded-lg text-sm border-none"
              style={{ background: "var(--bg-elevated)", color: "var(--text)" }}
              maxLength={50}
              autoFocus
            />
            <button
              onClick={() => {
                if (customName.trim()) {
                  setSelected({ id: "custom", name: customName.trim(), icon: "🏋️", metValue: 5 });
                }
              }}
              disabled={!customName.trim()}
              className="btn btn-primary w-full mt-2 text-[0.8rem]"
            >
              Continuar
            </button>
          </div>
        )}

        {/* Duration & details form */}
        {selected && (
          <div>
            <div className="flex items-center gap-3 mb-4 py-2 px-3 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
              <span className="text-2xl">{selected.icon}</span>
              <div>
                <div className="font-bold text-sm" style={{ color: "var(--text)" }}>{selected.name}</div>
                <div className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>MET {selected.metValue}</div>
              </div>
              <button
                onClick={() => { setSelected(null); setShowCustom(false); }}
                className="ml-auto text-[0.65rem] text-[var(--accent)] bg-transparent border-none cursor-pointer"
              >
                Cambiar
              </button>
            </div>

            {/* Duration stepper */}
            <label className="text-[0.68rem] block mb-1.5" style={{ color: "var(--text-muted)" }}>Duración</label>
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setDuration(Math.max(5, duration - 5))}
                className="w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer"
                style={{ background: "var(--bg-elevated)", color: "var(--text)" }}
              >
                <Minus size={14} />
              </button>
              <div className="flex-1 text-center">
                <span className="text-2xl font-black" style={{ color: "var(--text)" }}>{duration}</span>
                <span className="text-[0.7rem] ml-1" style={{ color: "var(--text-muted)" }}>min</span>
              </div>
              <button
                onClick={() => setDuration(Math.min(300, duration + 5))}
                className="w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer"
                style={{ background: "var(--bg-elevated)", color: "var(--text)" }}
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Calorie estimate */}
            <div
              className="text-center py-3 rounded-lg mb-4"
              style={{ background: "var(--bg-elevated)" }}
            >
              <div className="text-[0.6rem] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Calorías estimadas</div>
              <div className="text-xl font-black" style={{ color: "#FF9500" }}>{calories} kcal</div>
              <div className="text-[0.55rem]" style={{ color: "var(--text-secondary)" }}>
                MET {metValue} × {profile.weight}kg × {(duration / 60).toFixed(1)}h
              </div>
            </div>

            {/* Rating */}
            <label className="text-[0.68rem] block mb-1.5" style={{ color: "var(--text-muted)" }}>¿Cómo estuvo?</label>
            <div className="flex gap-2 mb-4">
              {([1, 2, 3, 4, 5] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRating(r)}
                  className="flex-1 py-2 rounded-lg text-sm font-bold border-none cursor-pointer transition-colors"
                  style={{
                    background: rating === r ? "var(--accent)" : "var(--bg-elevated)",
                    color: rating === r ? "#fff" : "var(--text-muted)",
                  }}
                >
                  {"⭐".repeat(r > 3 ? 1 : 0)}{r}
                </button>
              ))}
            </div>

            {/* Notes */}
            <label className="text-[0.68rem] block mb-1.5" style={{ color: "var(--text-muted)" }}>Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Cómo te sentiste, detalles..."
              rows={2}
              className="w-full py-2 px-3 rounded-lg text-[0.78rem] border-none resize-none mb-4"
              style={{ background: "var(--bg-elevated)", color: "var(--text)" }}
              maxLength={200}
            />

            {/* Save */}
            <button onClick={handleSave} className="btn btn-primary w-full text-[0.85rem] font-bold">
              ✅ Guardar Actividad
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
