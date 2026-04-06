"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Library,
  Plus,
  FolderOpen,
  FolderPlus,
  Copy,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ArrowLeft,
  Search,
  Dumbbell,
  Calendar,
  Target,
  Edit,
  MoreVertical,
  X,
  FolderInput,
  Share2,
  Download,
  Sparkles,
  ClipboardCopy,
  Check,
} from "lucide-react";
import {
  PROGRAM_LIBRARY,
  getLibraryProgram,
  type LibraryProgram,
} from "@/data/program-library";
import {
  getRoutines,
  getFolders,
  cloneFromLibrary,
  cloneRoutine,
  deleteRoutine,
  createEmptyRoutine,
  createFolder,
  deleteFolder,
  updateFolder,
  moveRoutineToFolder,
  getRoutinesByFolder,
  getRoutinesWithoutFolder,
  exportRoutineCode,
  importRoutineCode,
  type Routine,
  type RoutineFolder,
} from "@/lib/routines-storage";
import { getTopRecommendations, estimateUserLevel } from "@/lib/recommendations";
import { t } from "@/lib/i18n";

// ── Tabs ──
type Tab = "library" | "routines";

// ── Category labels ──
const CATEGORY_KEYS: Record<LibraryProgram["category"], string> = {
  strength: "programs.strength",
  hypertrophy: "programs.hypertrophy",
  powerbuilding: "programs.powerbuilding",
  bodyweight: "programs.bodyweight",
  beginner: "programs.beginner",
  sport: "programs.sport",
  conditioning: "programs.conditioning",
};

const LEVEL_KEYS: Record<LibraryProgram["level"], string> = {
  beginner: "programs.level.beginner",
  intermediate: "programs.level.intermediate",
  advanced: "programs.level.advanced",
};

const LEVEL_COLORS: Record<LibraryProgram["level"], string> = {
  beginner: "#30D158",
  intermediate: "var(--accent)",
  advanced: "#FF453A",
};

