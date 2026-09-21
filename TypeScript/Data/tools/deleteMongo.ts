'use strict';

import type { Connection } from "mongoose";

import connectMongo from './connectMongo.js';
/**
 * Łączy z MongoDB i usuwa dane.
 *
 * @param {string} db - Nazwa bazy danych, do której chcesz się połączyć.
 * @param {string} collection - Nazwa kolekcji, na której chcesz wykonać operację.
 * @param {Object|Array} query - Obiekt zapytania do MongoDB. Dla deleteOne: obiekt; dla deleteMany: tablica.
 * @param {boolean} [more=false] - Flaga: false dla deleteOne, true dla deleteMany.
 * @returns {Promise<any>} Zwraca Promise, która rozwiązuje się na wynik operacji (deletedCount).
 *
 * @example
 * deleteMongo('SecureStore', 'Programs', { name: 'Old Program' }, false)
 *   .then(count => console.log(count))  // Wynik operacji usuwania
 *   .catch(error => console.error(error))
 */
export default async function deleteMongo(db: string, collection: string, query = {}, more: boolean = false) {
  try {
    await connectMongo(db, async (connection: Connection) => {
      switch (more) {
        case false:
          switch (Array.isArray(query)) {
            case true:
              throw new Error('Dla deleteOne, query musi być obiektem, a nie tablicą.');
            case false:
              return (await connection.collection(collection).deleteOne(query)).deletedCount;
          }
        case true:
          switch (Array.isArray(query)) {
            case false:
              throw new Error('Dla deleteMany, query musi być tablicą.');
            case true:
              return (await connection.collection(collection).deleteMany(query)).deletedCount;
          }
      }
    })
  } catch (error) {
    console.error('Błąd podczas łączenia z MongoDB:', error);
    throw error;
  }
}