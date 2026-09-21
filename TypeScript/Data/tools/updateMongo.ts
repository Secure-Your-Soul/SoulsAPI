'use strict';
/**
 * Łączy z MongoDB i aktualizuje dane, z opcją wstawienia nowych dokumentów, jeśli nie istnieją (upsert).
 *
 * @param {string} db - Nazwa bazy danych, do której chcesz się połączyć.
 * @param {string} collection - Nazwa kolekcji, na której chcesz wykonać operację.
 * @param {Object|Array} query - Obiekt zapytania do MongoDB. Dla updateOne: obiekt; dla updateMany: tablica.
 * @param {Object} updateData - Dane do aktualizacji.
 * @param {boolean} [more=false] - Flaga: false dla updateOne, true dla updateMany. Ustawia upsert, gdy jest true.
 * @param {boolean} [upsert=false] - Określa, czy operacja ma wstawiać nowe dokumenty, jeśli nie istnieją.
 * @returns {Promise<any>} Zwraca Promise, która rozwiązuje się na wynik operacji (modifiedCount).
 *
 * @example
 * updateMongo('SecureStore', 'Programs', { name: 'Old Program' }, { name: 'New Program' }, false, true)
 *   .then(count => console.log(count))  // Wynik operacji aktualizacji
 *   .catch(error => console.error(error))
 */
import connectMongo from './connectMongo.js';
import type { Connection } from 'mongoose';

type Query = Record<string, any> | Record<string, any>[];

export default async function updateMongo(
  db: string,
  collection: string,
  query: Query = {},
  updateData: Record<string, any> = {},
  more = false,
  upsert = false
): Promise<number> {
  try {
    return await connectMongo(db, async (mongoose: Connection) => {
      const col = mongoose.collection(collection);

      if (!more) {
        if (Array.isArray(query)) {
          throw new Error('Dla updateOne query musi być obiektem.');
        }

        const res = await col.updateOne(
          query,
          { $set: updateData },
          { upsert }
        );
        return res.modifiedCount;
      }

      if (!Array.isArray(query)) {
        throw new Error('Dla updateMany query musi być tablicą.');
      }

      const res = await col.updateMany(
        query,
        { $set: updateData },
        { upsert }
      );
      return res.modifiedCount;
    });
  } catch (error) {
    console.error('Błąd MongoDB:', error);
    throw error;
  }
}
