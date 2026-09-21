// ====== getIp.js (POPRZEPISANY NA CJS) ======

// Krok 1: Wymagaj biblioteki synchronicznie na początku pliku
// Node.js automatycznie cachuje moduł, więc ta operacja wykonuje się tylko raz.
import geoip from 'geoip-lite';

// Krok 2: Usuwamy zmienną globalną __geoip, która była potrzebna 
// tylko do asynchronicznego importu, oraz usuwamy async/await z funkcji.

/**
 * Zwraca informacje geograficzne dla podanego adresu IP.
 * @param {string} ip - Adres IP.
 * @returns {object | null} Obiekt geolokalizacyjny lub null w przypadku błędu.
 */
export default function getIp(ip: string): geoip.Lookup | null {
    // Nie potrzebujemy try/catch do łapania błędu importu, 
    // ponieważ geoip jest już załadowany.
    try {
        // Używamy załadowanego modułu synchronicznie
        return geoip.lookup(ip) || null;
    } catch (e: any) {
        // catch jest tu tylko na wypadek błędów wykonania lookup
        console.error("Błąd podczas wyszukiwania IP w geoip-lite:", e.message);
        return null; 
    }
}