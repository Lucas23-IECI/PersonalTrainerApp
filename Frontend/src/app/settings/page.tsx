"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { PHASES, getCurrentPhase, setPhaseOverride } from "@/data/phases";
import { exportAllData, importAllData, exportCSV, getSettings, saveSettings, getAutoBackupDate, restoreAutoBackup, type WeightUnit, type WorkoutViewMode, type AccentColor, type LayoutDensity } from "@/lib/storage";
import { ChevronLeft, Download, Upload, RotateCcw, Check, AlertTriangle, Sun, Moon, Smartphone, FileSpreadsheet, Weight, Volume2, VolumeX, Globe, Database, Plus, Minus, Bell, BellOff, Clock, LayoutList, GalleryHorizontalEnd, CalendarDays, Activity, GripVertical, Rows3, Rows4, ALargeSmall } from "lucide-react";
import Link from "next/link";
import { APP_VERSION } from "@/lib/version";
import { t } from "@/lib/i18n";
import { ALL_TABS, DEFAULT_TAB_HREFS } from "@/lib/nav-tabs";
import { scheduleDailyReminder, cancelDailyReminder } from "@/lib/native";
import { isGoogleFitConnected, clearGoogleFitAuth, getLastSyncDate } from "@/lib/health-data";
import { getGoogleFitOAuthUrl, disconnectGoogleFit } from "@/lib/google-fit";

