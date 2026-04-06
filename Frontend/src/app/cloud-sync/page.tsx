"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Cloud, CloudUpload, CloudDownload, Check, AlertTriangle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { exportAllData, importAllData } from "@/lib/storage";

import { PageTransition } from "@/components/motion";
import { t } from "@/lib/i18n";
/*
  7.13 — Cloud Sync
  Since this is a static export (no server), we use client-side file-based sync:
  - Export: serializes all localStorage data to a JSON blob and saves it as a downloaded file
    (user can manually upload to Google Drive / cloud storage).
  - Import: reads JSON from a file the user picks (from Drive, Files, etc).
  - On native (Capacitor), the share sheet allows saving to Drive directly.
  
  Additionally, we provide auto-sync to IndexedDB as a more reliable
  local backup that survives cache clears.
*/

const CLOUD_BACKUP_KEY = "mark-pt-cloud-backup";
const CLOUD_BACKUP_DATE_KEY = "mark-pt-cloud-backup-date";

function saveToIndexedDB(data: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) { resolve(); return; }
    const req = indexedDB.open("markpt-cloud", 1);
    req.onupgradeneeded = () => { req.result.createObjectStore("backups"); };
    req.onsuccess = () => {
      const tx = req.result.transaction("backups", "readwrite");
      tx.objectStore("backups").put(data, "latest");
      tx.objectStore("backups").put(new Date().toISOString(), "date");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  });
}

function loadFromIndexedDB(): Promise<{ data: string; date: string } | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.indexedDB) { resolve(null); return; }
    const req = indexedDB.open("markpt-cloud", 1);
    req.onupgradeneeded = () => { req.result.createObjectStore("backups"); };
    req.onsuccess = () => {
      const tx = req.result.transaction("backups", "readonly");
      const store = tx.objectStore("backups");
      const dataReq = store.get("latest");
      const dateReq = store.get("date");
      tx.oncomplete = () => {
        if (dataReq.result) {
          resolve({ data: dataReq.result, date: dateReq.result || "" });
        } else {
          resolve(null);
        }
      };
      tx.onerror = () => resolve(null);
    };
    req.onerror = () => resolve(null);
  });
}

