/**
 * SoulFS - Zaawansowany system zarządzania plikami dla projektu "Secure Your Soul"
 * Wspiera: YAML z komentarzami, JSON, Binaria (EXE/JAR), Batch Write i Streams.
 */

import fs from 'node:fs/promises';
import { createWriteStream, createReadStream } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import https from 'node:https';
import type { IncomingMessage, ServerResponse } from 'node:http';

type AutoWriteOptions = { append?: boolean; encoding?: BufferEncoding };
type SendOptions = { baseDir?: string; authToken?: string };
type LoggerFunction = ((msg: string) => void) | boolean;
// Limit wielkości pliku dla operacji w pamięci RAM (2MB)
const MEMORY_LIMIT: number = 2 * 1024 * 1024;

/**
 * GŁÓWNA FUNKCJA ZAPISU (BATCH & SINGLE)
 * @param {string|string[]|Object} target - Ścieżka, tablica ścieżek lub obiekt {ścieżka: dane}
 * @param {any} [data=null] - Dane do zapisu (jeśli nie używamy obiektu w pierwszym parametrze)
 * @param {Object} [options={}] - Opcje: { append: boolean, encoding: string }
 */
export async function autoWrite(target: string | string[] | Record<string, any>, data: any = null, options: AutoWriteOptions  = {}) {
    // Obsługa obiektu: { "sciezka/plik.txt": "dane" }
    if (typeof target === 'object' && !Array.isArray(target) && data === null) {
        return Promise.all(
            Object.entries(target as Record<string, unknown>).map(([filePath, fileData]: [string, unknown]) => 
                _performWrite(filePath, fileData, options)
            )
        );
    }

    // Obsługa tablicy ścieżek: ["p1.txt", "p2.txt"] -> te same dane do wszystkich
    if (Array.isArray(target)) {
        return Promise.all(
            target.map(filePath => _performWrite(filePath, data, options))
        );
    }

    // Standardowy pojedynczy zapis
    return _performWrite(target as string, data, options);
}

/**
 * Wewnętrzny silnik zapisu - obsługuje logikę formatów i strumieni
 * @private
 */
async function _performWrite(filePath: string, data: any, options: AutoWriteOptions) {
    const { encoding = 'utf-8', append = false } = options;
    
    // Tworzenie struktury folderów "w locie"
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    const ext = path.extname(filePath).toLowerCase();
    const isBinary = Buffer.isBuffer(data) || data instanceof Uint8Array;
    let output;

    // 1. Logika formatowania danych
    if (isBinary) {
        output = data;
    } else if (ext === '.yaml' || ext === '.yml') {
        output = await _processYaml(filePath, data, encoding);
    } else if (ext === '.json') {
        output = JSON.stringify(data, null, 2) + '\n';
    } else {
        // Dla .txt i innych: rzutowanie na string + ewentualna nowa linia dla logów
        output = String(data) + (append ? '\n' : '');
    }

    // 2. Wybór metody zapisu (małe pliki vs duże strumienie)
    const size = isBinary ? output.length : Buffer.byteLength(output);
    const flag = append ? 'a' : 'w';

    if (size <= MEMORY_LIMIT) {
        return fs.writeFile(filePath, output, { flag, encoding });
    } else {
        return new Promise((resolve, reject) => {
            const stream = createWriteStream(filePath, { flags: flag });
            stream.end(output);
            stream.on('finish', resolve);
            stream.on('error', (err) => reject(`[SoulFS] WriteStream Error: ${err.message}`));
        });
    }
}

/**
 * Przetwarza YAML tak, aby zachować istniejące komentarze (Smart Merge)
 * @private
 */
async function _processYaml(filePath: string, data: any, encoding: BufferEncoding): Promise<string> {
    try {
        const raw = await fs.readFile(filePath, { encoding }).catch(() => '');
        const doc = YAML.parseDocument(raw);
        
        if (doc.contents === null || typeof data !== 'object') {
            return YAML.stringify(data);
        }

        // Aktualizacja kluczy bez usuwania komentarzy
        Object.keys(data).forEach(key => doc.set(key, data[key]));
        return doc.toString();
    } catch {
        // W razie błędu składni w pliku, nadpisz czystym YAMLem
        return YAML.stringify(data);
    }
}

/**
 * INTELIGENTNY ODCZYT PLIKÓW
 * @param {string} filePath - Ścieżka do pliku
 * @returns {Promise<any>} - Sparsowane dane lub Stream dla dużych plików binarnych
 */
