"use client";

import { useEffect } from "react";
import { runAutoBackup } from "@/lib/storage";

export default function AutoBackup() {
  useEffect(() => {
    runAutoBackup();
  }, []);
  return null;
}
