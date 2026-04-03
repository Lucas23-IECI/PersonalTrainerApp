import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../data");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function filePath(name: string) {
  return path.join(DATA_DIR, `${name}.json`);
}

export function loadCollection<T>(name: string): T[] {
  const fp = filePath(name);
  if (!fs.existsSync(fp)) return [];
  return JSON.parse(fs.readFileSync(fp, "utf-8"));
}

export function saveCollection<T>(name: string, data: T[]) {
  fs.writeFileSync(filePath(name), JSON.stringify(data, null, 2));
}