export async function autoRead(filePath: string, encoding: BufferEncoding = 'utf-8') {
    try {
        const stats = await fs.stat(filePath);
        const ext = path.extname(filePath).toLowerCase();

        // Ochrona przed zapchaniem RAMu przez duże pliki binarne
        if (stats.size > MEMORY_LIMIT && (ext === '.exe' || ext === '.zip' || ext === '.jar')) {
            console.warn(`[SoulFS] Duży plik binarny (${filePath}) - zwracam Stream.`);
            return createReadStream(filePath);
        }

        const data = await fs.readFile(filePath, encoding);
        
        // Automatyczne parsowanie zależnie od rozszerzenia
        if (ext === '.json') {
            try { return JSON.parse(data); } 
            catch { 
                // Obsługa formatu NDJSON (logi linia po linii)
                return data.trim().split('\n').filter(l => l).map(line => JSON.parse(line));
            }
        }
        if (ext === '.yaml' || ext === '.yml') return YAML.parse(data);
        
        return data;
    } catch (err: any) {
        if (err.code === 'ENOENT') return null; // Plik nie istnieje - zwróć null zamiast błędu
        throw new Error(`[SoulFS] Read Error: ${err.message}`);
    }
}

/**
 * Inteligentne pobieranie z obsługą wznawiania (Resume) i dużych plików.
 * @param {string} url - Link do pliku
 * @param {string} dest - Ścieżka zapisu
 */
export async function download(url: string, dest: string): Promise<void> {
    await fs.mkdir(path.dirname(dest), { recursive: true });

    // 1. Sprawdź, czy plik już częściowo istnieje
    let existingSize = 0;
    try {
        const stats = await fs.stat(dest);
        existingSize = stats.size;
    } catch (e) {
        existingSize = 0;
    }

    return new Promise((resolve, reject) => {
        const options: { headers: Record<string, string> } = {
            headers: {}
        };

        // 2. Jeśli mamy już jakieś dane, poproś o resztę (HTTP Range)
        if (existingSize > 0) {
            options.headers['Range'] = `bytes=${existingSize}-`;
            console.log(`[SoulFS] Wznawiam pobieranie od: ${(existingSize / 1024 / 1024).toFixed(2)} MB`);
        }

        https.get(url, options, (res) => {
            // Status 200 = nowy plik, 206 = kontynuacja (Partial Content)
            if (res.statusCode !== 200 && res.statusCode !== 206) {
                if (res.statusCode === 416) {
                    console.log("[SoulFS] Plik jest już pobrany w całości.");
                    return resolve();
                }
                return reject(new Error(`Błąd HTTP: ${res.statusCode}`));
            }

            // 'a' flag jest kluczowa - dopisuje do pliku zamiast go czyścić
            const fileStream = createWriteStream(dest, { flags: 'a' });
            
            res.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close();
                resolve();
            });

            res.on('error', (err) => {
                fileStream.close();
                reject(err);
            });
        }).on('error', reject);
    });
}

/**
 * Wysyła plik z obsługą wznawiania i zabezpieczeniem przed wyjściem poza folder (Path Traversal).
 * @param {string} filePath - Ścieżka do pliku
 * @param {Object} req - Request
 * @param {Object} res - Response
 * @param {Object} options - { baseDir: string, authToken: string }
 */
export async function send(filePath: string, req: IncomingMessage, res: ServerResponse, options: SendOptions = {}): Promise<void>  {
    const { baseDir = "./", authToken = null } = options;

    // 1. Zabezpieczenie: Autoryzacja
    if (authToken && req.headers['authorization'] !== authToken) {
        res.writeHead(401);
        res.end("Unauthorized");
        return;
    }

    try {
        // 2. Zabezpieczenie: Path Traversal Protection
        const safePath = path.resolve(filePath);
        const rootPath = path.resolve(baseDir);

        if (!safePath.startsWith(rootPath)) {
            res.writeHead(403);
            res.end("Unauthorized");
            return;
        }

        const stats = await fs.stat(safePath);
        const range = req.headers['range'] as string | undefined;

        // Nagłówki wspólne dla obu trybów
        const commonHeaders = {
            'Accept-Ranges': 'bytes',
            'Content-Type': 'application/octet-stream'
        };

        if (!range) {
            res.writeHead(200, { 
                ...commonHeaders, 
                'Content-Length': stats.size 
            });
            return void createReadStream(safePath).pipe(res);
        }

        if (!range) return;
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0] ?? "", 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;

        if (start >= stats.size || end >= stats.size) {
            res.writeHead(416, { 'Content-Range': `bytes */${stats.size}` });
            res.end();
            return;
        }

        const chunkSize = (end - start) + 1;
        
        res.writeHead(206, {
            ...commonHeaders,
            'Content-Range': `bytes ${start}-${end}/${stats.size}`,
            'Content-Length': chunkSize,
        });

        const stream = createReadStream(safePath, { start, end });
        stream.pipe(res);

        stream.on('error', (err) => {
            console.error(`[SoulFS] Send Stream Error: ${err.message}`);
            res.end();
        });

    } catch (err) {
        res.writeHead(404);
        res.end("File not found");
        return;
    }
}

