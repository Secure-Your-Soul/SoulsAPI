'use strict';
import connectMongo from './connectMongo.js';
/**
 * Odczytuje dane z MongoDB jako jeden dokument lub tablica dokumentów.
 * 
 * @param {string} db - Nazwa bazy danych.
 * @param {string} collection - Nazwa kolekcji.
 * @param {Object} query - Zapytanie do kolekcji.
 * @param {boolean} more - true = find(), false = findOne().
 * @param {Object} projection - Usuwa z zapytania np. _id domyślnie { _id: 0 }
 * @returns {Promise<Object|Array>} - Wynik zapytania.
 * 
 * @example
 * // Pobiera wszystkie dokumenty z kolekcji "uzytkownicy" gdzie wiek > 18
 * await readMongo('mojaBaza', 'uzytkownicy', { wiek: { $gt: 18 } }, true)
 * 
 * @example
 * // Pobiera jeden dokument z kolekcji "uzytkownicy" gdzie email = 'x@x.pl'
 * await readMongo('mojaBaza', 'uzytkownicy', { email: 'x@x.pl' }, false)
 */
export default async function readMongo(db: string, collection: string, query: Record<string, any> = {}, more: boolean = false, projection: Record<string, any> = { _id: 0 }): Promise<any[] | Record<string, any> | null> {
  try {
    return await connectMongo(db, async (mongoose) => {
      switch (more) {
        case true:
          return await mongoose.collection(collection).find(query).project(projection).toArray();
        case false:
          return await mongoose.collection(collection).findOne(query, { projection });
      }
    })
  } catch (e: any) {
    console.error('Błąd odczytu z MongoDB:', e);
    throw e;
  }
}