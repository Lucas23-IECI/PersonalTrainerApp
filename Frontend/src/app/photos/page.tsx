"use client";

import { useState, useEffect, useRef } from "react";
import {
  getProgressPhotos,
  saveProgressPhoto,
  deleteProgressPhoto,
  generateId,
  today,
  type ProgressPhoto,
} from "@/lib/storage";
import { Camera, Trash2, ChevronLeft, ChevronRight, Plus, X, Image as ImageIcon } from "lucide-react";
import { t } from "@/lib/i18n";

type Pose = "front" | "side" | "back";
import { PageTransition } from "@/components/motion";
const POSES: { id: Pose; label: string; icon: string }[] = [
  { id: "front", label: "Frente", icon: "🧍" },
  { id: "side", label: "Lateral", icon: "🧍‍♂️" },
  { id: "back", label: "Espalda", icon: "🔙" },
];

export default function PhotosPage() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedPose, setSelectedPose] = useState<Pose>("front");
  const [filterPose, setFilterPose] = useState<Pose | "all">("all");
  const [preview, setPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [weight, setWeight] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [compareA, setCompareA] = useState<ProgressPhoto | null>(null);
  const [compareB, setCompareB] = useState<ProgressPhoto | null>(null);
  const [lightbox, setLightbox] = useState<ProgressPhoto | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const all = getProgressPhotos();
    all.sort((a, b) => b.date.localeCompare(a.date));
    setPhotos(all);
  }, []);

  const filtered = filterPose === "all" ? photos : photos.filter((p) => p.pose === filterPose);

  // Group by date
  const grouped = filtered.reduce<Record<string, ProgressPhoto[]>>((acc, p) => {
    (acc[p.date] ??= []).push(p);
    return acc;
  }, {});
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert(t("photos.errors.fileTooLarge"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      // Resize to max 800px to save localStorage space
      const img = document.createElement("img");
      img.onload = () => {
        const MAX = 800;
        let w = img.width;
        let h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = (h / w) * MAX; w = MAX; }
          else { w = (w / h) * MAX; h = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        setPreview(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    if (!preview) return;
    const photo: ProgressPhoto = {
      id: generateId(),
      date: today(),
      dataUrl: preview,
      pose: selectedPose,
      weight: weight ? parseFloat(weight) : undefined,
      notes: notes.trim() || undefined,
    };
    saveProgressPhoto(photo);
    setPhotos((prev) => [photo, ...prev]);
    setShowUpload(false);
    setPreview(null);
    setNotes("");
    setWeight("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleDelete(id: string) {
    if (!confirm(t("common.delete") + "?")) return;
    deleteProgressPhoto(id);
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    if (lightbox?.id === id) setLightbox(null);
    if (compareA?.id === id) setCompareA(null);
    if (compareB?.id === id) setCompareB(null);
  }

  function handlePhotoClick(photo: ProgressPhoto) {
    if (compareMode) {
      if (!compareA) setCompareA(photo);
      else if (!compareB && compareA.id !== photo.id) setCompareB(photo);
      else if (compareA.id === photo.id) setCompareA(null);
      else if (compareB?.id === photo.id) setCompareB(null);
    } else {
      setLightbox(photo);
    }
  }

  function formatDate(d: string) {
    const [y, m, day] = d.split("-");
    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(day));
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return `${days[date.getDay()]} ${day} ${months[parseInt(m) - 1]} ${y}`;
  }

  return (
    <PageTransition>
    <main className="max-w-[600px] mx-auto px-4 py-5">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-[1.3rem] font-black tracking-tight mb-1">{t("photos.title")}</h1>
          <p className="text-[0.7rem]" style={{ color: "var(--text-secondary)" }}>{photos.length} {t("photos.photos")} · {dates.length} {t("common.sessions")}</p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="btn btn-primary text-sm py-2 px-3"
        >
          <Plus size={16} /> {t("common.photo")}
        </button>
      </div>

      {/* Upload panel */}
      {showUpload && (
        <div className="card mb-4 animate-fade-in">
          <div className="text-[0.65rem] uppercase tracking-widest font-bold mb-3" style={{ color: "var(--text-secondary)" }}>{t("photos.newPhoto")}</div>

          {/* Pose selector */}
          <div className="flex gap-2 mb-4">
            {POSES.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPose(p.id)}
                className="flex-1 flex flex-col items-center gap-1 py-3 rounded-xl cursor-pointer border-2 transition-all"
                style={{
                  background: selectedPose === p.id ? "var(--accent)" : "var(--bg-elevated)",
                  borderColor: selectedPose === p.id ? "var(--accent)" : "transparent",
                  color: selectedPose === p.id ? "#fff" : "var(--text)",
                }}
              >
                <span className="text-xl">{p.icon}</span>
                <span className="text-[0.65rem] font-bold">{t(`photos.poses.${p.id}`)}</span>
              </button>
            ))}
          </div>

          {/* Upload area */}
          {!preview ? (
            <div
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 py-8 rounded-xl cursor-pointer transition-colors"
              style={{ background: "var(--bg-elevated)", border: "2px dashed var(--border)" }}
            >
              <Camera size={32} style={{ color: "var(--text-muted)" }} />
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>{t("photos.tapToUpload")}</span>
              <span className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>{t("photos.supportedFormats")}</span>
            </div>
          ) : (
            <div className="relative mb-3">
              <img src={preview} alt="Preview" className="w-full rounded-xl" style={{ maxHeight: 300, objectFit: "cover" }} />
              <button
                onClick={() => { setPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer border-none"
                style={{ background: "rgba(0,0,0,0.5)", color: "#fff" }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />

          {/* Optional fields */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div>
              <label className="block text-[0.55rem] uppercase mb-1" style={{ color: "var(--text-muted)" }}>{t("common.weightKg")}</label>
              <input type="number" step={0.1} value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="80" className="w-full text-center text-sm py-2 rounded-lg" style={{ background: "var(--bg-elevated)" }} />
            </div>
            <div>
              <label className="block text-[0.55rem] uppercase mb-1" style={{ color: "var(--text-muted)" }}>{t("common.notes")}</label>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Semana 4..." className="w-full text-sm py-2 px-2 rounded-lg" style={{ background: "var(--bg-elevated)" }} />
            </div>
          </div>

          <button onClick={handleSave} disabled={!preview} className="btn btn-primary w-full mt-3 py-2.5" style={{ opacity: preview ? 1 : 0.4 }}>
            {t("photos.savePhoto")}
          </button>
        </div>
      )}

      {/* Filter & compare bar */}
      <div className="flex gap-2 mb-4 items-center flex-wrap">
        {(["all", ...POSES.map((p) => p.id)] as const).map((p) => (
          <button
            key={p}
            onClick={() => setFilterPose(p)}
            className="text-[0.65rem] px-2.5 py-1.5 rounded-lg cursor-pointer border-none transition-colors"
            style={{
              background: filterPose === p ? "var(--accent)" : "var(--bg-card)",
              color: filterPose === p ? "#fff" : "var(--text-muted)",
            }}
          >
            {p === "all" ? t("common.all") : t(`photos.poses.${p}`)}
          </button>
        ))}
        <button
          onClick={() => { setCompareMode(!compareMode); setCompareA(null); setCompareB(null); }}
          className="text-[0.65rem] px-2.5 py-1.5 rounded-lg cursor-pointer border-none ml-auto transition-colors"
          style={{
            background: compareMode ? "#FF950020" : "var(--bg-card)",
            color: compareMode ? "#FF9500" : "var(--text-muted)",
          }}
        >
          {compareMode ? t("common.cancel") : t("photos.compare")}
        </button>
      </div>

      {/* Compare view */}
      {compareMode && (compareA || compareB) && (
        <div className="card mb-4 animate-fade-in">
          <div className="text-[0.6rem] uppercase tracking-widest font-bold mb-2" style={{ color: "var(--text-muted)" }}>{t("photos.comparison")}</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center">
              {compareA ? (
                <>
                  <img src={compareA.dataUrl} alt="A" className="w-full rounded-xl mb-1" style={{ aspectRatio: "3/4", objectFit: "cover" }} />
                  <div className="text-[0.65rem] font-bold">{compareA.date.slice(5)}</div>
                  {compareA.weight && <div className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>{compareA.weight}kg</div>}
                </>
              ) : (
                <div className="flex items-center justify-center rounded-xl" style={{ aspectRatio: "3/4", background: "var(--bg-elevated)" }}>
                  <span className="text-[0.7rem]" style={{ color: "var(--text-muted)" }}>{t("photos.choosePhoto1")}</span>
                </div>
              )}
            </div>
            <div className="text-center">
              {compareB ? (
                <>
                  <img src={compareB.dataUrl} alt="B" className="w-full rounded-xl mb-1" style={{ aspectRatio: "3/4", objectFit: "cover" }} />
                  <div className="text-[0.65rem] font-bold">{compareB.date.slice(5)}</div>
                  {compareB.weight && <div className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>{compareB.weight}kg</div>}
                </>
              ) : (
                <div className="flex items-center justify-center rounded-xl" style={{ aspectRatio: "3/4", background: "var(--bg-elevated)" }}>
                  <span className="text-[0.7rem]" style={{ color: "var(--text-muted)" }}>{t("photos.choosePhoto2")}</span>
                </div>
              )}
            </div>
          </div>
          {compareA && compareB && compareA.weight && compareB.weight && (
            <div className="text-center mt-2 text-[0.7rem]">
              <span style={{ color: "var(--text-muted)" }}>{t("photos.difference")}</span>
              <span className={`font-bold ${compareB.weight - compareA.weight < 0 ? "text-[#34C759]" : "text-[#FF3B30]"}`}>
                {compareB.weight - compareA.weight > 0 ? "+" : ""}{(compareB.weight - compareA.weight).toFixed(1)}kg
              </span>
            </div>
          )}
        </div>
      )}

      {/* Photo gallery */}
      {photos.length === 0 && !showUpload && (
        <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
          <ImageIcon size={40} className="mx-auto mb-3 opacity-30" />
          <div className="text-[0.9rem] font-semibold mb-1">{t("photos.noPhotosYet")}</div>
          <div className="text-[0.7rem]">{t("photos.takePhotosTip")}</div>
        </div>
      )}

      {dates.map((date) => (
        <div key={date} className="mb-5">
          <div className="text-[0.7rem] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-secondary)" }}>
            {formatDate(date)}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {grouped[date].map((photo) => {
              const isSelected = compareA?.id === photo.id || compareB?.id === photo.id;
              return (
                <div
                  key={photo.id}
                  onClick={() => handlePhotoClick(photo)}
                  className="relative cursor-pointer rounded-xl overflow-hidden transition-transform active:scale-95"
                  style={{
                    aspectRatio: "3/4",
                    outline: isSelected ? "3px solid var(--accent)" : "none",
                    outlineOffset: -3,
                  }}
                >
                  <img src={photo.dataUrl} alt={photo.pose} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.6))" }}>
                    <div className="text-[0.55rem] text-white font-bold uppercase">{photo.pose}</div>
                    {photo.weight && <div className="text-[0.5rem] text-white/70">{photo.weight}kg</div>}
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[0.6rem] font-bold text-white" style={{ background: "var(--accent)" }}>
                      {compareA?.id === photo.id ? "1" : "2"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in"
          style={{ background: "rgba(0,0,0,0.9)" }}
          onClick={() => setLightbox(null)}
        >
          <div className="max-w-[500px] w-full px-4" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.dataUrl} alt={lightbox.pose} className="w-full rounded-2xl mb-3" />
            <div className="text-center text-white">
              <div className="text-sm font-bold mb-0.5">{formatDate(lightbox.date)}</div>
              <div className="text-[0.7rem] text-white/60 flex gap-3 justify-center">
                <span className="uppercase">{lightbox.pose}</span>
                {lightbox.weight && <span>{lightbox.weight}kg</span>}
              </div>
              {lightbox.notes && <div className="text-[0.7rem] text-white/50 mt-1 italic">{lightbox.notes}</div>}
            </div>
            <div className="flex gap-2 mt-4 justify-center">
              <button onClick={() => setLightbox(null)} className="btn btn-ghost text-white border-white/20 text-sm">
                {t("common.close")}
              </button>
              <button onClick={() => { handleDelete(lightbox.id); }} className="btn btn-danger text-sm">
                <Trash2 size={14} /> {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
    </PageTransition>
  );
}