/**
 * Aktywne monitorowanie zasobu (Resource Polling).
 * Wstrzymuje wykonanie do momentu, aż wskazany plik pojawi się w systemie i zostanie poprawnie sparsowany.
 * * @param {string} filePath - Ścieżka do monitorowanego pliku (relatywna lub absolutna).
 * @param {Function|boolean} [log=false] - Opcjonalna funkcja loggera (np. api.logger). Jeśli true, używa console.log.
 * @returns {Promise<Object|string|Buffer>} - Zwraca zawartość pliku (Object dla JSON/YAML, String/Buffer dla reszty).
 */
export async function watchFile(filePath: string, log: LoggerFunction = false): Promise<any> {
    // Rozpoczynamy nieskończoną pętlę oczekiwania na zasób (Resource Polling)
    while (true) {
        try {
            // Próba inteligentnego odczytu za pomocą SoulFS (obsługuje JSON/YAML/txt)
            const data = await autoRead(filePath);

            /**
             * WARUNEK SUKCESU:
             * Sprawdzamy, czy dane istnieją (nie są null/undefined).
             * Opcjonalnie: Możesz tu dodać sprawdzenie Object.keys(data).length > 0
             * aby upewnić się, że plik konfiguracyjny nie jest pustym obiektem {}.
             */
            if (data !== null) {
                // Przypisanie danych do globalnej referencji CONFIG
                // Uwaga: CONFIG musi być dostępny w zasięgu tej funkcji (np. zadeklarowany globalnie)
                if (log) if (typeof log === 'function') log(`[SoulFS] ✅ Załadowano: (${filePath})`);
                    else console.log(`[SoulFS] ✅ Załadowano: (${filePath})`);
                
                return data;
                break; 
            }

            if (log) if (typeof log === 'function') log(`[SoulFS] ⏳ Oczekiwanie na plik: ${filePath}...`);
                else console.log(`[SoulFS] ⏳ Oczekiwanie na plik: ${filePath}...`);

        } catch (err: any) {
            // Obsługa nieprzewidzianych błędów systemowych (np. brak uprawnień)
            if (log) if (typeof log === 'function') log(`[SoulFS] ❌ Błąd krytyczny podczas monitorowania ${filePath}:` + err.message);
                else console.log(`[SoulFS] ❌ Błąd krytyczny podczas monitorowania ${filePath}:`, err.message);
        }

        /**
         * INTERWAŁ PONOWIENIA:
         * Czekamy 2000ms przed kolejną próbą, aby nie blokować pętli zdarzeń Node.js
         * i nie obciążać procesora ciągłymi próbami I/O (Exponential backoff nie jest tu 
         * wymagany, stały interwał 2s jest optymalny dla plików lokalnych).
         */
        await new Promise(r => setTimeout(r, 2000));
    }
}
import AdmZip from 'adm-zip';

/**
 * Rozpakowuje archiwum ZIP do wskazanego folderu.
 * @param {string} source - Ścieżka do pliku ZIP
 * @param {string} targetDir - Folder docelowy
 * @param {boolean} overwrite - Czy nadpisać istniejące pliki (domyślnie true)
 */
export async function extract(source: string, targetDir: string, overwrite: boolean = true): Promise<void> {
    try {
        await fs.mkdir(targetDir, { recursive: true });
        const zip = new AdmZip(source);
        
        // Wykonujemy to asynchronicznie, aby nie blokować głównego wątku
        return new Promise((resolve, reject) => {
            zip.extractAllToAsync(targetDir, overwrite, false, (error) => {
                if (error) reject(error);
                else resolve();
            });
        });
    } catch (err: any) {
        throw new Error(`[SoulFS] Extraction Error: ${err.message}`);
    }
}