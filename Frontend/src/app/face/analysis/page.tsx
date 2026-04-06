"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Camera,
  Loader2,
  AlertCircle,
  Eye,
  Smile,
  Hexagon,
  Ruler,
  RotateCcw,
} from "lucide-react";
import { t } from "@/lib/i18n";
import { PageTransition } from "@/components/motion";
import { analyzeFaceImage } from "@/lib/face-analysis";
import {
  type FacePhotoMeta,
  type FaceAnalysisResult,
  getFacePhotoMetas,
  getFacePhotoDataUrl,
  updateFacePhotoAnalysis,
} from "@/lib/face-photo-db";

function ScoreRing({ score, label, size = 64 }: { score: number; label: string; size?: number }) {
  const color = score >= 80 ? "#30D158" : score >= 60 ? "#FF9500" : "#FF3B30";
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth="4" />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{score}</span>
      </div>
      <span className="text-[10px] text-[var(--text-muted)] text-center">{label}</span>
    </div>
  );
}

export default function FaceAnalysisPage() {
  const [photos, setPhotos] = useState<FacePhotoMeta[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FaceAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLandmarks, setShowLandmarks] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    getFacePhotoMetas().then(setPhotos);
  }, []);

  async function selectPhoto(id: string) {
    setSelectedPhotoId(id);
    setAnalysis(null);
    setError(null);
    const url = await getFacePhotoDataUrl(id);
    setImageUrl(url);

    // Check if already analyzed
    const meta = photos.find(p => p.id === id);
    if (meta?.analysisData) {
      setAnalysis(meta.analysisData);
    }
  }

  async function handleAnalyze() {
    if (!imgRef.current || !selectedPhotoId) return;
    setAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeFaceImage(imgRef.current);
      setAnalysis(result);
      // Persist
      await updateFacePhotoAnalysis(selectedPhotoId, result);
      // Update local state
      setPhotos(prev => prev.map(p =>
        p.id === selectedPhotoId ? { ...p, analysisData: result } : p
      ));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al analizar");
    } finally {
      setAnalyzing(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setSelectedPhotoId(null);
    setAnalysis(null);
    setError(null);
  }

  // Draw landmarks overlay
  useEffect(() => {
    if (!showLandmarks || !analysis?.landmarks || !canvasRef.current || !imgRef.current) return;
    const canvas = canvasRef.current;
    const img = imgRef.current;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw dots
    ctx.fillStyle = "rgba(0, 200, 100, 0.6)";
    for (const [x, y] of analysis.landmarks) {
      ctx.beginPath();
      ctx.arc(x * canvas.width, y * canvas.height, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw midline
    ctx.strokeStyle = "rgba(255, 255, 0, 0.5)";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    const top = analysis.landmarks[10]; // forehead
    const bottom = analysis.landmarks[152]; // chin
    if (top && bottom) {
      ctx.moveTo(top[0] * canvas.width, top[1] * canvas.height);
      ctx.lineTo(bottom[0] * canvas.width, bottom[1] * canvas.height);
      ctx.stroke();
    }
  }, [showLandmarks, analysis]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-[var(--bg-base)] pb-28">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-[var(--bg-base)]/80 backdrop-blur-lg border-b border-[var(--border)] px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/face" className="p-2 -ml-2 rounded-xl hover:bg-[var(--bg-elevated)]">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-bold">{t("face.analysis")}</h1>
          </div>
        </div>

        <div className="px-4 mt-4 space-y-4">
          {/* Source selector */}
          {!imageUrl && (
            <div className="space-y-3">
              {/* From existing photos */}
              {photos.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-2">{t("face.selectPhoto")}</h3>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {photos.filter(p => p.angle === "front").slice(0, 10).map(p => (
                      <PhotoThumbSmall key={p.id} photoId={p.id} onClick={() => selectPhoto(p.id)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Upload */}
              <label className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--bg-elevated)] cursor-pointer">
                <Upload size={24} className="text-[var(--accent)]" />
                <div>
                  <p className="font-medium">{t("face.uploadPhoto")}</p>
                  <p className="text-xs text-[var(--text-muted)]">{t("face.uploadPhotoDesc")}</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Image + Analysis */}
          {imageUrl && (
            <div className="space-y-4">
              {/* Image container */}
              <div className="relative rounded-2xl overflow-hidden bg-[var(--bg-elevated)]">
                <img
                  ref={imgRef}
                  src={imageUrl}
                  alt=""
                  className="w-full"
                  crossOrigin="anonymous"
                />
                {showLandmarks && (
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full"
                  />
                )}
              </div>

              {/* Controls */}
              <div className="flex gap-2">
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="flex-1 py-3 rounded-xl bg-[var(--accent)] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {analyzing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {t("face.analyzing")}
                    </>
                  ) : (
                    t("face.analyze")
                  )}
                </button>
                {analysis && (
                  <button
                    onClick={() => setShowLandmarks(!showLandmarks)}
                    className={`p-3 rounded-xl ${showLandmarks ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-elevated)]"}`}
                  >
                    <Eye size={20} />
                  </button>
                )}
                <button
                  onClick={() => { setImageUrl(null); setAnalysis(null); setSelectedPhotoId(null); }}
                  className="p-3 rounded-xl bg-[var(--bg-elevated)]"
                >
                  <RotateCcw size={20} />
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-500 text-sm">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {/* Results */}
              {analysis && (
                <div className="space-y-4">
                  {/* Overall score */}
                  <div className="flex items-center justify-center py-4">
                    <ScoreRing score={analysis.symmetryScore} label={t("face.overallSymmetry")} size={96} />
                  </div>

                  {/* Detailed scores */}
                  <div className="grid grid-cols-3 gap-3">
                    <ScoreRing score={analysis.eyeSymmetry} label={t("face.eyes")} />
                    <ScoreRing score={analysis.mouthSymmetry} label={t("face.mouth")} />
                    <ScoreRing score={analysis.jawSymmetry} label={t("face.jaw")} />
                  </div>

                  {/* Metrics */}
                  <div className="bg-[var(--bg-elevated)] rounded-2xl p-4 space-y-3">
                    <h3 className="text-sm font-semibold">{t("face.metrics")}</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Ruler size={16} className="text-[var(--text-muted)]" />
                        <span className="text-sm">{t("face.midlineDeviation")}</span>
                      </div>
                      <span className="text-sm font-mono font-medium">{analysis.midlineDeviation}°</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Hexagon size={16} className="text-[var(--text-muted)]" />
                        <span className="text-sm">{t("face.chinTorsion")}</span>
                      </div>
                      <span className="text-sm font-mono font-medium">{analysis.chinTorsion}°</span>
                    </div>
                  </div>

                  {/* Interpretation */}
                  <div className="bg-[var(--bg-elevated)] rounded-2xl p-4">
                    <h3 className="text-sm font-semibold mb-2">{t("face.interpretation")}</h3>
                    <p className="text-sm text-[var(--text-muted)]">
                      {analysis.symmetryScore >= 85
                        ? t("face.symmetryExcellent")
                        : analysis.symmetryScore >= 70
                        ? t("face.symmetryGood")
                        : analysis.symmetryScore >= 50
                        ? t("face.symmetryFair")
                        : t("face.symmetryLow")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

function PhotoThumbSmall({ photoId, onClick }: { photoId: string; onClick: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => { getFacePhotoDataUrl(photoId).then(setUrl); }, [photoId]);

  return (
    <button
      onClick={onClick}
      className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-[var(--bg-elevated)]"
    >
      {url ? (
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Camera size={14} className="text-[var(--text-muted)]" />
        </div>
      )}
    </button>
  );
}
