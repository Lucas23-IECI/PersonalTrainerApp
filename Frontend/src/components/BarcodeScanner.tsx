"use client";

import { useState, useRef } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import { lookupBarcode, type FoodItem } from "@/lib/openfoodfacts";
import { t } from "@/lib/i18n";

interface Props {
  open: boolean;
  onClose: () => void;
  onFound: (food: FoodItem) => void;
}

export default function BarcodeScanner({ open, onClose, onFound }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleLookup() {
    const clean = code.replace(/\D/g, "");
    if (!clean) return;
    setLoading(true);
    setError("");
    const food = await lookupBarcode(clean);
    setLoading(false);
    if (food) {
      onFound(food);
      setCode("");
      onClose();
    } else {
      setError(t("barcode.notFound"));
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-[90%] max-w-[400px] rounded-2xl p-5"
        style={{ background: "var(--bg-card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Camera size={18} style={{ color: "var(--accent)" }} />
            <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{t("barcode.scanTitle")}</span>
          </div>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer p-1" style={{ color: "var(--text-muted)" }}>
            <X size={18} />
          </button>
        </div>

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
          onKeyDown={(e) => e.key === "Enter" && handleLookup()}
          className="w-full mb-3 text-sm rounded-lg py-2.5 px-3 border"
          style={{ background: "var(--bg-elevated)", color: "var(--text)", borderColor: "var(--border)" }}
        />

        {error && (
          <p className="text-[0.7rem] mb-2" style={{ color: "#FF3B30" }}>{error}</p>
        )}

        <button
          onClick={handleLookup}
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
    </div>
  );
}
