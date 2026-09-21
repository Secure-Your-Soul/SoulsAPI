// ====== Typy ======
type MessagePayload = any;
type MessageHandler = (payload?: MessagePayload) => void;

interface IPCMessage {
  id: number;
  type: string;
  name?: string;
  data?: any;
  secret?: any;
  pid?: number;
}
// ====== Zmienne Globalne dla Modułu IPC ======
let IPC_SECRETS = new Map<number, any>();
let AUTH_DONE: boolean = false;
let rid: number = 0;
const messages = new Map<number, MessageHandler>();

// NOWE ZMIENNE:
// initPromise: Przechowuje Promise, który jest aktywowany, gdy trwa inicjalizacja autoryzacji.
// Pozwala innym oczekiwać na jej zakończenie bez blokowania wątku (jak do...while).
let initPromise: Promise<void> | null = null;

// ====== Funkcja Inicjalizacyjna ======

/**
 * Inicjuje połączenie IPC, wysyłając żądanie 'auth' do procesu macierzystego.
 * Jeśli inicjalizacja już trwa, zwraca istniejącą obietnicę.
 * @returns {Promise<any>} Promise, który rozwiązuje się po autoryzacji.
 */
async function ipcInit(): Promise<any> {
  // Jeśli inicjalizacja już trwa, zwróć istniejącą obietnicę, aby unikać wyścigu
  if (initPromise) return initPromise;

  // Utwórz nową obietnicę inicjalizacji
  initPromise = new Promise<void>((resolve, reject) => {
    const id = ++rid;

    const timer = setTimeout(() => {
      messages.delete(id);
      // Resetujemy stan po timeout
      initPromise = null;
      reject(new Error("IPC auth timeout"));
    }, 5000);

    messages.set(id, (payload: MessagePayload) => {
      clearTimeout(timer);
      // Resetujemy stan po sukcesie
      initPromise = null;
      resolve(payload);
    });

    try {
      // Wysłanie żądania autoryzacji
      process.send?.({ id, type: "auth", name: process.argv[2], secret: {} });
    } catch (e: any) {
      clearTimeout(timer);
      messages.delete(id);
      // Resetujemy stan po błędzie
      initPromise = null;
      reject(new Error(e as any));
    }
  });

  // Zwróć Promise, aby proces wywołujący mógł na niego czekać
  return initPromise;
}

// ====== Bezpieczny Listener (Odbieranie Wiadomości) ======

/* 🔒 Bezpieczny listener - rozwiązuje Promise oczekujące w messages */
process.on("message", (msg: IPCMessage) => {
  try {
    // Podstawowa weryfikacja
    if (!msg || typeof msg !== "object" || !msg?.id || !msg?.type) return;

    /* 🔐 AUTH – tylko raz */
    if (msg.type === "auth") {
      // Walidacja autoryzacji (tylko Parent PID)
      if (
        AUTH_DONE ||
        IPC_SECRETS.get(process.ppid) ||
        !msg?.pid ||
        msg.pid !== process.ppid
      )
        return;

      IPC_SECRETS.set(process.ppid, msg.secret);
      AUTH_DONE = true;
      Object.freeze(IPC_SECRETS);
      Object.freeze(AUTH_DONE);

      // Rozwiązujemy Promise z ipcInit, jeśli istnieje
      if (messages.has(msg.id)) {
        messages.get(msg.id)!();
        messages.delete(msg.id);
      }
      return;
    }

    /* ❌ Bez auth – brak dostępu do innych requestów */
    if (!AUTH_DONE || msg.secret !== IPC_SECRETS.get(process.ppid)) return;

    /* ✅ Response */
    if (msg.type === "response" && messages.has(msg.id)) {
      messages.get(msg.id)!(msg.data);
      messages.delete(msg.id);
    }
  } catch {
    /* ❌ cicho – żadnych crashy */
  }
});

// ====== Główna Funkcja Żądania IPC ======

/**
 * Wysyła żądanie do procesu macierzystego i oczekuje na odpowiedź.
 * Zarządza inicjalizacją autoryzacji.
 * @param {string} type - Typ żądania (np. 'getConfig').
 * @param {object} [data={}] - Dane do przesłania.
 * @param {number} [timeout=5000] - Timeout oczekiwania na odpowiedź.
 * @returns {Promise<any>} Dane zwrócone przez proces macierzysty.
 */
export default async function ipcRequest(
  type: string,
  data: Record<string, string> = {},
  timeout: number = 5000
): Promise<any> {
  // 🛑 KRYTYCZNY KROK 1: CZEKANIE NA ZAKOŃCZENIE INNEJ INICJALIZACJI
  if (initPromise) {
    // Oczekujemy asynchronicznie, aż inna trwająca inicjalizacja się zakończy (resolve lub reject).
    // NIE blokuje głównego wątku serwera.
    await initPromise.catch((e) => {
      // Jeśli inicjalizacja, na którą czekaliśmy, się nie powiodła,
      // rzucamy błąd i wychodzimy.
      console.error(`Oczekiwanie na IPC Init nie powiodło się: ${e.message}`);
      throw e;
    });
  }

  // 🛑 KROK 2: INICJALIZACJA, JEŚLI JESZCZE NIE JESTEŚMY ZALOGOWANI
  // Musi być sprawdzone po potencjalnym oczekiwaniu na initPromise.
  if (!AUTH_DONE) {
    try {
      await ipcInit();
    } catch (e: any) {
      throw new Error(`IPC initialization failed: ${e.message}`);
    }
  }

  if (!AUTH_DONE)
    throw new Error(`IPC not authenticated after initialization attempt.`);

  // 🛑 KROK 3: WYSYŁKA WŁAŚCIWEGO ŻĄDANIA
  return new Promise((resolve, reject) => {
    const id = ++rid;

    const timer = setTimeout(() => {
      messages.delete(id);
      reject(new Error(`IPC timeout: ${type}`));
    }, timeout);

    messages.set(id, (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });

    try {
      process.send?.({
        id,
        type,
        name: process.argv[2],
        data,
        secret: IPC_SECRETS.get(process.ppid),
      });
    } catch (e) {
      clearTimeout(timer);
      messages.delete(id);
      reject(e);
    }
  });
}
