'use strict';
import connectMongo from './connectMongo.js';
/**
 * Łączy z bazą danych MongoDB i zapisuje dane.
 *
 * @param {string} db - Nazwa bazy danych, do której chcesz się połączyć.
 * @param {string} collection - Nazwa kolekcji, na której chcesz wykonać operację.
 * @param {Object|Array} query - Obiekt zapytania do MongoDB. Może to być pojedynczy obiekt (dla insertOne) lub tablica obiektów (dla insertMany).
 * @param {boolean} [more=false] - Flaga, która określa, czy operacja ma dotyczyć jednego obiektu (false - insertOne), czy wielu (true - insertMany).
 * @returns {Promise<any>} Zwraca Promise, który rozwiązuje się na wynik operacji, np. ID wstawionych dokumentów.
 *
 * @example
 * writeMongo('SecureStore', 'Programs', { name: 'New Program', active: true })
 *   .then(result => console.log(result))  // Wynik operacji wstawiania
 *   .catch(error => console.error(error))
 */
export default async function writeMongo(db: string, collection: string, query: any = {}, more: boolean = false): Promise<any> {
    try {
        await connectMongo(db, async (mongoose) => {
            switch (more) {
                case false:
                    switch(Array.isArray(query)) {
                        case true:
                            throw new Error('Dla insertOne, query musi być obiektem, a nie tablicą.');
                    }
                    return await mongoose.collection(collection).insertOne(query);
                case true:
                    switch(Array.isArray(query)){
                        case false:
                            throw new Error('Dla insertMany, query musi być tablicą.');
                    }
                    return await mongoose.collection(collection).insertMany(query);
            }
        })
    } catch (error) {
        console.error('Błąd podczas łączenia z MongoDB:', error);
        throw error;
    }
}