"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { PHASES, getCurrentPhase, setPhaseOverride } from "@/data/phases";
import { exportAllData, importAllData } from "@/lib/storage";
import { ChevronLeft, Download, Upload, RotateCcw, Check, AlertTriangle, Sun, Moon } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [currentPhase, setCurrentPhase] = useState(getCurrentPhase());
  const [selectedPhase, setSelectedPhase] = useState(currentPhase.id);
  const [overrideActive, setOverrideActive] = useState(false);
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const override = localStorage.getItem("mark-pt-phase-override");
    setOverrideActive(override !== null);
    setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("mark-pt-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.removeItem("mark-pt-theme");
    }
  }

  function handlePhaseChange(id: number) {
    setSelectedPhase(id);
    setPhaseOverride(id);
    setOverrideActive(true);
    setCurrentPhase(PHASES.find((p) => p.id === id) || PHASES[0]);
  }

  function clearOverride() {
    setPhaseOverride(null);
    setOverrideActive(false);
    const auto = getCurrentPhase();
    setCurrentPhase(auto);
    setSelectedPhase(auto.id);
  }

  function handleExport() {
    const data = exportAllData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mark-pt-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileRef.current?.click();
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const ok = importAllData(text);
      setImportStatus(ok ? "success" : "error");
      setTimeout(() => setImportStatus("idle"), 3000);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <main className="max-w-[540px] mx-auto px-4 pt-5 pb-6">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-zinc-500 mb-4 bg-transparent border-none cursor-pointer p-0">
        <ChevronLeft size={16} /> Volver
      </button>

      <h1 className="text-xl font-black tracking-tight mb-1">Ajustes</h1>
      <p className="text-[0.7rem] text-zinc-500 mb-5">Configuración y datos</p>

      {/* THEME TOGGLE */}
      <div className="card mb-3">
        <div className="text-[0.75rem] font-bold mb-2">Apariencia</div>
        <button
          onClick={toggleTheme}
          className="btn btn-ghost w-full text-sm justify-between"
        >
          <span className="flex items-center gap-2">
            {isDark ? <Moon size={16} /> : <Sun size={16} />}
            {isDark ? "Modo Oscuro" : "Modo Claro"}
          </span>
          <span className="text-[0.65rem] text-zinc-500">
            Toca para cambiar
          </span>
        </button>
      </div>

      {/* PHASE OVERRIDE */}
      <div className="card mb-3">
        <div className="text-[0.75rem] font-bold mb-2">Fase de Entrenamiento</div>
        <p className="text-[0.65rem] text-zinc-500 mb-3">
          Fase actual: <strong style={{ color: "var(--accent)" }}>{currentPhase.name}</strong>
          {overrideActive && <span className="text-[#FF9500] ml-1">(override manual)</span>}
        </p>

        <select
          value={selectedPhase}
          onChange={(e) => handlePhaseChange(parseInt(e.target.value, 10))}
          className="w-full mb-2 text-sm"
        >
          {PHASES.map((p) => (
            <option key={p.id} value={p.id}>
              Fase {p.id}: {p.name} ({p.startDate} → {p.endDate})
            </option>
          ))}
        </select>

        {overrideActive && (
          <button onClick={clearOverride} className="btn btn-ghost w-full text-sm">
            <RotateCcw size={14} /> Volver a detección automática
          </button>
        )}
      </div>

      {/* DATA EXPORT / IMPORT */}
      <div className="card mb-3">
        <div className="text-[0.75rem] font-bold mb-2">Datos</div>
        <p className="text-[0.65rem] text-zinc-500 mb-3">
          Exportá e importá todos tus datos (check-ins, sesiones, nutrición, notas, programas custom).
        </p>

        <div className="flex gap-2 mb-2">
          <button onClick={handleExport} className="btn btn-primary flex-1 text-sm">
            <Download size={14} /> Exportar
          </button>
          <button onClick={handleImportClick} className="btn btn-ghost flex-1 text-sm">
            <Upload size={14} /> Importar
          </button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
        </div>

        {importStatus === "success" && (
          <div className="flex items-center gap-1.5 text-[0.72rem] text-[#34C759]">
            <Check size={14} /> Datos importados correctamente. Recargá la página.
          </div>
        )}
        {importStatus === "error" && (
          <div className="flex items-center gap-1.5 text-[0.72rem] text-[#FF3B30]">
            <AlertTriangle size={14} /> Error al importar. Verificá el archivo.
          </div>
        )}
      </div>

      {/* APP INFO */}
      <div className="card">
        <div className="text-[0.75rem] font-bold mb-2">Acerca de</div>
        <div className="text-[0.65rem] text-zinc-500 space-y-1">
          <div>MARK PT — Personal Trainer</div>
          <div>Versión: 1.0.0</div>
          <div>Datos guardados localmente en tu dispositivo</div>
        </div>
      </div>
    </main>
  );
}
