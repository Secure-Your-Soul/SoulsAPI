"use strict";
/**
 * Tworzy plik z aktualną datą i zapisuje logi w /logs/log-12.05.2025.json
 * @function logger
 * @param {string} service_name Nazwa usługi np. "FTP"
 * @param {string} path Służy jako ścieżka do pliku logów
 * @default path = "./Data/logs"
 * @returns {function} Zwraca funkcję log(text)
 * @function log
 * @async
 * @param {string} text Służy jako tekst opisujący coś np. zdarzenie
 * @param {string} level Poziom logu, np. "info", "warn", "error"
 * @param {boolean} inConsole Czy log powinien być wyświetlany w konsoli
 * @default level = "info"
 * @default inConsole = true
 * @example
 * const zmienna = logger("FTP","./Data/logs")
 * zmienna("Wczytano config")
 * zmienna("Zapisano plik")
 * zmienna("Wykonano funkcje xyz")
 */
import fs from "node:fs/promises";
import path_module from "node:path";
export interface LogItem {
  text: any;
  level: "info" | "warn" | "error";
  inConsole: boolean;
  resolve: () => void;
  reject: (err: any) => void;
}
export type LogFunction = (
  text: any,
  level?: "info" | "warn" | "error",
  inConsole?: boolean
) => Promise<void>;
//export type LogFunction = (text: any, level?: 'info' | 'warn' | 'error', inConsole?: boolean) => Promise<void>;
export default function logger(
  service_name: string,
  path: string = "./Data/Logs"
): (
  text: any,
  level?: "info" | "warn" | "error",
  inConsole?: boolean
) => Promise<void> {
  const queue: LogItem[] = [];
  let writing: boolean = false;

  async function processQueue() {
    if (writing || queue.length === 0) return;
    writing = true;
    const item = queue.shift();
    if (!item) {
      writing = false;
      return;
    }
    const { text, level, inConsole, resolve, reject } = item;
    const date = new Date();

    // Zmieniamy rozszerzenie na .log
    const fileName: string = `Log-${date
      .toLocaleDateString()
      .replace(/\//g, "-")}.log`;
    const dirPath: string = path_module.join(
      path || "./Data/Logs",
      service_name
    );
    const logFilePath: string = path_module.join(dirPath, fileName);

    try {
      // Tworzymy folder, jeśli nie istnieje
      await fs.mkdir(dirPath, { recursive: true });

      // Formatujemy linię loga
      const logLine = `[${date.toISOString()}] [${level.toUpperCase()}] ${text}\n`;

      // 'a' oznacza append - dopisuje na końcu bez wczytywania pliku!
      await fs.appendFile(logFilePath, logLine, "utf8");

      if (inConsole) {
        const colors: Record<"info" | "warn" | "error" | "reset", string> = {
          warn: "\x1b[33m",
          error: "\x1b[31m",
          info: "\x1b[32m",
          reset: "\x1b[0m",
        };
        const color: string = colors[level] || colors.info;
        console.log(`${color}[${service_name}]${colors.reset} ${text}`);
      }

      resolve();
    } catch (err: any) {
      console.error(`Błąd loga(${service_name}):`, err);
      reject(err);
    } finally {
      writing = false;
      processQueue();
    }
  }

  return function log(
    text: any,
    level: "info" | "warn" | "error" = "info",
    inConsole: boolean = true
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      queue.push({ text, level, inConsole, resolve, reject });
      processQueue();
    });
  };
}
