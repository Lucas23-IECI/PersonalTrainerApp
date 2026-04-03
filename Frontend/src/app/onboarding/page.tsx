"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveProfile } from "@/lib/storage";
import { profileDefaults } from "@/data/profile";
import { Dumbbell } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function handleEnter() {
    const n = name.trim();
    if (n.length < 2) { setError("Ingresá tu nombre"); return; }

    const isLucas = n.toLowerCase().includes("lucas") && n.toLowerCase().includes("méndez") ||
                    n.toLowerCase().includes("lucas") && n.toLowerCase().includes("mendez");

    if (isLucas) {
      saveProfile(profileDefaults);
      localStorage.setItem("mark-pt-experience", "intermediate");
      localStorage.setItem("mark-pt-goal", "recomp");
      localStorage.setItem("mark-pt-days-per-week", "5");
    } else {
      saveProfile({ ...profileDefaults, name: n });
    }

    localStorage.setItem("mark-pt-onboarding-done", "true");
    router.push("/");
  }

  return (
    <main className="max-w-[420px] mx-auto px-5 min-h-screen flex flex-col items-center justify-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: "var(--accent)", color: "#fff" }}>
        <Dumbbell size={32} />
      </div>
      <h1 className="text-2xl font-black mb-1 text-center">MARK PT</h1>
      <p className="text-sm text-zinc-500 mb-8 text-center">Tu entrenador personal</p>

      <div className="w-full mb-4">
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleEnter()}
          placeholder="Tu nombre completo"
          className="w-full text-center text-lg py-3.5 px-4 rounded-xl"
          style={{ background: "var(--bg-card)" }}
          autoFocus
        />
        {error && <p className="text-xs text-red-500 text-center mt-1.5">{error}</p>}
      </div>

      <button
        onClick={handleEnter}
        disabled={name.trim().length < 2}
        className="btn w-full py-3.5 text-base font-bold text-white border-none cursor-pointer rounded-xl"
        style={{ background: name.trim().length >= 2 ? "linear-gradient(135deg, #34C759, #30D158)" : "var(--bg-elevated)", color: name.trim().length >= 2 ? "#fff" : "var(--text-muted)" }}
      >
        Entrar
      </button>
    </main>
  );
}
