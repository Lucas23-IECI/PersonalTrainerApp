// =============================================
// Exercise Favorites & Tags (3.12)
// localStorage persistence for favorites/tags
// =============================================

const KEYS = {
  favorites: 'mark-pt-exercise-favorites',
  tags: 'mark-pt-exercise-tags',
} as const;

function loadFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEYS.favorites);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFavorites(favs: string[]) {
  localStorage.setItem(KEYS.favorites, JSON.stringify(favs));
}

function loadTags(): Record<string, string[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(KEYS.tags);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveTags(tags: Record<string, string[]>) {
  localStorage.setItem(KEYS.tags, JSON.stringify(tags));
}

// === Favorites ===

export function getFavorites(): string[] {
  return loadFavorites();
}

export function isFavorite(exerciseName: string): boolean {
  return loadFavorites().includes(exerciseName);
}

export function toggleFavorite(exerciseName: string): boolean {
  const favs = loadFavorites();
  const idx = favs.indexOf(exerciseName);
  if (idx >= 0) {
    favs.splice(idx, 1);
    saveFavorites(favs);
    return false; // removed
  } else {
    favs.push(exerciseName);
    saveFavorites(favs);
    return true; // added
  }
}

// === Tags ===

export function getTagsForExercise(exerciseName: string): string[] {
  return loadTags()[exerciseName] || [];
}

export function getAllTags(): string[] {
  const tagMap = loadTags();
  const allTags = new Set<string>();
  for (const tags of Object.values(tagMap)) {
    for (const t of tags) allTags.add(t);
  }
  return Array.from(allTags).sort();
}

export function addTag(exerciseName: string, tag: string): void {
  const tagMap = loadTags();
  if (!tagMap[exerciseName]) tagMap[exerciseName] = [];
  const normalized = tag.trim().toLowerCase();
  if (normalized && !tagMap[exerciseName].includes(normalized)) {
    tagMap[exerciseName].push(normalized);
    saveTags(tagMap);
  }
}

export function removeTag(exerciseName: string, tag: string): void {
  const tagMap = loadTags();
  if (!tagMap[exerciseName]) return;
  tagMap[exerciseName] = tagMap[exerciseName].filter((t) => t !== tag);
  if (tagMap[exerciseName].length === 0) delete tagMap[exerciseName];
  saveTags(tagMap);
}

export function getExercisesByTag(tag: string): string[] {
  const tagMap = loadTags();
  return Object.entries(tagMap)
    .filter(([, tags]) => tags.includes(tag))
    .map(([name]) => name);
}
