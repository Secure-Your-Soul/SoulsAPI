'use strict';
import mongoose from 'mongoose';
/**
 * Łączy z bazą danych MongoDB i wykonuje podany callback.
 *
 * @param {string} db
 * Nazwa bazy danych, do której chcesz się połączyć.
 * @param {(mongoose: typeof import('mongoose')) => Promise<void>} callback 
 * Funkcja do wykonania operacji na bazie po połączeniu.
 * @returns {Promise<void>} Zwraca Promise po wykonaniu operacji.
 * @example
 * connectMongo(async (mongoose) => {
 *   const Program = mongoose.connection.collection('Programs')
 *   const programs = await Program.find().toArray()
 *   console.log(programs)
 * })
 */
export default async function connectMongo<T>(db: string, callback: (conn: typeof mongoose.connection) => Promise<T> | T): Promise<T> {
  let result: T;

  try {
    switch (mongoose.connection.readyState) {
      case 0: // disconnected
      case 99: // uninitialized
        await mongoose.connect(`mongodb://localhost:27017/${db}`);
        result = await callback(mongoose.connection);
        break

      case 1: // connected
      case 2: // connecting
      case 3: // disconnecting
        result = await callback(mongoose.connection);
        break

      default:
        throw Error('Nieznany stan połączenia z MongoDB:' + mongoose.connection.readyState);
        break
    }
  } catch (error) {
    console.error('Błąd połączenia z MongoDB:', error);
    throw error
  }

  // Zamykamy połączenie dopiero po zakończeniu callbacka
  switch (mongoose.connection.readyState) {
    case 1: // connected
      try {
        await mongoose.connection.close();
      } catch (closeError) {
        console.error('Błąd przy zamykaniu połączenia z MongoDB:', closeError);
      }
      break;
  }
  return result;
}