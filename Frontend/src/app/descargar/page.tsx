"use client";

import { Download, Smartphone, Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";

const APK_URL =
  "https://github.com/Lucas23-IECI/PersonalTrainerApp/releases/latest/download/mark-pt.apk";

export default function DescargarPage() {
  return (
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
        Volver
      </Link>

      {/* Icon */}
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: "var(--accent)", boxShadow: "0 8px 32px rgba(44,107,237,0.3)" }}
      >
        <Smartphone size={40} color="#fff" />
      </div>

      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>
        MARK PT para Android
      </h1>
      <p className="text-center mb-8 max-w-sm" style={{ color: "var(--text-secondary)" }}>
        Descargá la app nativa e instalala directamente en tu celular.
      </p>

      {/* Download button */}
      <a
        href={APK_URL}
        className="flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-semibold no-underline transition-transform active:scale-95"
        style={{
          background: "var(--accent)",
          color: "#fff",
          boxShadow: "0 4px 20px rgba(44,107,237,0.35)",
        }}
      >
        <Download size={24} />
        Descargar APK
      </a>

      <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
        ~5 MB &middot; Android 7.0+
      </p>

      {/* Instructions */}
      <div className="card mt-10 max-w-sm w-full" style={{ background: "var(--bg-card)" }}>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>
          Cómo instalar
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          <li>Tocá &quot;Descargar APK&quot;</li>
          <li>Abrí el archivo descargado</li>
          <li>
            Si te pide permiso, habilitá &quot;Instalar apps de fuentes
            desconocidas&quot;
          </li>
          <li>Tocá &quot;Instalar&quot; y listo</li>
        </ol>
      </div>

      <div className="flex items-center gap-2 mt-6" style={{ color: "var(--text-muted)" }}>
        <Shield size={14} />
        <span className="text-xs">Se actualiza con cada versión nueva</span>
      </div>
    </div>
  );
}