export default function CloudSyncPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "uploading" | "downloading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [idbDate, setIdbDate] = useState<string | null>(null);

  useEffect(() => {
    setLastSync(localStorage.getItem(CLOUD_BACKUP_DATE_KEY));
    loadFromIndexedDB().then((res) => {
      if (res) setIdbDate(res.date);
    });
  }, []);

  async function handleCloudUpload() {
    setStatus("uploading");
    try {
      const jsonData = exportAllData();
      // Save to IndexedDB as redundant backup
      await saveToIndexedDB(jsonData);

      // Download as file (user can upload to Google Drive / any cloud)
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mark-pt-cloud-sync-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      // Also try native share if available
      if (typeof navigator !== "undefined" && navigator.share && navigator.canShare?.({ files: [new File([blob], "mark-pt-backup.json")] })) {
        try {
          await navigator.share({
            title: "MARK PT Backup",
            files: [new File([blob], `mark-pt-cloud-sync-${new Date().toISOString().split("T")[0]}.json`, { type: "application/json" })],
          });
        } catch {
          // User cancelled share — file still downloaded
        }
      }

      const dateStr = new Date().toLocaleString();
      localStorage.setItem(CLOUD_BACKUP_DATE_KEY, dateStr);
      setLastSync(dateStr);
      setIdbDate(new Date().toISOString());
      setStatus("success");
      setMessage(t("cloudSync.savedOk"));
    } catch {
      setStatus("error");
      setMessage(t("cloudSync.saveError"));
    }
  }

  function handleCloudDownload() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setStatus("downloading");
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        const ok = importAllData(text);
        if (ok) {
          setStatus("success");
          setMessage(t("cloudSync.restoredOk"));
        } else {
          setStatus("error");
          setMessage(t("cloudSync.invalidFile"));
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  async function handleRestoreIDB() {
    setStatus("downloading");
    try {
      const res = await loadFromIndexedDB();
      if (!res) {
        setStatus("error");
        setMessage(t("cloudSync.noBackup"));
        return;
      }
      const ok = importAllData(res.data);
      if (ok) {
        setStatus("success");
        setMessage(t("cloudSync.restoredIdb"));
      } else {
        setStatus("error");
        setMessage(t("cloudSync.corruptBackup"));
      }
    } catch {
      setStatus("error");
      setMessage(t("cloudSync.restoreError"));
    }
  }

  return (
    <PageTransition>
    <main className="max-w-[540px] mx-auto px-4 pt-5 pb-6">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm mb-4 bg-transparent border-none cursor-pointer p-0" style={{ color: "var(--text-muted)" }}>
        <ChevronLeft size={16} /> {t("common.back")}
      </button>

      <h1 className="text-xl font-black tracking-tight mb-1">{t("cloudSync.title")}</h1>
      <p className="text-[0.65rem] mb-5" style={{ color: "var(--text-muted)" }}>
        {t("cloudSync.description")}
      </p>

      {/* Status */}
      {status !== "idle" && status !== "uploading" && status !== "downloading" && (
        <div className={`card mb-3 flex items-center gap-2 ${status === "success" ? "text-[#34C759]" : "text-[#FF3B30]"}`}>
          {status === "success" ? <Check size={16} /> : <AlertTriangle size={16} />}
          <span className="text-sm font-semibold">{message}</span>
        </div>
      )}

      {/* Upload to Cloud */}
      <div className="card mb-3">
        <div className="flex items-center gap-2 mb-2">
          <CloudUpload size={18} style={{ color: "var(--accent)" }} />
          <div className="text-[0.75rem] font-bold">{t("cloudSync.saveBackup")}</div>
        </div>
        <p className="text-[0.6rem] mb-3" style={{ color: "var(--text-muted)" }}>
          {t("cloudSync.exportDesc")}
        </p>
        <button
          onClick={handleCloudUpload}
          disabled={status === "uploading"}
          className="w-full py-3 rounded-xl border-none cursor-pointer text-white font-bold text-sm disabled:opacity-50"
          style={{ background: "var(--accent)" }}
        >
          {status === "uploading" ? (
            <><RefreshCw size={14} className="inline mr-1 animate-spin" /> {t("cloudSync.saving")}</>
          ) : (
            <><Cloud size={14} className="inline mr-1" /> {t("cloudSync.uploadCloud")}</>
          )}
        </button>
        {lastSync && (
          <p className="text-[0.6rem] mt-2" style={{ color: "var(--text-muted)" }}>{t("cloudSync.lastSync")} {lastSync}</p>
        )}
      </div>

      {/* Download from Cloud */}
      <div className="card mb-3">
        <div className="flex items-center gap-2 mb-2">
          <CloudDownload size={18} style={{ color: "#34C759" }} />
          <div className="text-[0.75rem] font-bold">{t("cloudSync.restoreBackup")}</div>
        </div>
        <p className="text-[0.6rem] mb-3" style={{ color: "var(--text-muted)" }}>
          {t("cloudSync.selectDesc")}
        </p>
        <button
          onClick={handleCloudDownload}
          disabled={status === "downloading"}
          className="w-full py-3 rounded-xl border-none cursor-pointer font-bold text-sm"
          style={{ background: "var(--bg-elevated)", color: "var(--accent)" }}
        >
          {status === "downloading" ? (
            <><RefreshCw size={14} className="inline mr-1 animate-spin" /> {t("cloudSync.restoring")}</>
          ) : (
            <><CloudDownload size={14} className="inline mr-1" /> {t("cloudSync.selectFile")}</>
          )}
        </button>
      </div>

      {/* IndexedDB Backup */}
      <div className="card mb-3">
        <div className="flex items-center gap-2 mb-2">
          <RefreshCw size={18} style={{ color: "#AF52DE" }} />
          <div className="text-[0.75rem] font-bold">{t("cloudSync.localBackup")}</div>
        </div>
        <p className="text-[0.6rem] mb-3" style={{ color: "var(--text-muted)" }}>
          {t("cloudSync.indexeddbDesc")}
        </p>
        {idbDate && (
          <p className="text-[0.6rem] mb-2" style={{ color: "var(--text-muted)" }}>
          {t("cloudSync.idbLast")} {new Date(idbDate).toLocaleString()}
        </p>
        )}
        <button
          onClick={handleRestoreIDB}
          disabled={!idbDate}
          className="w-full py-2.5 rounded-xl border-none cursor-pointer font-bold text-[0.75rem] disabled:opacity-40"
          style={{ background: "var(--bg-elevated)", color: "#AF52DE" }}
        >
          {t("cloudSync.restoreIndexedDB")}
        </button>
      </div>

      {/* Info */}
      <div className="card">
        <div className="text-[0.75rem] font-bold mb-2">{t("cloudSync.howItWorks")}</div>
        <div className="text-[0.65rem] space-y-1.5" style={{ color: "var(--text-muted)" }}>
          <p>1. {t("cloudSync.step1")}</p>
          <p>2. {t("cloudSync.step2")}</p>
          <p>3. {t("cloudSync.step3")}</p>
          <p>4. {t("cloudSync.step4")}</p>
        </div>
      </div>
    </main>
    </PageTransition>
  );
}
