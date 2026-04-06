"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, Shield, ArrowLeft, RefreshCw, CheckCircle } from "lucide-react";
import Link from "next/link";
import { APP_VERSION, checkForUpdate } from "@/lib/version";
import { t } from "@/lib/i18n";

import { PageTransition } from "@/components/motion";
const APK_URL =
  "https://github.com/Lucas23-IECI/PersonalTrainerApp/releases/latest/download/mark-pt.apk";

export default function DescargarPage() {
  const [updateInfo, setUpdateInfo] = useState<{
    checked: boolean;
    hasUpdate: boolean;
    downloadUrl: string;
    latestVersion: string;
  }>({ checked: false, hasUpdate: false, downloadUrl: "", latestVersion: "" });
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    handleCheckUpdate();
  }, []);

  function handleCheckUpdate() {
    setChecking(true);
    checkForUpdate()
      .then((result) => {
        setUpdateInfo({
          checked: true,
          hasUpdate: result.hasUpdate,
          downloadUrl: result.downloadUrl,
          latestVersion: result.latestVersion,
        });
      })
      .catch(() => {
        setUpdateInfo({ checked: true, hasUpdate: false, downloadUrl: "", latestVersion: "" });
      })
      .finally(() => setChecking(false));
  }

  function handleDownload(url?: string) {
    window.open(url || APK_URL, "_system");
  }

  return (
    <PageTransition>
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: "var(--bg)" }}
    >
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-1 text-sm no-underline"
        style={{ color: "var(--text-secondary)" }}
      >
        <ArrowLeft size={16} />
        {t("download.back")}
      </Link>

      {/* Icon */}
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: "var(--accent)", boxShadow: "0 8px 32px rgba(44,107,237,0.3)" }}
      >
        <Smartphone size={40} color="#fff" />
      </div>

      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>
        {t("download.androidTitle")}
      </h1>
      <p className="text-center mb-1 max-w-sm" style={{ color: "var(--text-secondary)" }}>
        {t("download.description")}
      </p>
      <p className="text-xs mb-6" style={{ color: "var(--text-muted)" }}>
        {t("download.installedVersion")}<span className="font-semibold" style={{ color: "var(--accent)" }}>v{APP_VERSION}</span>
      </p>

      {/* Update banner */}
      {updateInfo.checked && updateInfo.hasUpdate && (
        <div
          className="max-w-sm w-full rounded-2xl p-4 mb-5 flex items-center gap-3"
          style={{ background: "rgba(48,209,88,0.12)", border: "1px solid rgba(48,209,88,0.3)" }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(48,209,88,0.2)" }}>
            <RefreshCw size={20} style={{ color: "#30D158" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[0.85rem] font-bold" style={{ color: "#30D158" }}>
              {t("download.newVersionAvailable")}
            </div>
            <div className="text-[0.7rem]" style={{ color: "var(--text-muted)" }}>
              v{updateInfo.latestVersion}
            </div>
          </div>
          <button
            onClick={() => handleDownload(updateInfo.downloadUrl)}
            className="text-[0.78rem] font-bold px-4 py-2 rounded-xl border-none cursor-pointer shrink-0 transition-transform active:scale-95"
            style={{ background: "#30D158", color: "#fff" }}
          >
            {t("download.updateBtn")}
          </button>
        </div>
      )}

      {updateInfo.checked && !updateInfo.hasUpdate && (
        <div
          className="max-w-sm w-full rounded-2xl p-3 mb-5 flex items-center gap-3"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <CheckCircle size={18} style={{ color: "#30D158" }} />
          <span className="text-[0.78rem]" style={{ color: "var(--text-secondary)" }}>
            {t("download.upToDate")}
          </span>
          <button
            onClick={handleCheckUpdate}
            disabled={checking}
            className="ml-auto text-[0.68rem] font-semibold bg-transparent border-none cursor-pointer p-0"
            style={{ color: "var(--accent)", opacity: checking ? 0.5 : 1 }}
          >
            {checking ? t("download.checking") : t("download.check")}
          </button>
        </div>
      )}

      {!updateInfo.checked && (
        <div
          className="max-w-sm w-full rounded-2xl p-3 mb-5 flex items-center justify-center gap-2"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <RefreshCw size={14} className="animate-spin" style={{ color: "var(--text-muted)" }} />
          <span className="text-[0.75rem]" style={{ color: "var(--text-muted)" }}>
            {t("download.checkingForUpdates")}
          </span>
        </div>
      )}

      {/* Download button */}
      <button
        onClick={() => handleDownload(updateInfo.hasUpdate ? updateInfo.downloadUrl : undefined)}
        className="flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-semibold no-underline transition-transform active:scale-95 border-none cursor-pointer"
        style={{
          background: updateInfo.hasUpdate ? "#30D158" : "var(--accent)",
          color: "#fff",
          boxShadow: updateInfo.hasUpdate
            ? "0 4px 20px rgba(48,209,88,0.35)"
            : "0 4px 20px rgba(44,107,237,0.35)",
        }}
      >
        <Download size={24} />
        {updateInfo.hasUpdate ? t("download.downloadUpdate") : t("download.downloadAPK")}
      </button>

      <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
        ~5 MB &middot; Android 7.0+
      </p>

      {/* Instructions */}
      <div className="card mt-10 max-w-sm w-full" style={{ background: "var(--bg-card)" }}>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>
          {updateInfo.hasUpdate ? t("download.howToUpdate") : t("download.howToInstall")}
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          <li>Tocá &quot;{updateInfo.hasUpdate ? t("download.downloadUpdate") : t("download.downloadAPK")}&quot;</li>
          <li>{t("download.openFile")}</li>
          {updateInfo.hasUpdate ? (
            <li>{t("download.installOverPrevious")}</li>
          ) : (
            <li>
              {t("download.enableUnknownSources")}
            </li>
          )}
          <li>{t("download.tapInstallDone")}</li>
        </ol>
      </div>

      <div className="flex items-center gap-2 mt-6" style={{ color: "var(--text-muted)" }}>
        <Shield size={14} />
        <span className="text-xs">{t("download.autoChecks")}</span>
      </div>
    </div>
    </PageTransition>
  );
}
