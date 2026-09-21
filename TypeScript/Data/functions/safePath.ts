import path from "node:path";

export default async function safePath(
  base: string,
  rel: string | null | undefined
): Promise<string | null> {
  // 1. Wstępna walidacja - rel musi być stringiem
  if (!base || typeof rel !== "string") {
    return null;
  }

  try {
    // 2. Normalizacja bazy (absolutna ścieżka)
    const absoluteBase = path.resolve(base);

    // 3. Czyszczenie relatywnej ścieżki
    // Najpierw split, potem replace na pewnym stringu
    const urlWithoutQuery = rel.split(/[?#]/)[0] ?? "";
    const cleanRel = urlWithoutQuery.replace(/^\/+/, "");

    // 4. Tworzenie kandydata
    // path.join bezpiecznie łączy segmenty, a path.resolve robi z nich pełną ścieżkę
    const candidate = path.resolve(absoluteBase, cleanRel);

    // 5. Normalizacja dla porównania (system-specific)
    const isWindows = process.platform === "win32";

    // Normalizujemy ukośniki i wielkość liter (dla Windows)
    const normBase = isWindows ? absoluteBase.toLowerCase() : absoluteBase;
    const normCandidate = isWindows ? candidate.toLowerCase() : candidate;

    // 6. Kluczowy test: Czy kandydat jest wewnątrz bazy?
    // Dodajemy separator na końcu, aby "/www" nie pasowało do "/www-data"
    const safeBase = normBase.endsWith(path.sep)
      ? normBase
      : normBase + path.sep;

    // Sprawdzamy czy ścieżka zaczyna się od bazy LUB jest identyczna z bazą (główny folder)
    if (normCandidate.startsWith(safeBase) || normCandidate === normBase) {
      return candidate;
    }

    console.warn(`[Security Alert] Path Traversal attempt: ${candidate}`);
    return null;
  } catch (err) {
    return null;
  }
}