import { PageTransition } from "@/components/motion";
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
  const [reminderOn, setReminderOn] = useState(false);
  const [reminderHour, setReminderHour] = useState(18);
  const [reminderMinute, setReminderMinute] = useState(0);
  const [workoutView, setWorkoutView] = useState<WorkoutViewMode>("today");
  const [sleepGoal, setSleepGoal] = useState(8);
  const [gfitConnected, setGfitConnected] = useState(false);
  const [gfitLastSync, setGfitLastSync] = useState<string | null>(null);
  const [accentColor, setAccentColor] = useState<AccentColor>("blue");
  const [customTabs, setCustomTabs] = useState<string[]>(DEFAULT_TAB_HREFS);
  const [layoutDensity, setLayoutDensity] = useState<LayoutDensity>("default");
  const [fontScale, setFontScale] = useState(1);

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
    setReminderOn(s.dailyReminderEnabled);
    setReminderHour(s.reminderHour);
    setReminderMinute(s.reminderMinute);
    setWorkoutView(s.workoutView);
    setSleepGoal(s.sleepGoal);
    setAccentColor(s.accentColor || "blue");
    setCustomTabs(s.customTabs || DEFAULT_TAB_HREFS);
    setLayoutDensity(s.layoutDensity || "default");
    setFontScale(s.fontScale || 1);
    setGfitConnected(isGoogleFitConnected());
    setGfitLastSync(getLastSyncDate());
    // Handle OAuth callback from Google Fit
    if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
      import("@/lib/google-fit").then(({ handleOAuthCallback }) => {
        handleOAuthCallback();
        setGfitConnected(isGoogleFitConnected());
        window.location.hash = "";
      });
    }
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
    <PageTransition>
    <main className="max-w-[540px] mx-auto px-4 pt-5 pb-6">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm mb-4 bg-transparent border-none cursor-pointer p-0" style={{ color: "var(--text-muted)" }}>
        <ChevronLeft size={16} /> {t("common.back")}
      </button>

      <h1 className="text-xl font-black tracking-tight mb-1">{t("settings.title")}</h1>
      <p className="text-[0.7rem] mb-5" style={{ color: "var(--text-muted)" }}>{t("settings.subtitle")}</p>

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
          <span className="text-[0.65rem]" style={{ color: "var(--text-muted)" }}>
            {t("settings.tapToChange")}
          </span>
        </button>
      </div>

      {/* ACCENT COLOR */}
      <div className="card mb-3">
        <div className="text-[0.75rem] font-bold mb-2">{t("settings.accentColor")}</div>
        <div className="flex gap-3 justify-center py-1">
          {([
            { id: "blue" as AccentColor, color: "#4F8CFF", label: "Azul" },
            { id: "green" as AccentColor, color: "#34C759", label: "Verde" },
            { id: "red" as AccentColor, color: "#FF3B30", label: "Rojo" },
            { id: "purple" as AccentColor, color: "#AF52DE", label: "Morado" },
            { id: "orange" as AccentColor, color: "#FF9500", label: "Naranja" },
          ]).map(({ id, color, label }) => (
            <button
              key={id}
              onClick={() => {
                setAccentColor(id);
                saveSettings({ ...getSettings(), accentColor: id });
                if (id === "blue") {
                  document.documentElement.removeAttribute("data-accent");
                } else {
                  document.documentElement.setAttribute("data-accent", id);
                }
              }}
              className="flex flex-col items-center gap-1.5 border-none bg-transparent cursor-pointer p-0"
              title={label}
            >
              <div
                className="w-8 h-8 rounded-full transition-all"
                style={{
                  background: color,
                  boxShadow: accentColor === id ? `0 0 0 3px var(--bg), 0 0 0 5px ${color}` : "none",
                  transform: accentColor === id ? "scale(1.1)" : "scale(1)",
                }}
              />
              <span className="text-[0.55rem] font-semibold" style={{ color: accentColor === id ? color : "var(--text-muted)" }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* LAYOUT DENSITY — 3.8 */}
      <div className="card mb-3">
        <div className="text-[0.75rem] font-bold mb-1">{t("settings.layoutDensity")}</div>
        <p className="text-[0.6rem] mb-3" style={{ color: "var(--text-muted)" }}>{t("settings.layoutDensityDesc")}</p>
        <div className="flex gap-2">
          {([
            { value: "compact" as const, icon: Rows4, label: t("settings.densityCompact") },
            { value: "default" as const, icon: Rows3, label: t("settings.densityDefault") },
            { value: "expanded" as const, icon: LayoutList, label: t("settings.densityExpanded") },
          ]).map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => {
                setLayoutDensity(value);
                saveSettings({ ...getSettings(), layoutDensity: value });
                if (value === "default") {
                  document.documentElement.removeAttribute("data-density");
                } else {
                  document.documentElement.setAttribute("data-density", value);
                }
              }}
              className="flex-1 py-2 rounded-lg text-[0.72rem] font-bold border-none cursor-pointer transition-colors flex flex-col items-center gap-1"
              style={{
                background: layoutDensity === value ? "var(--accent)" : "var(--bg-elevated)",
                color: layoutDensity === value ? "#fff" : "var(--text-muted)",
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* FONT SIZE — 3.9 */}
      <div className="card mb-3">
        <div className="text-[0.75rem] font-bold mb-1 flex items-center gap-2">
          <ALargeSmall size={16} style={{ color: "var(--accent)" }} />
          {t("settings.fontSize")}
        </div>
        <p className="text-[0.6rem] mb-3" style={{ color: "var(--text-muted)" }}>{t("settings.fontSizeDesc")}</p>
        <div className="flex items-center gap-3">
          <span className="text-[0.65rem] font-bold" style={{ color: "var(--text-muted)" }}>{t("settings.fontSizeSmall")}</span>
          <input
            type="range"
            min={0.85}
            max={1.3}
            step={0.05}
            value={fontScale}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              // Round to 2 decimals to avoid float weirdness
              const rounded = Math.round(v * 100) / 100;
              setFontScale(rounded);
              saveSettings({ ...getSettings(), fontScale: rounded });
              if (rounded === 1) {
                document.documentElement.removeAttribute("data-font-scale");
              } else {
                document.documentElement.setAttribute("data-font-scale", String(rounded));
              }
            }}
            className="flex-1"
            style={{ accentColor: "var(--accent)" }}
          />
          <span className="text-[1rem] font-bold" style={{ color: "var(--text-muted)" }}>{t("settings.fontSizeLarge")}</span>
        </div>
        <div className="text-center mt-2">
          <span className="text-[0.7rem] font-bold" style={{ color: "var(--accent)" }}>
            {Math.round(fontScale * 100)}%
          </span>
        </div>
      </div>

      {/* WORKOUT VIEW TOGGLE */}
      <div className="card mb-3">
        <div className="text-[0.75rem] font-bold mb-2">{t("settings.workoutView")}</div>
        <div className="flex gap-2">
          {([
            { value: "today" as const, icon: LayoutList, label: t("settings.viewToday") },
            { value: "carousel" as const, icon: GalleryHorizontalEnd, label: t("settings.viewCarousel") },
            { value: "calendar" as const, icon: CalendarDays, label: t("settings.viewCalendar") },
          ]).map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => {
                setWorkoutView(value);
                saveSettings({ ...getSettings(), workoutView: value });
              }}
              className="flex-1 py-2 rounded-lg text-[0.72rem] font-bold border-none cursor-pointer transition-colors flex flex-col items-center gap-1"
              style={{
                background: workoutView === value ? "var(--accent)" : "var(--bg-elevated)",
                color: workoutView === value ? "#fff" : "var(--text-muted)",
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
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

      {/* SLEEP GOAL */}
      <div className="card mb-3">
        <div className="text-[0.75rem] font-bold mb-2">{t("settings.sleepGoal")}</div>
        <p className="text-[0.65rem] mb-3" style={{ color: "var(--text-muted)" }}>{t("settings.sleepGoalDesc")}</p>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={5}
            max={10}
            step={0.5}
            value={sleepGoal}
            onChange={(e) => {
              const v = Number(e.target.value);
              setSleepGoal(v);
              saveSettings({ ...getSettings(), sleepGoal: v });
            }}
            className="flex-1"
            style={{ accentColor: "#5E5CE6" }}
          />
          <span className="text-lg font-black w-12 text-center" style={{ color: "#5E5CE6" }}>{sleepGoal}h</span>
        </div>
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
        <p className="text-[0.65rem] mb-3" style={{ color: "var(--text-muted)" }}>{t("settings.backupDesc")}</p>
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
        <p className="text-[0.65rem] mb-2" style={{ color: "var(--text-muted)" }}>
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

      {/* GOOGLE FIT */}
      <div className="card mb-3">
        <div className="text-[0.75rem] font-bold mb-2 flex items-center gap-2">
          <Activity size={16} style={{ color: "var(--accent)" }} />
          {t("settings.googleFit")}
        </div>
        <p className="text-[0.65rem] mb-3" style={{ color: "var(--text-muted)" }}>{t("settings.googleFitDesc")}</p>
        {gfitConnected ? (
          <>
            <div className="flex items-center gap-1.5 text-[0.72rem] text-[#34C759] mb-2">
              <Check size={14} /> {t("settings.googleFitConnected")}
            </div>
            {gfitLastSync && (
              <p className="text-[0.6rem] mb-2" style={{ color: "var(--text-muted)" }}>
                {t("health.lastSync")}: {new Date(gfitLastSync).toLocaleString()}
              </p>
            )}
            <button
              onClick={async () => {
                await disconnectGoogleFit();
                setGfitConnected(false);
                setGfitLastSync(null);
              }}
              className="btn btn-ghost w-full text-sm"
              style={{ color: "#FF3B30" }}
            >
              {t("settings.googleFitDisconnect")}
            </button>
          </>
        ) : (
          <button
            onClick={() => {
              const url = getGoogleFitOAuthUrl(
                "",
                window.location.origin + "/settings"
              );
              window.location.href = url;
            }}
            className="btn btn-ghost w-full text-sm"
            style={{ color: "var(--accent)" }}
          >
            <Activity size={14} /> {t("settings.googleFitConnect")}
          </button>
        )}
      </div>

      {/* DAILY REMINDER — 7.15 */}
      <div className="card mb-3">
        <div className="text-[0.75rem] font-bold mb-2">{t("settings.dailyReminder")}</div>
        <p className="text-[0.65rem] mb-3" style={{ color: "var(--text-muted)" }}>{t("settings.dailyReminderDesc")}</p>
        <button
          onClick={async () => {
            const next = !reminderOn;
            setReminderOn(next);
            const s = getSettings();
            saveSettings({ ...s, dailyReminderEnabled: next });
            if (next) {
              await scheduleDailyReminder(reminderHour, reminderMinute);
            } else {
              await cancelDailyReminder();
            }
          }}
          className="btn btn-ghost w-full text-sm justify-between mb-2"
        >
          <span className="flex items-center gap-2">
            {reminderOn ? <Bell size={16} /> : <BellOff size={16} />}
            {t("settings.reminder")}
          </span>
          <span
            className="w-10 h-5 rounded-full relative transition-colors inline-block"
            style={{ background: reminderOn ? "var(--accent-green)" : "var(--bg-elevated)" }}
          >
            <span
              className="w-4 h-4 rounded-full absolute top-0.5 transition-all inline-block"
              style={{
                background: "#fff",
                left: reminderOn ? "calc(100% - 18px)" : "2px",
              }}
            />
          </span>
        </button>
        {reminderOn && (
          <div className="flex items-center gap-2 mt-1">
            <Clock size={14} style={{ color: "var(--text-muted)" }} />
            <select
              value={reminderHour}
              onChange={async (e) => {
                const h = parseInt(e.target.value, 10);
                setReminderHour(h);
                saveSettings({ ...getSettings(), reminderHour: h });
                await scheduleDailyReminder(h, reminderMinute);
              }}
              className="text-sm flex-1"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{String(i).padStart(2, "0")}</option>
              ))}
            </select>
            <span className="text-lg font-bold">:</span>
            <select
              value={reminderMinute}
              onChange={async (e) => {
                const m = parseInt(e.target.value, 10);
                setReminderMinute(m);
                saveSettings({ ...getSettings(), reminderMinute: m });
                await scheduleDailyReminder(reminderHour, m);
              }}
              className="text-sm flex-1"
            >
              {[0, 15, 30, 45].map((m) => (
                <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* PHASE OVERRIDE */}
      <div className="card mb-3">
        <div className="text-[0.75rem] font-bold mb-2">{t("settings.phase")}</div>
        <p className="text-[0.65rem] mb-3" style={{ color: "var(--text-muted)" }}>
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
        <p className="text-[0.65rem] mb-3" style={{ color: "var(--text-muted)" }}>
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
        <p className="text-[0.65rem] mb-3" style={{ color: "var(--text-muted)" }}>
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
        <p className="text-[0.65rem] mb-3" style={{ color: "var(--text-muted)" }}>
          {t("settings.androidDesc")}
        </p>
        <button
          onClick={() => window.open("https://github.com/Lucas23-IECI/PersonalTrainerApp/releases/latest/download/mark-pt.apk", "_system")}
          className="btn btn-primary w-full text-sm flex items-center justify-center gap-2"
        >
          <Smartphone size={14} /> {t("settings.downloadAPK")}
        </button>
      </div>

      {/* CUSTOMIZABLE TABS */}
      <div className="card mb-3">
        <div className="text-[0.75rem] font-bold mb-1">{t("settings.customTabs")}</div>
        <p className="text-[0.6rem] mb-3" style={{ color: "var(--text-muted)" }}>{t("settings.customTabsDesc")}</p>
        <div className="space-y-1.5">
          {ALL_TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = customTabs.includes(tab.href);
            const isHome = tab.href === "/";
            return (
              <button
                key={tab.href}
                disabled={isHome}
                onClick={() => {
                  let next: string[];
                  if (isSelected) {
                    next = customTabs.filter((h) => h !== tab.href);
                  } else {
                    if (customTabs.length >= 6) return;
                    next = [...customTabs, tab.href];
                  }
                  if (next.length < 3) return;
                  setCustomTabs(next);
                  saveSettings({ ...getSettings(), customTabs: next });
                  window.dispatchEvent(new Event("nav-tabs-changed"));
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg border-none cursor-pointer transition-colors"
                style={{
                  background: isSelected ? "var(--accent-soft)" : "var(--bg-elevated)",
                  opacity: isHome ? 0.6 : 1,
                }}
              >
                <Icon size={16} style={{ color: isSelected ? "var(--accent)" : "var(--text-muted)" }} />
                <span className="flex-1 text-left text-[0.72rem] font-semibold" style={{ color: isSelected ? "var(--text)" : "var(--text-muted)" }}>
                  {tab.label}
                </span>
                {isSelected && (
                  <Check size={14} style={{ color: "var(--accent)" }} />
                )}
              </button>
            );
          })}
        </div>
        <p className="text-[0.55rem] mt-2 text-center" style={{ color: "var(--text-muted)" }}>
          {customTabs.length}/6 · {t("settings.customTabsMin")}
        </p>
      </div>

      {/* APP INFO */}
      <div className="card">
        <div className="text-[0.75rem] font-bold mb-2">{t("settings.about")}</div>
        <div className="text-[0.65rem] space-y-1" style={{ color: "var(--text-muted)" }}>
          <div>MARK PT — Personal Trainer</div>
          <div>{t("common.version")}: {APP_VERSION}</div>
          <div>{t("common.localData")}</div>
        </div>
      </div>
    </main>
    </PageTransition>
  );
}
