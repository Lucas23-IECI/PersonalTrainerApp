"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  Sparkles,
  Trash2,
  Brain,
  Shield,
  TrendingUp,
} from "lucide-react";
import { t } from "@/lib/i18n";
import { PageTransition } from "@/components/motion";
import {
  getCoachResponse,
  getChatHistory,
  saveChatHistory,
  clearChatHistory,
  QUICK_PROMPTS,
  type CoachMessage,
} from "@/lib/coach-chat";
import { getRecoveryDashboard } from "@/lib/muscle-recovery";
import { getWeaknessAnalysis, type WeaknessReport } from "@/lib/weakness-analysis";

export default function CoachPage() {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState("");
  const [recovery, setRecovery] = useState<{ overallPct: number; topTip: string } | null>(null);
  const [weakness, setWeakness] = useState<WeaknessReport | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(getChatHistory());
    setRecovery(getRecoveryDashboard());
    setWeakness(getWeaknessAnalysis());
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage(text: string) {
    if (!text.trim()) return;

    const userMsg: CoachMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: text.trim(),
      timestamp: Date.now(),
    };

    const response = getCoachResponse(text.trim());
    const coachMsg: CoachMessage = {
      id: crypto.randomUUID(),
      role: "coach",
      text: response,
      timestamp: Date.now() + 1,
    };

    const updated = [...messages, userMsg, coachMsg];
    setMessages(updated);
    saveChatHistory(updated);
    setInput("");
  }

  function handleClear() {
    clearChatHistory();
    setMessages([]);
  }

  const recoveryColor = recovery
    ? recovery.overallPct >= 80 ? "#34C759" : recovery.overallPct >= 50 ? "#FF9500" : "#FF3B30"
    : "var(--text-muted)";

  const weaknessColor = weakness
    ? weakness.score >= 80 ? "#34C759" : weakness.score >= 50 ? "#FF9500" : "#FF3B30"
    : "var(--text-muted)";

  return (
    <PageTransition>
      <main className="max-w-[540px] mx-auto px-4 pt-4 pb-24 flex flex-col" style={{ minHeight: "100dvh" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href="/" style={{ color: "var(--accent)" }}>
              <ArrowLeft size={22} />
            </Link>
            <div>
              <h1 className="text-[1.1rem] font-black tracking-tight flex items-center gap-2">
                <Brain size={18} style={{ color: "var(--accent)" }} /> {t("coach.title")}
              </h1>
              <p className="text-[0.55rem]" style={{ color: "var(--text-muted)" }}>
                {t("coach.subtitle")}
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[0.65rem] font-semibold border-none cursor-pointer"
              style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
            >
              <Trash2 size={12} /> {t("common.clear")}
            </button>
          )}
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="card !p-3 flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black"
              style={{ background: recoveryColor }}
            >
              {recovery?.overallPct ?? "—"}
            </div>
            <div>
              <div className="text-[0.5rem] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                {t("coach.recovery")}
              </div>
              <div className="text-[0.7rem] font-bold">
                {recovery ? `${recovery.overallPct}%` : "—"}
              </div>
            </div>
          </div>
          <div className="card !p-3 flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black"
              style={{ background: weaknessColor }}
            >
              {weakness?.score ?? "—"}
            </div>
            <div>
              <div className="text-[0.5rem] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                {t("coach.balance")}
              </div>
              <div className="text-[0.7rem] font-bold">
                {weakness ? `${weakness.score}/100` : "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Weakness Alerts */}
        {weakness && weakness.items.filter((i) => i.severity === "high").length > 0 && (
          <div className="card !p-3 mb-4" style={{ borderLeft: "3px solid #FF3B30" }}>
            <div className="text-[0.6rem] uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
              <Shield size={12} /> {t("coach.alerts")}
            </div>
            {weakness.items.filter((i) => i.severity === "high").slice(0, 3).map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 mb-1.5">
                <span className="text-[0.6rem] mt-0.5">🔴</span>
                <div>
                  <div className="text-[0.7rem] font-bold">{item.title}</div>
                  <div className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>{item.action}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Strengths */}
        {weakness && weakness.strengths.length > 0 && weakness.strengths[0] !== "¡Seguí entrenando para ver tus fortalezas!" && (
          <div className="card !p-3 mb-4" style={{ borderLeft: "3px solid #34C759" }}>
            <div className="text-[0.6rem] uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
              <TrendingUp size={12} /> {t("coach.strengths")}
            </div>
            <div className="text-[0.7rem]" style={{ color: "#34C759" }}>
              {weakness.strengths.map((s, i) => <div key={i}>✅ {s}</div>)}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 flex flex-col gap-2 mb-3">
          {messages.length === 0 && (
            <div className="text-center py-6">
              <Sparkles size={28} className="mx-auto mb-2" style={{ color: "var(--accent)" }} />
              <div className="text-[0.8rem] font-bold mb-1">{t("coach.welcome")}</div>
              <div className="text-[0.65rem]" style={{ color: "var(--text-muted)" }}>
                {t("coach.welcomeHint")}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[0.75rem] leading-relaxed ${
                msg.role === "user" ? "self-end" : "self-start"
              }`}
              style={{
                background: msg.role === "user" ? "var(--accent)" : "var(--bg-elevated)",
                color: msg.role === "user" ? "#fff" : "var(--text)",
                borderBottomRightRadius: msg.role === "user" ? 4 : undefined,
                borderBottomLeftRadius: msg.role === "coach" ? 4 : undefined,
                whiteSpace: "pre-line",
              }}
            >
              {msg.role === "coach" && (
                <div className="flex items-center gap-1 mb-1">
                  <Brain size={10} style={{ color: "var(--accent)" }} />
                  <span className="text-[0.55rem] font-bold" style={{ color: "var(--accent)" }}>Coach</span>
                </div>
              )}
              {msg.text}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Quick Prompts */}
        {messages.length < 4 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {QUICK_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => sendMessage(p.text)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[0.65rem] font-semibold border-none cursor-pointer transition-transform active:scale-95"
                style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
              >
                <span>{p.emoji}</span> {p.text}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div
          className="flex items-center gap-2 rounded-2xl px-3 py-2"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") sendMessage(input); }}
            placeholder={t("coach.placeholder")}
            className="flex-1 bg-transparent border-none outline-none text-[0.8rem]"
            style={{ color: "var(--text)" }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim()}
            className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer"
            style={{
              background: input.trim() ? "var(--accent)" : "var(--bg-card)",
              color: input.trim() ? "#fff" : "var(--text-muted)",
            }}
          >
            <Send size={14} />
          </button>
        </div>
      </main>
    </PageTransition>
  );
}
