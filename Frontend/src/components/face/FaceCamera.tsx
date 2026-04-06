"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  Camera,
  FlipHorizontal,
  RotateCcw,
  Check,
  X,
} from "lucide-react";
import { t } from "@/lib/i18n";
import { type FacePhotoAngle, saveFacePhoto } from "@/lib/face-photo-db";

const ANGLES: { key: FacePhotoAngle; label: string; guide: string }[] = [
  { key: "front", label: "Frontal", guide: "Mira directamente a la cámara" },
  { key: "left", label: "Izquierda", guide: "Gira la cabeza hacia la izquierda" },
  { key: "right", label: "Derecha", guide: "Gira la cabeza hacia la derecha" },
  { key: "45-left", label: "45° Izq", guide: "Gira 45° hacia la izquierda" },
  { key: "45-right", label: "45° Der", guide: "Gira 45° hacia la derecha" },
  { key: "smile", label: "Sonrisa", guide: "Sonríe naturalmente" },
];

interface Props {
  onPhotoSaved: () => void;
  onClose: () => void;
}

export default function FaceCamera({ onPhotoSaved, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [selectedAngle, setSelectedAngle] = useState<FacePhotoAngle>("front");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [mirrorMode, setMirrorMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
    } catch {
      // Camera permission denied or unavailable
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;

    // Selfie cameras are already mirrored in the video preview
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(blob => {
      if (blob) {
        setCapturedBlob(blob);
        setCapturedImage(URL.createObjectURL(blob));
      }
    }, "image/jpeg", 0.92);
  }

  async function handleSave() {
    if (!capturedBlob) return;
    setSaving(true);
    try {
      // Create mirrored version
      const canvas = canvasRef.current;
      let mirroredBlob: Blob | undefined;
      if (canvas) {
        const ctx = canvas.getContext("2d")!;
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(canvas, -canvas.width, 0);
        ctx.restore();
        mirroredBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob(b => resolve(b!), "image/jpeg", 0.92);
        });
      }
      await saveFacePhoto(
        capturedBlob,
        selectedAngle,
        mirroredBlob,
        canvasRef.current?.width || 0,
        canvasRef.current?.height || 0,
      );
      setCapturedImage(null);
      setCapturedBlob(null);
      onPhotoSaved();
    } finally {
      setSaving(false);
    }
  }

  function retake() {
    setCapturedImage(null);
    setCapturedBlob(null);
  }

  // Guide overlay shape based on angle
  function renderGuideOverlay() {
    if (capturedImage || !cameraReady) return null;
    const angle = selectedAngle;
    return (
      <div className="absolute inset-0 pointer-events-none">
        {/* Face oval guide */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`border-2 border-dashed border-white/40 rounded-full ${
              angle === "front" || angle === "smile"
                ? "w-48 h-64"
                : angle === "left" || angle === "right"
                ? "w-40 h-64 translate-x-4"
                : "w-44 h-64"
            }`}
            style={{
              transform: angle === "left" || angle === "45-left"
                ? "translateX(-12px)"
                : angle === "right" || angle === "45-right"
                ? "translateX(12px)"
                : undefined,
            }}
          />
        </div>
        {/* Crosshairs */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[1px] h-8 bg-white/20" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-[1px] w-8 bg-white/20" />
        </div>
        {/* Direction arrows for non-frontal */}
        {(angle === "left" || angle === "45-left") && (
          <div className="absolute top-1/2 left-4 -translate-y-1/2 text-white/50 text-2xl">←</div>
        )}
        {(angle === "right" || angle === "45-right") && (
          <div className="absolute top-1/2 right-4 -translate-y-1/2 text-white/50 text-2xl">→</div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between p-4 text-white z-10">
        <button onClick={() => { stopCamera(); onClose(); }} className="p-2">
          <X size={24} />
        </button>
        <span className="text-sm font-medium">
          {ANGLES.find(a => a.key === selectedAngle)?.guide}
        </span>
        <button
          onClick={() => setMirrorMode(!mirrorMode)}
          className={`p-2 rounded-lg ${mirrorMode ? "bg-white/20" : ""}`}
        >
          <FlipHorizontal size={20} />
        </button>
      </div>

      {/* Camera / Preview */}
      <div className="flex-1 relative overflow-hidden">
        {capturedImage ? (
          <img
            src={capturedImage}
            alt="Preview"
            className={`w-full h-full object-cover ${mirrorMode ? "scale-x-[-1]" : ""}`}
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${mirrorMode ? "" : "scale-x-[-1]"}`}
            />
            {renderGuideOverlay()}
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Angle selector */}
      {!capturedImage && (
        <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-none">
          {ANGLES.map(a => (
            <button
              key={a.key}
              onClick={() => setSelectedAngle(a.key)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedAngle === a.key
                  ? "bg-white text-black"
                  : "bg-white/20 text-white"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}

      {/* Bottom controls */}
      <div className="p-4 flex justify-center gap-6">
        {capturedImage ? (
          <>
            <button onClick={retake} className="p-4 rounded-full bg-white/20">
              <RotateCcw size={24} className="text-white" />
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="p-4 rounded-full bg-green-500 disabled:opacity-50"
            >
              <Check size={24} className="text-white" />
            </button>
          </>
        ) : (
          <button
            onClick={capture}
            disabled={!cameraReady}
            className="w-16 h-16 rounded-full border-4 border-white bg-white/20 active:bg-white/40 disabled:opacity-30 transition-colors"
          />
        )}
      </div>
    </div>
  );
}
