"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  Trash2,
  Calendar,
  Grid3X3,
  FlipHorizontal,
  Maximize2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { t } from "@/lib/i18n";
import { PageTransition } from "@/components/motion";
import {
  type FacePhotoMeta,
  getFacePhotoMetas,
  getFacePhotoDataUrl,
  deleteFacePhoto,
  getUniqueDates,
} from "@/lib/face-photo-db";
import FaceCamera from "@/components/face/FaceCamera";

type View = "timeline" | "grid";

function PhotosContent() {
  const params = useSearchParams();
  const initialView = params.get("view") === "timeline" ? "timeline" : "grid";

  const [view, setView] = useState<View>(initialView);
  const [photos, setPhotos] = useState<FacePhotoMeta[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [showMirrored, setShowMirrored] = useState(false);

  // Compare mode
  const [compareMode, setCompareMode] = useState(false);
  const [comparePhoto1, setComparePhoto1] = useState<string | null>(null);
  const [comparePhoto2, setComparePhoto2] = useState<string | null>(null);
  const [compareUrl1, setCompareUrl1] = useState<string | null>(null);
  const [compareUrl2, setCompareUrl2] = useState<string | null>(null);
  const [sliderPos, setSliderPos] = useState(50);

  async function loadPhotos() {
    const metas = await getFacePhotoMetas();
    setPhotos(metas);
    const d = await getUniqueDates();
    setDates(d);
  }

  useEffect(() => { loadPhotos(); }, []);

  async function handleSelect(id: string) {
    if (compareMode) {
      if (!comparePhoto1) {
        setComparePhoto1(id);
        const url = await getFacePhotoDataUrl(id);
        setCompareUrl1(url);
      } else if (!comparePhoto2) {
        setComparePhoto2(id);
        const url = await getFacePhotoDataUrl(id);
        setCompareUrl2(url);
      }
      return;
    }
    setSelectedPhoto(id);
    const url = await getFacePhotoDataUrl(id, showMirrored);
    setPhotoUrl(url);
  }

  async function handleToggleMirror() {
    setShowMirrored(!showMirrored);
    if (selectedPhoto) {
      const url = await getFacePhotoDataUrl(selectedPhoto, !showMirrored);
      setPhotoUrl(url);
    }
  }

  async function handleDelete(id: string) {
    if (confirm(t("face.confirmDeletePhoto"))) {
      await deleteFacePhoto(id);
      setSelectedPhoto(null);
      setPhotoUrl(null);
      await loadPhotos();
    }
  }

  function exitCompare() {
    setCompareMode(false);
    setComparePhoto1(null);
    setComparePhoto2(null);
    setCompareUrl1(null);
    setCompareUrl2(null);
    setSliderPos(50);
  }

  // Photo viewer modal
  if (selectedPhoto && photoUrl) {
    const meta = photos.find(p => p.id === selectedPhoto);
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        <div className="flex items-center justify-between p-4 text-white">
          <button onClick={() => { setSelectedPhoto(null); setPhotoUrl(null); }} className="p-2">
            <ArrowLeft size={20} />
          </button>
          <span className="text-sm">
            {meta?.date} · {meta?.angle}
          </span>
          <div className="flex gap-2">
            <button onClick={handleToggleMirror} className={`p-2 rounded-lg ${showMirrored ? "bg-white/20" : ""}`}>
              <FlipHorizontal size={18} />
            </button>
            <button onClick={() => handleDelete(selectedPhoto)} className="p-2 text-red-400">
              <Trash2 size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <img src={photoUrl} alt="" className="max-w-full max-h-full object-contain rounded-xl" />
        </div>
        {meta?.analysisData && (
          <div className="p-4 text-white text-sm">
            <p>Simetría: {meta.analysisData.symmetryScore}%</p>
            <p>Línea media: {meta.analysisData.midlineDeviation.toFixed(1)}°</p>
          </div>
        )}
      </div>
    );
  }

  // Compare viewer
  if (compareMode && compareUrl1 && compareUrl2) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        <div className="flex items-center justify-between p-4 text-white">
          <button onClick={exitCompare} className="p-2">
            <ArrowLeft size={20} />
          </button>
          <span className="text-sm font-medium">{t("face.compare")}</span>
          <div />
        </div>
        <div className="flex-1 relative overflow-hidden mx-4 rounded-xl">
          <img src={compareUrl2} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
            <img src={compareUrl1} alt="" className="w-full h-full object-cover" style={{ minWidth: `${100 / (sliderPos / 100)}%` }} />
          </div>
          {/* Slider handle */}
          <input
            type="range"
            min={0}
            max={100}
            value={sliderPos}
            onChange={e => setSliderPos(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
          />
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white"
            style={{ left: `${sliderPos}%` }}
          />
        </div>
        <div className="p-4 flex justify-center">
          <button onClick={exitCompare} className="px-6 py-2 rounded-xl bg-white/20 text-white text-sm">
            {t("common.close")}
          </button>
        </div>
      </div>
    );
  }

  if (showCamera) {
    return (
      <FaceCamera
        onPhotoSaved={() => { setShowCamera(false); loadPhotos(); }}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[var(--bg-base)] pb-28">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-[var(--bg-base)]/80 backdrop-blur-lg border-b border-[var(--border)] px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/face" className="p-2 -ml-2 rounded-xl hover:bg-[var(--bg-elevated)]">
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-xl font-bold">{t("face.photos")}</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setCompareMode(!compareMode); exitCompare(); }}
                className={`p-2 rounded-xl text-sm ${compareMode ? "bg-[var(--accent)] text-white" : "hover:bg-[var(--bg-elevated)]"}`}
              >
                <Maximize2 size={18} />
              </button>
              <button
                onClick={() => setShowCamera(true)}
                className="p-2 rounded-xl bg-[var(--accent)] text-white"
              >
                <Camera size={20} />
              </button>
            </div>
          </div>

          {/* View toggle */}
          <div className="flex gap-1 mt-3 p-1 bg-[var(--bg-elevated)] rounded-xl">
            <button
              onClick={() => setView("timeline")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium ${view === "timeline" ? "bg-[var(--accent)] text-white" : "text-[var(--text-muted)]"}`}
            >
              <Calendar size={16} /> Timeline
            </button>
            <button
              onClick={() => setView("grid")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium ${view === "grid" ? "bg-[var(--accent)] text-white" : "text-[var(--text-muted)]"}`}
            >
              <Grid3X3 size={16} /> Grid
            </button>
          </div>

          {compareMode && (
            <p className="text-xs text-[var(--accent)] mt-2 text-center">
              {!comparePhoto1 ? t("face.selectFirst") : t("face.selectSecond")}
            </p>
          )}
        </div>

        <div className="px-4 mt-4">
          {photos.length === 0 ? (
            <div className="text-center py-12">
              <Camera size={48} className="text-[var(--text-muted)] mx-auto mb-4" />
              <p className="text-[var(--text-muted)] mb-4">{t("face.noPhotos")}</p>
              <button
                onClick={() => setShowCamera(true)}
                className="px-6 py-3 rounded-xl bg-[var(--accent)] text-white font-medium"
              >
                {t("face.takeFirstPhoto")}
              </button>
            </div>
          ) : view === "timeline" ? (
            <div className="space-y-6">
              {dates.map(date => {
                const datePhotos = photos.filter(p => p.date === date);
                return (
                  <div key={date}>
                    <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-2">{date}</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {datePhotos.map(p => (
                        <PhotoThumb
                          key={p.id}
                          meta={p}
                          onClick={() => handleSelect(p.id)}
                          selected={comparePhoto1 === p.id || comparePhoto2 === p.id}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photos.map(p => (
                <PhotoThumb
                  key={p.id}
                  meta={p}
                  onClick={() => handleSelect(p.id)}
                  selected={comparePhoto1 === p.id || comparePhoto2 === p.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

function PhotoThumb({ meta, onClick, selected }: { meta: FacePhotoMeta; onClick: () => void; selected: boolean }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    getFacePhotoDataUrl(meta.id).then(setUrl);
  }, [meta.id]);

  return (
    <button
      onClick={onClick}
      className={`aspect-square rounded-xl overflow-hidden bg-[var(--bg-elevated)] relative ${
        selected ? "ring-2 ring-[var(--accent)]" : ""
      }`}
    >
      {url ? (
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Camera size={20} className="text-[var(--text-muted)]" />
        </div>
      )}
      <span className="absolute bottom-1 left-1 text-[9px] bg-black/50 text-white px-1 rounded">
        {meta.angle}
      </span>
    </button>
  );
}

export default function FacePhotosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-base)]" />}>
      <PhotosContent />
    </Suspense>
  );
}
