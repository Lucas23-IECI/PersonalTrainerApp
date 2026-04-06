"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, X, Loader2, Keyboard, ScanLine } from "lucide-react";
import { lookupBarcode, type FoodItem } from "@/lib/openfoodfacts";
import { t } from "@/lib/i18n";

interface Props {
  open: boolean;
  onClose: () => void;
  onFound: (food: FoodItem) => void;
}

type ScanMode = "camera" | "manual";

export default function BarcodeScanner({ open, onClose, onFound }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<ScanMode>("camera");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  const handleFound = useCallback(async (barcode: string) => {
    if (loading) return;
    setLoading(true);
    setError("");
    scanningRef.current = false;
    const food = await lookupBarcode(barcode);
    setLoading(false);
    if (food) {
      stopCamera();
      onFound(food);
      setCode("");
      onClose();
    } else {
      setError(t("barcode.notFound"));
      scanningRef.current = true;
    }
  }, [loading, onFound, onClose, stopCamera]);

  // Camera scanning loop using BarcodeDetector API
  useEffect(() => {
    if (!open || mode !== "camera") return;

    let cancelled = false;
    const hasBarcodeDetector = typeof window !== "undefined" && "BarcodeDetector" in window;

    if (!hasBarcodeDetector) {
      setCameraError("Tu navegador no soporta escaneo de cámara. Usa entrada manual.");
      setMode("manual");
      return;
    }

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraReady(true);
        scanningRef.current = true;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detector = new (window as any).BarcodeDetector({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
        });

        async function scanFrame() {
          if (cancelled || !scanningRef.current || !videoRef.current) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0 && scanningRef.current) {
              const raw = barcodes[0].rawValue;
              if (raw) {
                scanningRef.current = false;
                handleFound(raw);
                return;
              }
            }
          } catch {
            // detection error, retry
          }
          if (!cancelled && scanningRef.current) {
            requestAnimationFrame(scanFrame);
          }
        }

        scanFrame();
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("Permission") || msg.includes("NotAllowed")) {
          setCameraError("Permiso de cámara denegado.");
        } else {
          setCameraError("No se pudo acceder a la cámara.");
        }
        setMode("manual");
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      scanningRef.current = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setCameraReady(false);
    };
  }, [open, mode, handleFound]);

  // Focus manual input
  useEffect(() => {
    if (open && mode === "manual") {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open, mode]);

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      stopCamera();
      setCode("");
      setError("");
      setCameraError("");
      setMode("camera");
      setLoading(false);
    }
  }, [open, stopCamera]);

  async function handleManualLookup() {
    const clean = code.replace(/\D/g, "");
    if (!clean) return;
    await handleFound(clean);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-[90%] max-w-[400px] rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-2">
            <Camera size={18} style={{ color: "var(--accent)" }} />
            <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{t("barcode.scanTitle")}</span>
          </div>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer p-1" style={{ color: "var(--text-muted)" }}>
            <X size={18} />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 mx-4 mb-3 p-0.5 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
          <button
            onClick={() => setMode("camera")}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md border-none cursor-pointer text-xs font-medium transition-all"
            style={{
              background: mode === "camera" ? "var(--accent)" : "transparent",
              color: mode === "camera" ? "#fff" : "var(--text-muted)",
            }}
          >
            <ScanLine size={13} /> Cámara
          </button>
          <button
            onClick={() => { stopCamera(); setMode("manual"); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md border-none cursor-pointer text-xs font-medium transition-all"
            style={{
              background: mode === "manual" ? "var(--accent)" : "transparent",
              color: mode === "manual" ? "#fff" : "var(--text-muted)",
            }}
          >
            <Keyboard size={13} /> Manual
          </button>
        </div>

        {mode === "camera" ? (
          <div className="px-4 pb-4">
            <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: "4/3" }}>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              {/* Scan guide overlay */}
              {cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className="w-[70%] h-16 border-2 rounded-lg"
                    style={{ borderColor: loading ? "#FFCC00" : "var(--accent)", opacity: 0.8 }}
                  />
                </div>
              )}
              {!cameraReady && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent)" }} />
                </div>
              )}
            </div>
            {cameraError && (
              <p className="text-[0.7rem] mt-2 text-center" style={{ color: "#FF3B30" }}>{cameraError}</p>
            )}
            {loading && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <Loader2 size={14} className="animate-spin" style={{ color: "var(--accent)" }} />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Buscando producto...</span>
              </div>
            )}
            {error && (
              <p className="text-[0.7rem] mt-2 text-center" style={{ color: "#FF3B30" }}>{error}</p>
            )}
            <p className="text-[0.65rem] mt-2 text-center" style={{ color: "var(--text-muted)" }}>
              Apunta la cámara al código de barras del producto
            </p>
          </div>
        ) : (
          <div className="px-4 pb-4">
            <p className="text-[0.7rem] mb-3" style={{ color: "var(--text-muted)" }}>
              {t("barcode.instructions")}
            </p>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Ej: 7790895000386"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleManualLookup()}
              className="w-full mb-3 text-sm rounded-lg py-2.5 px-3 border"
              style={{ background: "var(--bg-elevated)", color: "var(--text)", borderColor: "var(--border)" }}
            />
            {error && (
              <p className="text-[0.7rem] mb-2" style={{ color: "#FF3B30" }}>{error}</p>
            )}
            <button
              onClick={handleManualLookup}
              disabled={loading || !code.trim()}
              className="w-full py-2.5 rounded-xl border-none cursor-pointer text-white font-bold text-sm disabled:opacity-50"
              style={{ background: "var(--accent)" }}
            >
              {loading ? (
                <><Loader2 size={14} className="inline animate-spin mr-1" style={{ verticalAlign: "-2px" }} /> {t("common.searching")}</>
              ) : (
                t("barcode.searchProduct")
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