export default function RoutinesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("library");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<LibraryProgram["category"] | "all">("all");
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);

  // Routines state
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [folders, setFolders] = useState<RoutineFolder[]>([]);
  const [expandedFolder, setExpandedFolder] = useState<string | "none" | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [moveTarget, setMoveTarget] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [renameFolderId, setRenameFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Import / Export (3.6)
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCode, setImportCode] = useState("");
  const [importError, setImportError] = useState("");
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const reload = useCallback(() => {
    setRoutines(getRoutines());
    setFolders(getFolders());
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // ── Library filtering ──
  const filteredPrograms = PROGRAM_LIBRARY.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
      p.split.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const categories = Array.from(new Set(PROGRAM_LIBRARY.map((p) => p.category)));

  // ── Handlers ──
  function handleCloneFromLibrary(program: LibraryProgram) {
    const routine = cloneFromLibrary(program);
    reload();
    setTab("routines");
    setExpandedFolder("none");
  }

  function handleCreateEmpty() {
    const routine = createEmptyRoutine(t("routines.myRoutines").split(" ").pop() || "Rutina");
    reload();
    router.push(`/routines/editor?id=${routine.id}`);
  }

  function handleCloneRoutine(id: string) {
    cloneRoutine(id);
    setMenuOpen(null);
    reload();
  }

  function handleDeleteRoutine(id: string) {
    deleteRoutine(id);
    setMenuOpen(null);
    reload();
  }

  function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    createFolder(newFolderName.trim());
    setNewFolderName("");
    setShowNewFolder(false);
    reload();
  }

  function handleDeleteFolder(id: string) {
    deleteFolder(id);
    reload();
  }

  function handleRenameFolder(id: string) {
    if (!renameValue.trim()) return;
    updateFolder(id, { name: renameValue.trim() });
    setRenameFolderId(null);
    reload();
  }

  function handleMoveToFolder(routineId: string, folderId: string | undefined) {
    moveRoutineToFolder(routineId, folderId);
    setMoveTarget(null);
    setMenuOpen(null);
    reload();
  }

  // ── Import / Export (3.6) ──
  function handleExport(routineId: string) {
    const code = exportRoutineCode(routineId);
    if (code) {
      setShareCode(code);
      setCopied(false);
    }
    setMenuOpen(null);
  }

  function handleCopyCode() {
    if (!shareCode) return;
    navigator.clipboard.writeText(shareCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleImport() {
    if (!importCode.trim()) return;
    const routine = importRoutineCode(importCode.trim());
    if (routine) {
      setShowImportModal(false);
      setImportCode("");
      setImportError("");
      reload();
      setTab("routines");
    } else {
      setImportError(t("routines.invalidCode"));
    }
  }

  // ── Recommendations (3.7) ──
  const recommendations = typeof window !== "undefined" ? getTopRecommendations(3) : [];

  // ── Renders ──
  function renderProgramCard(p: LibraryProgram) {
    const isOpen = expandedProgram === p.id;
    return (
      <div key={p.id} className="card mb-2">
        <div
          onClick={() => setExpandedProgram(isOpen ? null : p.id)}
          className="flex justify-between items-start cursor-pointer"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[0.55rem] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: LEVEL_COLORS[p.level] }}
              >
                {t(LEVEL_KEYS[p.level])}
              </span>
              <span className="text-[0.55rem] font-semibold uppercase" style={{ color: "var(--text-muted)" }}>
                {t(CATEGORY_KEYS[p.category])}
              </span>
            </div>
            <p className="text-[0.9rem] font-bold text-[var(--text)] mb-0.5">{p.name}</p>
            <p className="text-[0.68rem] leading-tight" style={{ color: "var(--text-muted)" }}>{p.description}</p>
          </div>
          <div className="mt-1" style={{ color: "var(--text-muted)" }}>
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>

        {/* Meta pills */}
        <div className="flex gap-2 mt-2 flex-wrap">
          <span className="text-[0.6rem] px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: "var(--bg-elevated)", color: "var(--text)" }}>
            <Calendar size={10} /> {p.daysPerWeek} {t("routines.daysPerWeek")}
          </span>
          <span className="text-[0.6rem] px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: "var(--bg-elevated)", color: "var(--text)" }}>
            <Target size={10} /> {p.split}
          </span>
          <span className="text-[0.6rem] px-2 py-0.5 rounded-full" style={{ background: "var(--bg-elevated)", color: "var(--text)" }}>
            {p.duration}
          </span>
        </div>

        {/* Tags */}
        {p.tags.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {p.tags.map((tag) => (
              <span key={tag} className="text-[0.55rem] px-1.5 py-0.5 rounded" style={{ color: "var(--text-muted)", background: "rgba(var(--bg-elevated-rgb, 39,39,41), 0.6)" }}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Expanded detail */}
        {isOpen && (
          <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--border)" }}>
            {p.days.map((day, di) => (
              <div key={di} className="mb-3">
                <p className="text-[0.75rem] font-bold text-[var(--accent)] mb-1">{day.name}</p>
                <p className="text-[0.6rem] mb-1" style={{ color: "var(--text-muted)" }}>{day.focus}</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-[0.6rem]">
                    <thead>
                      <tr className="text-left" style={{ color: "var(--text-muted)" }}>
                        <th className="pb-1 font-medium">{t("common.exercise")}</th>
                        <th className="pb-1 font-medium text-center">Sets</th>
                        <th className="pb-1 font-medium text-center">Reps</th>
                        <th className="pb-1 font-medium text-center">RPE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {day.exercises.map((ex, ei) => (
                        <tr key={ei} style={{ color: "var(--text)" }}>
                          <td className="py-0.5">{ex.name}</td>
                          <td className="py-0.5 text-center">{ex.sets}</td>
                          <td className="py-0.5 text-center">{ex.reps}</td>
                          <td className="py-0.5 text-center">{ex.rpe}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            <button
              onClick={(e) => { e.stopPropagation(); handleCloneFromLibrary(p); }}
              className="w-full mt-2 py-2.5 rounded-xl font-bold text-[0.78rem] text-white flex items-center justify-center gap-2"
              style={{ background: "var(--accent)" }}
            >
              <Plus size={16} /> {t("routines.addToMyRoutines")}
            </button>
          </div>
        )}
      </div>
    );
  }

  function renderRoutineCard(r: Routine) {
    return (
      <div key={r.id} className="card mb-2 relative">
        <div className="flex justify-between items-start">
          <div className="flex-1" onClick={() => router.push(`/routines/editor?id=${r.id}`)}>
            <p className="text-[0.85rem] font-bold text-[var(--text)]">{r.name}</p>
            {r.description && (
              <p className="text-[0.65rem] mt-0.5 line-clamp-2" style={{ color: "var(--text-muted)" }}>{r.description}</p>
            )}
            <div className="flex gap-2 mt-1.5">
              <span className="text-[0.58rem] px-2 py-0.5 rounded-full" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
                {r.daysPerWeek} días • {r.days.length} sesiones
              </span>
              {r.split && (
                <span className="text-[0.58rem] px-2 py-0.5 rounded-full" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
                  {r.split}
                </span>
              )}
            </div>
          </div>

          {/* 3-dot menu */}
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === r.id ? null : r.id); }}
            className="p-1 -mr-1"
            style={{ color: "var(--text-muted)" }}
          >
            <MoreVertical size={16} />
          </button>
        </div>

        {/* Dropdown menu */}
        {menuOpen === r.id && (
          <div
            className="absolute right-2 top-10 z-30 rounded-lg py-1 min-w-[160px] shadow-lg"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
          >
            <button
              onClick={() => router.push(`/routines/editor?id=${r.id}`)}
              className="w-full text-left px-3 py-2 text-[0.72rem] text-[var(--text)] flex items-center gap-2 hover:bg-[var(--bg-elevated)]"
            >
              <Edit size={13} /> {t("common.edit")}
            </button>
            <button
              onClick={() => handleCloneRoutine(r.id)}
              className="w-full text-left px-3 py-2 text-[0.72rem] text-[var(--text)] flex items-center gap-2 hover:bg-[var(--bg-elevated)]"
            >
              <Copy size={13} /> {t("common.duplicate")}
            </button>
            <button
              onClick={() => handleExport(r.id)}
              className="w-full text-left px-3 py-2 text-[0.72rem] text-[var(--text)] flex items-center gap-2 hover:bg-[var(--bg-elevated)]"
            >
              <Share2 size={13} /> {t("routines.shareCode")}
            </button>
            <button
              onClick={() => { setMoveTarget(r.id); setMenuOpen(null); }}
              className="w-full text-left px-3 py-2 text-[0.72rem] text-[var(--text)] flex items-center gap-2 hover:bg-[var(--bg-elevated)]"
            >
              <FolderInput size={13} /> {t("routines.moveToFolder")}
            </button>
            <button
              onClick={() => handleDeleteRoutine(r.id)}
              className="w-full text-left px-3 py-2 text-[0.72rem] text-[#FF453A] flex items-center gap-2 hover:bg-[var(--bg-elevated)]"
            >
              <Trash2 size={13} /> {t("common.delete")}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Move to folder modal ──
  const moveModal = moveTarget && (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center" onClick={() => setMoveTarget(null)}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[540px] rounded-t-2xl p-4"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <div className="flex justify-between items-center mb-3">
          <p className="text-[0.85rem] font-bold text-[var(--text)]">{t("routines.moveToFolder")}</p>
          <button onClick={() => setMoveTarget(null)} style={{ color: "var(--text-muted)" }}><X size={18} /></button>
        </div>
        <button
          onClick={() => handleMoveToFolder(moveTarget, undefined)}
          className="w-full text-left px-3 py-2.5 rounded-lg text-[0.75rem] text-[var(--text)] mb-1"
          style={{ background: "var(--bg-elevated)" }}
        >
          {t("routines.noFolder")}
        </button>
        {folders.map((f) => (
          <button
            key={f.id}
            onClick={() => handleMoveToFolder(moveTarget, f.id)}
            className="w-full text-left px-3 py-2.5 rounded-lg text-[0.75rem] mb-1 flex items-center gap-2"
            style={{ background: "var(--bg-elevated)", color: f.color }}
          >
            <FolderOpen size={14} /> {f.name}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <main className="max-w-[540px] mx-auto px-4 pt-4 pb-28" onClick={() => { if (menuOpen) setMenuOpen(null); }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href="/workout" style={{ color: "var(--text-muted)" }}>
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-extrabold tracking-tight">{t("routines.title")}</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-4" style={{ background: "var(--bg-elevated)" }}>
        <button
          onClick={() => setTab("library")}
          className="flex-1 py-2 rounded-lg text-[0.75rem] font-semibold transition-colors"
          style={{
            background: tab === "library" ? "var(--accent)" : "transparent",
            color: tab === "library" ? "#fff" : "var(--text-muted)",
          }}
        >
          <Library size={14} className="inline mr-1" /> {t("routines.library")}
        </button>
        <button
          onClick={() => setTab("routines")}
          className="flex-1 py-2 rounded-lg text-[0.75rem] font-semibold transition-colors"
          style={{
            background: tab === "routines" ? "var(--accent)" : "transparent",
            color: tab === "routines" ? "#fff" : "var(--text-muted)",
          }}
        >
          <Dumbbell size={14} className="inline mr-1" /> {t("routines.myRoutines")}
          {routines.length > 0 && (
            <span className="ml-1 text-[0.6rem] bg-white/20 px-1.5 rounded-full">{routines.length}</span>
          )}
        </button>
      </div>

      {/* ── LIBRARY TAB ── */}
      {tab === "library" && (
        <>
          {/* Recommendations (3.7) */}
          {recommendations.length > 0 && !search && catFilter === "all" && (
            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles size={14} style={{ color: "var(--accent)" }} />
                <span className="text-[0.72rem] font-bold text-[var(--text)]">{t("routines.recommendedForYou")}</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {recommendations.map(({ program, reasons }) => (
                  <div
                    key={program.id}
                    className="shrink-0 w-[200px] rounded-xl p-3 cursor-pointer"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                    onClick={() => { setExpandedProgram(program.id); }}
                  >
                    <span
                      className="text-[0.5rem] font-bold px-1.5 py-0.5 rounded-full text-white"
                      style={{ background: LEVEL_COLORS[program.level] }}
                    >
                      {t(LEVEL_KEYS[program.level])}
                    </span>
                    <p className="text-[0.75rem] font-bold text-[var(--text)] mt-1.5 line-clamp-1">{program.name}</p>
                    <p className="text-[0.58rem] mt-0.5 line-clamp-1" style={{ color: "var(--text-muted)" }}>
                      {program.daysPerWeek} {t("routines.days")} · {program.split}
                    </p>
                    {reasons[0] && (
                      <p className="text-[0.52rem] mt-1" style={{ color: "var(--accent)" }}>
                        {reasons[0]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("routines.searchProgram")}
              className="w-full pl-9 pr-3 py-2 rounded-lg text-[0.75rem] text-[var(--text)] placeholder-[var(--text-secondary)]"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
            />
          </div>

          {/* Category filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
            <button
              onClick={() => setCatFilter("all")}
              className="text-[0.6rem] font-semibold whitespace-nowrap px-3 py-1 rounded-full shrink-0"
              style={{
                background: catFilter === "all" ? "var(--accent)" : "var(--bg-elevated)",
                color: catFilter === "all" ? "#fff" : "var(--text-muted)",
              }}
            >
              {t("routines.allFilter")}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className="text-[0.6rem] font-semibold whitespace-nowrap px-3 py-1 rounded-full shrink-0"
                style={{
                  background: catFilter === cat ? "var(--accent)" : "var(--bg-elevated)",
                  color: catFilter === cat ? "#fff" : "var(--text-muted)",
                }}
              >
                {t(CATEGORY_KEYS[cat])}
              </button>
            ))}
          </div>

          {/* Results count */}
          <p className="text-[0.6rem] mb-2" style={{ color: "var(--text-muted)" }}>{filteredPrograms.length} {t("routines.programs")}</p>

          {/* Program cards */}
          {filteredPrograms.map(renderProgramCard)}

          {filteredPrograms.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[0.8rem]" style={{ color: "var(--text-muted)" }}>{t("routines.noProgramsFound")}</p>
            </div>
          )}
        </>
      )}

      {/* ── MY ROUTINES TAB ── */}
      {tab === "routines" && (
        <>
          {/* Action buttons */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={handleCreateEmpty}
              className="flex-1 py-2.5 rounded-xl font-bold text-[0.72rem] text-white flex items-center justify-center gap-1.5"
              style={{ background: "var(--accent)" }}
            >
              <Plus size={14} /> {t("routines.createRoutine")}
            </button>
            <button
              onClick={() => { setShowImportModal(true); setImportError(""); setImportCode(""); }}
              className="py-2.5 px-4 rounded-xl font-bold text-[0.72rem] flex items-center justify-center gap-1.5"
              style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
            >
              <Download size={14} />
            </button>
            <button
              onClick={() => setShowNewFolder(true)}
              className="py-2.5 px-4 rounded-xl font-bold text-[0.72rem] flex items-center justify-center gap-1.5"
              style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
            >
              <FolderPlus size={14} />
            </button>
          </div>

          {/* New folder inline form */}
          {showNewFolder && (
            <div className="flex gap-2 mb-3">
              <input
                autoFocus
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                placeholder={t("routines.folderNamePlaceholder")}
                className="flex-1 px-3 py-2 rounded-lg text-[0.75rem] text-[var(--text)] placeholder-[var(--text-secondary)]"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
              />
              <button
                onClick={handleCreateFolder}
                className="px-3 py-2 rounded-lg text-[0.72rem] font-bold text-white"
                style={{ background: "var(--accent)" }}
              >
                {t("common.create")}
              </button>
              <button
                onClick={() => { setShowNewFolder(false); setNewFolderName(""); }}
                className="px-2 py-2"
                style={{ color: "var(--text-muted)" }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Folders */}
          {folders.map((folder) => {
            const folderRoutines = routines.filter((r) => r.folderId === folder.id);
            const isOpen = expandedFolder === folder.id;
            return (
              <div key={folder.id} className="mb-3">
                <div
                  className="flex items-center justify-between cursor-pointer py-2 px-1"
                  onClick={() => setExpandedFolder(isOpen ? null : folder.id)}
                >
                  <div className="flex items-center gap-2">
                    <FolderOpen size={16} style={{ color: folder.color }} />
                    {renameFolderId === folder.id ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => handleRenameFolder(folder.id)}
                        onKeyDown={(e) => e.key === "Enter" && handleRenameFolder(folder.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[0.78rem] font-bold px-1 py-0.5 rounded text-[var(--text)]"
                        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                      />
                    ) : (
                      <span className="text-[0.78rem] font-bold" style={{ color: folder.color }}>
                        {folder.name}
                      </span>
                    )}
                    <span className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>{folderRoutines.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {renameFolderId !== folder.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenameFolderId(folder.id);
                          setRenameValue(folder.name);
                        }}
                        className="p-1"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <Edit size={12} />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                      className="p-1"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <Trash2 size={12} />
                    </button>
                    {isOpen ? <ChevronUp size={14} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={14} style={{ color: "var(--text-muted)" }} />}
                  </div>
                </div>
                {isOpen && (
                  <div className="ml-2">
                    {folderRoutines.length === 0 ? (
                      <p className="text-[0.65rem] py-2 pl-4" style={{ color: "var(--text-secondary)" }}>{t("routines.emptyFolder")}</p>
                    ) : (
                      folderRoutines.map(renderRoutineCard)
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Routines without folder */}
          {(() => {
            const unfiled = routines.filter((r) => !r.folderId);
            if (unfiled.length === 0 && folders.length === 0 && routines.length === 0) {
              return (
                <div className="text-center py-12">
                  <Dumbbell size={40} className="mx-auto mb-3" style={{ color: "var(--text-secondary)" }} />
                  <p className="text-[0.82rem] font-semibold mb-1" style={{ color: "var(--text-muted)" }}>{t("routines.noRoutinesYet")}</p>
                  <p className="text-[0.7rem]" style={{ color: "var(--text-secondary)" }}>
                    {t("routines.noRoutinesHint")}
                  </p>
                </div>
              );
            }
            if (unfiled.length > 0) {
              return (
                <div className="mt-2">
                  {folders.length > 0 && (
                    <p className="text-[0.68rem] font-semibold mb-2" style={{ color: "var(--text-muted)" }}>{t("routines.noFolder")}</p>
                  )}
                  {unfiled.map(renderRoutineCard)}
                </div>
              );
            }
            return null;
          })()}
        </>
      )}

      {moveModal}

      {/* ── Import modal (3.6) ── */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center" onClick={() => setShowImportModal(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[540px] rounded-t-2xl p-4"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="flex justify-between items-center mb-3">
              <p className="text-[0.85rem] font-bold text-[var(--text)]">{t("routines.importRoutine")}</p>
              <button onClick={() => setShowImportModal(false)} style={{ color: "var(--text-muted)" }}><X size={18} /></button>
            </div>
            <p className="text-[0.68rem] mb-3" style={{ color: "var(--text-muted)" }}>
              {t("routines.importHint")}
            </p>
            <textarea
              autoFocus
              value={importCode}
              onChange={(e) => { setImportCode(e.target.value); setImportError(""); }}
              placeholder={t("routines.pasteCodePlaceholder")}
              rows={4}
              className="w-full text-[0.72rem] py-2.5 px-3 rounded-lg text-[var(--text)] placeholder-[var(--text-secondary)] resize-none mb-2"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
            />
            {importError && (
              <p className="text-[0.65rem] text-[#FF453A] mb-2">{importError}</p>
            )}
            <button
              onClick={handleImport}
              disabled={!importCode.trim()}
              className="w-full py-2.5 rounded-xl font-bold text-[0.78rem] text-white flex items-center justify-center gap-2"
              style={{ background: importCode.trim() ? "var(--accent)" : "var(--bg-elevated)", opacity: importCode.trim() ? 1 : 0.5 }}
            >
              <Download size={16} /> {t("routines.import")}
            </button>
          </div>
        </div>
      )}

      {/* ── Share code modal (3.6) ── */}
      {shareCode && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center" onClick={() => setShareCode(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[540px] rounded-t-2xl p-4"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="flex justify-between items-center mb-3">
              <p className="text-[0.85rem] font-bold text-[var(--text)]">{t("routines.routineCode")}</p>
              <button onClick={() => setShareCode(null)} style={{ color: "var(--text-muted)" }}><X size={18} /></button>
            </div>
            <p className="text-[0.68rem] mb-3" style={{ color: "var(--text-muted)" }}>
              {t("routines.shareHint")}
            </p>
            <div
              className="p-3 rounded-lg text-[0.6rem] font-mono break-all mb-3 max-h-32 overflow-y-auto"
              style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
            >
              {shareCode}
            </div>
            <button
              onClick={handleCopyCode}
              className="w-full py-2.5 rounded-xl font-bold text-[0.78rem] text-white flex items-center justify-center gap-2"
              style={{ background: copied ? "#34C759" : "var(--accent)" }}
            >
              {copied ? <><Check size={16} /> {t("routines.copied")}</> : <><ClipboardCopy size={16} /> {t("routines.copyCode")}</>}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
