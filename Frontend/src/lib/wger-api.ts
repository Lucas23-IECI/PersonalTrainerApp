// =============================================
// wger.de Exercise Images API (3.14)
// Fetches exercise images with localStorage cache
// =============================================

const CACHE_KEY = 'mark-pt-wger-images';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

interface WgerCacheEntry {
  url: string;
  ts: number;
}

interface WgerCache {
  [exerciseName: string]: WgerCacheEntry;
}

function loadCache(): WgerCache {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCache(cache: WgerCache) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

// Mapping of common exercise names to wger exercise IDs
const WGER_EXERCISE_MAP: Record<string, number> = {
  'bench press': 192,
  'barbell bench press': 192,
  'incline bench press': 210,
  'incline barbell bench press': 210,
  'decline bench press': 211,
  'dumbbell bench press': 97,
  'dumbbell fly': 145,
  'cable fly': 146,
  'push-up': 182,
  'squat': 111,
  'barbell squat': 111,
  'front squat': 191,
  'leg press': 113,
  'leg extension': 110,
  'leg curl': 155,
  'romanian deadlift': 116,
  'deadlift': 105,
  'barbell deadlift': 105,
  'sumo deadlift': 405,
  'barbell row': 106,
  'bent over row': 106,
  'dumbbell row': 362,
  'lat pulldown': 122,
  'pull-up': 107,
  'chin-up': 181,
  'seated cable row': 108,
  't-bar row': 186,
  'overhead press': 119,
  'military press': 119,
  'barbell overhead press': 119,
  'dumbbell shoulder press': 123,
  'lateral raise': 148,
  'dumbbell lateral raise': 148,
  'front raise': 149,
  'rear delt fly': 150,
  'face pull': 274,
  'barbell curl': 74,
  'dumbbell curl': 81,
  'hammer curl': 82,
  'preacher curl': 83,
  'tricep pushdown': 89,
  'cable tricep pushdown': 89,
  'skull crusher': 386,
  'overhead tricep extension': 92,
  'dip': 82,
  'calf raise': 104,
  'standing calf raise': 104,
  'hip thrust': 413,
  'barbell hip thrust': 413,
  'plank': 238,
  'crunch': 91,
  'hanging leg raise': 127,
  'cable crunch': 93,
  'shrug': 151,
  'barbell shrug': 151,
};

function normalizeExerciseName(name: string): string {
  return name.toLowerCase().trim();
}

function findWgerId(exerciseName: string): number | null {
  const normalized = normalizeExerciseName(exerciseName);
  if (WGER_EXERCISE_MAP[normalized]) return WGER_EXERCISE_MAP[normalized];
  
  // Try partial match
  for (const [key, id] of Object.entries(WGER_EXERCISE_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) return id;
  }
  return null;
}

/**
 * Get exercise image URL from wger.de API with caching.
 * Returns null if no image found or API fails.
 */
export async function getExerciseImage(exerciseName: string): Promise<string | null> {
  const cache = loadCache();
  const cached = cache[exerciseName];
  
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.url || null;
  }

  const wgerId = findWgerId(exerciseName);
  if (!wgerId) return null;

  try {
    const res = await fetch(
      `https://wger.de/api/v2/exerciseimage/?exercise_base=${wgerId}&is_main=True&format=json`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;

    const data = await res.json();
    const imageUrl: string = data.results?.[0]?.image || '';

    // Cache even empty results to avoid repeated failed requests
    cache[exerciseName] = { url: imageUrl, ts: Date.now() };
    saveCache(cache);

    return imageUrl || null;
  } catch {
    return null;
  }
}

/**
 * Check if an exercise likely has a wger image available (sync check).
 */
export function hasWgerMapping(exerciseName: string): boolean {
  return findWgerId(exerciseName) !== null;
}
