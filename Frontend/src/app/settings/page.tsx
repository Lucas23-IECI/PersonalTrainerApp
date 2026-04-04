"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { PHASES, getCurrentPhase, setPhaseOverride } from "@/data/phases";
import { exportAllData, importAllData, exportCSV, getSettings, saveSettings, getAutoBackupDate, restoreAutoBackup, type WeightUnit } from "@/lib/storage";
import { ChevronLeft, Download, Upload, RotateCcw, Check, AlertTriangle, Sun, Moon, Smartphone, FileSpreadsheet, Weight, Volume2, VolumeX, Globe, Database, Plus, Minus } from "lucide-react";
import Link from "next/link";
import { APP_VERSION } from "@/lib/version";
import { t } from "@/lib/i18n";

const WEIGHT_INCREMENTS = [0.5, 1, 1.25, 2.5, 5];

export default function SettingsPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [currentPhase, setCurrentPhase] = useState(getCurrentPhase());
  const [selectedPhase, setSelectedPhase] = useState(currentPhase.id);
  const [overrideActive, setOverrideActive] = useState(false);
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");
  const [isDark, setIsDark] = useState(false);
  const [unit, setUnit] = useState<WeightUnit>("kg");
  const [hapticsOn, setHapticsOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [weightInc, setWeightInc] = useState(2.5);
  const [lang, setLang] = useState<"es" | "en">("es");
  const [autoBackup, setAutoBackup] = useState(true);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [backupRestored, setBackupRestored] = useState(false);

  useEffect(() => {
    const override = localStorage.getItem("mark-pt-phase-override");
    setOverrideActive(override !== null);
    setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
    const s = getSettings();
    setUnit(s.unit);
    setHapticsOn(s.hapticsEnabled);
    setSoundOn(s.soundEnabled);
    setWeightInc(s.weightIncrement);
    setLang(s.language);
    setAutoBackup(s.autoBackup);
    setLastBackup(getAutoBackupDate());
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
        <ChevronLeft size={16} /> {t("common.back")}
      </button>

      <h1 className="text-xl font-black tracking-tight mb-1">{t("settings.title")}</h1>
      <p className="text-[0.7rem] text-zinc-500 mb-5">{t("settings.subtitle")}</p>

      {/* THEME TOGGLE */}
      <div className="card mb-3">
        <div className="text-[0.75rem] font-bold mb-2">{t("settings.appearance")}</div>
        <button
          onClick={toggleTheme}
          className="btn btn-ghost w-full text-sm justify-between"
        >
          <span className="flex items-center gap-2">
            {isDark ? <Moon size={16} /> : <Sun size={16} />}
            {isDark ? t("settings.darkMode") : t("settings.lightMode")}
          </span>
          <span className="text-[0.65rem] text-zinc-500">
            {t("settings.tapToChange")}
          </span>
        </button>
      </div>

      {/* UNIT TOGGLE — 6.6 */}
      <div className="card mb-3">
        <div className="text-[0.75rem] font-bold mb-2">{t("settings.weightUnits")}</div>
        <div className="flex gap-2">
          {(["kg", "lbs"] as const).map((u) => (
            <button
              key={u}
              onClick={() => {
                setUnit(u);
                saveSettings({ ...getSettings(), unit: u });
              }}
              className="flex-1 py-2 rounded-lg text-sm font-bold border-none cursor-pointer transition-colors"
              style={{
                background: unit === u ? "var(--accent)" : "var(--bg-elevated)",
                color: unit === u ? "#fff" : "var(--text-muted)",
              }}
            >
              <Weight size={14} className="inline mr-1" style={{ verticalAlign: "-2px" }} />
              {u.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* HAPTIC & SOUND SETTINGS — 6.8 */}
      <div className="card mb-3">
        <div className="text-[0.75rem] font-bold mb-2">{t("settings.sound")}</div>
        <button
          onClick={() => {
            const next = !hapticsOn;
            setHapticsOn(next);
            saveSettings({ ...getSettings(), hapticsEnabled: next });
          }}
          className="btn btn-ghost w-full text-sm justify-between mb-1.5"
        >
          <span className="flex items-center gap-2">
            {hapticsOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
            {t("settings.vibration")}
          </span>
          <span
            className="w-10 h-5 rounded-full relative transition-colors inline-block"
            style={{ background: hapticsOn ? "var(--accent-green)" : "var(--bg-elevated)" }}
          >
            <span
              className="w-4 h-4 rounded-full absolute top-0.5 transition-all inline-block"
              style={{
                background: "#fff",
                left: hapticsOn ? "calc(100% - 18px)" : "2px",
              }}
            />
          </span>
        </button>
        <button
          onClick={() => {
            const next = !soundOn;
            setSoundOn(next);
            saveSettings({ ...getSettings(), soundEnabled: next });
          }}
          className="btn btn-ghost w-full text-sm justify-between"
        >
          <span className="flex items-center gap-2">
            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
            {t("settings.sounds")}
          </span>
          <span
            className="w-10 h-5 rounded-full relative transition-colors inline-block"
            style={{ background: soundOn ? "var(--accent-green)" : "var(--bg-elevated)" }}
          >
            <span
              className="w-4 h-4 rounded-full absolute top-0.5 transition-all inline-block"
              style={{
                background: "#fff",
                left: soundOn ? "calc(100% - 18px)" : "2px",
              }}
            />
          </span>
        </button>
      </div>

      {/* WEIGHT INCREMENT — 6.10 */}
      <div className="card mb-3">
        <div className="text-[0.75rem] font-bold mb-2">{t("settings.weightIncrement")}</div>
        <div className="flex gap-2 flex-wrap">
          {WEIGHT_INCREMENTS.map((inc) => (
            <button
              key={inc}
              onClick={() => {
                setWeightInc(inc);
                saveSettings({ ...getSettings(), weightIncrement: inc });
              }}
              className="py-2 px-3 rounded-lg text-sm font-bold border-none cursor-pointer transition-colors"
              style={{
                background: weightInc === inc ? "var(--accent)" : "var(--bg-elevated)",
                color: weightInc === inc ? "#fff" : "var(--text-muted)",
              }}
            >
              {inc} {unit}
            </button>
          ))}
        </div>
      </div>

      {/* LANGUAGE — 6.12 */}
      <div className="card mb-3">
        <div className="text-[0.75rem] font-bold mb-2">{t("settings.language")}</div>
        <div className="flex gap-2">
          {(["es", "en"] as const).map((l) => (
            <button
              key={l}
              onClick={() => {
                setLang(l);
                saveSettings({ ...getSettings(), language: l });
              }}
              className="flex-1 py-2 rounded-lg text-sm font-bold border-none cursor-pointer transition-colors"
              style={{
                background: lang === l ? "var(--accent)" : "var(--bg-elevated)",
                color: lang === l ? "#fff" : "var(--text-muted)",
              }}
            >
              <Globe size={14} className="inline mr-1" style={{ verticalAlign: "-2px" }} />
              {l === "es" ? "Español" : "English"}
            </button>
          ))}
        </div>
      </div>

      {/* AUTO BACKUP — 6.11 */}
      <div className="card mb-3">
        <div className="text-[0.75rem] font-bold mb-2">{t("settings.backup")}</div>
        <p className="text-[0.65rem] text-zinc-500 mb-3">{t("settings.backupDesc")}</p>
        <button
          onClick={() => {
            const next = !autoBackup;
            setAutoBackup(next);
            saveSettings({ ...getSettings(), autoBackup: next });
          }}
          className="btn btn-ghost w-full text-sm justify-between mb-2"
        >
          <span className="flex items-center gap-2">
            <Database size={16} />
            {t("settings.backup")}
          </span>
          <span
            className="w-10 h-5 rounded-full relative transition-colors inline-block"
            style={{ background: autoBackup ? "var(--accent-green)" : "var(--bg-elevated)" }}
          >
            <span
              className="w-4 h-4 rounded-full absolute top-0.5 transition-all inline-block"
              style={{
                background: "#fff",
                left: autoBackup ? "calc(100% - 18px)" : "2px",
              }}
            />
          </span>
        </button>
        <p className="text-[0.65rem] text-zinc-500 mb-2">
          {t("settings.lastBackup")}: {lastBackup || t("settings.noBackup")}
        </p>
        <button
          onClick={() => {
            const ok = restoreAutoBackup();
            if (ok) setBackupRestored(true);
          }}
          className="btn btn-ghost w-full text-sm"
          disabled={!lastBackup}
        >
          <RotateCcw size={14} /> {t("settings.restoreBackup")}
        </button>
        {backupRestored && (
          <div className="flex items-center gap-1.5 text-[0.72rem] text-[#34C759] mt-2">
            <Check size={14} /> {t("settings.backupRestored")}
          </div>
        )}
      </div>

      {/* PHASE OVERRIDE */}
      <div className="card mb-3">
        <div className="text-[0.75rem] font-bold mb-2">{t("settings.phase")}</div>
        <p className="text-[0.65rem] text-zinc-500 mb-3">
          {t("settings.currentPhase")}: <strong style={{ color: "var(--accent)" }}>{currentPhase.name}</strong>
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
            <RotateCcw size={14} /> {t("settings.autoDetect")}
          </button>
        )}
      </div>

      {/* DATA EXPORT / IMPORT */}
      <div className="card mb-3">
        <div className="text-[0.75rem] font-bold mb-2">{t("settings.data")}</div>
        <p className="text-[0.65rem] text-zinc-500 mb-3">
          {t("settings.dataDesc")}
        </p>

        <div className="flex gap-2 mb-2">
          <button onClick={handleExport} className="btn btn-primary flex-1 text-sm">
            <Download size={14} /> {t("settings.export")}
          </button>
          <button onClick={handleImportClick} className="btn btn-ghost flex-1 text-sm">
            <Upload size={14} /> {t("settings.import")}
          </button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
        </div>

        {importStatus === "success" && (
          <div className="flex items-center gap-1.5 text-[0.72rem] text-[#34C759]">
            <Check size={14} /> {t("settings.importSuccess")}
          </div>
        )}
        {importStatus === "error" && (
          <div className="flex items-center gap-1.5 text-[0.72rem] text-[#FF3B30]">
            <AlertTriangle size={14} /> {t("settings.importError")}
          </div>
        )}
      </div>

      {/* DOWNLOAD APP */}
      <div className="card mb-3">
        <div className="text-[0.75rem] font-bold mb-2">{t("settings.exportCSV")}</div>
        <p className="text-[0.65rem] text-zinc-500 mb-3">
          {t("settings.csvDesc")}
        </p>
        <button onClick={() => {
          const csv = exportCSV();
          const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `mark-pt-sessions-${new Date().toISOString().split("T")[0]}.csv`;
          a.click();
          URL.revokeObjectURL(url);
        }} className="btn btn-ghost w-full text-sm">
          <FileSpreadsheet size={14} /> {t("settings.exportCSV")}
        </button>
      </div>

      {/* DOWNLOAD APP */}
      <div className="card mb-3">
        <div className="text-[0.75rem] font-bold mb-2">{t("settings.androidApp")}</div>
        <p className="text-[0.65rem] text-zinc-500 mb-3">
          Descargá la app nativa para tu celular Android.
        </p>
        <Link
          href="/descargar"
          className="btn btn-primary w-full text-sm no-underline flex items-center justify-center gap-2"
        >
          <Smartphone size={14} /> {t("settings.downloadAPK")}
        </Link>
      </div>

      {/* APP INFO */}
      <div className="card">
        <div className="text-[0.75rem] font-bold mb-2">{t("settings.about")}</div>
        <div className="text-[0.65rem] text-zinc-500 space-y-1">
          <div>MARK PT — Personal Trainer</div>
          <div>{t("common.version")}: {APP_VERSION}</div>
          <div>{t("common.localData")}</div>
        </div>
      </div>
    </main>
  );
}
