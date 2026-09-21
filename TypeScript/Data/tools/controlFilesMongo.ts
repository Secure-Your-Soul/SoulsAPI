'use strict';
import connectMongo from './connectMongo.js';
import { GridFSBucket, ObjectId } from 'mongodb';
import { Readable } from 'node:stream';

export type FileObject = {
    filename: string;
    buffer: Buffer;
    mimeType: string;
};

export type ProgressCallback = (progress: number, filename: string) => void;

export async function uploadFiles(
    db: string,
    collection: string,
    files: FileObject[],
    metadata: Record<string, any> = {},
    progressCallback: ProgressCallback = () => {},
    maxFileSize: number = 10 * 1024 * 1024,
    maxTotalSize: number = 50 * 1024 * 1024,
    allowedExtensions: Record<string, boolean> = {}
): Promise<ObjectId[]> {
    const fileIds: ObjectId[] = [];
    let totalSize = 0;

    await connectMongo(db, async (mongoose) => {
        if (!mongoose.db) return;
        const bucket = new GridFSBucket(mongoose.db, { bucketName: collection });

        for (const file of files) {
            // Walidacja rozmiaru
            if (file.buffer.length > maxFileSize) {
                throw new Error(`Plik "${file.filename}" przekracza dozwolony rozmiar ${maxFileSize / (1024 * 1024)} MB`);
            }

            totalSize += file.buffer.length;
            if (totalSize > maxTotalSize) {
                throw new Error('Łączny rozmiar plików przekracza dozwolony limit');
            }

            // Walidacja rozszerzenia
            const ext = file.filename.split('.').pop()?.toLowerCase();
            if (!ext || !allowedExtensions[ext]) {
                throw new Error(`Plik "${file.filename}" ma niedozwolone rozszerzenie "${ext}"`);
            }

            // Poprawione: contentType w metadata
            const uploadStream = bucket.openUploadStream(file.filename, {
                metadata: { ...metadata, contentType: file.mimeType }
            });
            const readable = Readable.from(file.buffer);

            let uploadedBytes = 0;
            readable.on('data', (chunk: Buffer) => {
                uploadedBytes += chunk.length;
                progressCallback(Math.floor((uploadedBytes / file.buffer.length) * 100), file.filename);
            });

            readable.pipe(uploadStream);

            await new Promise<void>((resolve, reject) => {
                uploadStream.on('finish', () => {
                    fileIds.push(uploadStream.id as ObjectId);
                    resolve();
                });
                uploadStream.on('error', reject);
            });
        }
    });

    return fileIds;
}

export async function downloadFiles(
    db: string,
    collection: string,
    fileIds: string[] | ObjectId[],
    progressCallback: ProgressCallback = () => {}
): Promise<{ progress: number; fileStatuses: { filename: string; status: string; error?: string }[] }> {
    const fileStatuses: { filename: string; status: string; error?: string }[] = [];
    let completedCount = 0;

    await connectMongo(db, async (mongoose) => {
        if (!mongoose.db) return;
        const bucket = new GridFSBucket(mongoose.db, { bucketName: collection });

        for (const id of fileIds) {
            const _id = typeof id === 'string' ? new ObjectId(id) : id;
            const files = await bucket.find({ _id }).toArray();

            if (files.length === 0) {
                fileStatuses.push({ filename: '', status: 'failed', error: `Nie znaleziono pliku o ID: ${_id}` });
                continue;
            }

            const file = files[0];
            if (!file) continue;
            const downloadStream = bucket.openDownloadStream(file._id);

            let downloadedBytes = 0;
            downloadStream.on('data', (chunk: Buffer) => {
                downloadedBytes += chunk.length;
                const progress = Math.floor((downloadedBytes / file.length) * 100);
                progressCallback(progress, file.filename);
            });

            // Zapis do pliku w tym samym folderze
            const fs = await import('fs');
            const path = await import('path');
            const filePath = path.join(process.cwd(), file.filename);
            downloadStream.pipe(fs.createWriteStream(filePath));

            await new Promise<void>((resolve, reject) => {
                downloadStream.on('finish', resolve);
                downloadStream.on('error', reject);
            });

            fileStatuses.push({ filename: file.filename, status: 'completed' });
            completedCount++;
        }
    });

    const progress = Math.floor((completedCount / fileIds.length) * 100);
    return { progress, fileStatuses };
}

export async function deleteFiles(
    db: string,
    collection: string,
    fileIds: string[] | ObjectId[],
    progressCallback: ProgressCallback = () => {}
): Promise<{ progress: number; fileStatuses: { fileId: string | ObjectId; status: string; error?: string }[] }> {
    const fileStatuses: { fileId: string | ObjectId; status: string; error?: string }[] = [];
    let deletedCount = 0;

    await connectMongo(db, async (mongoose) => {
        if (!mongoose.db) return;
        const bucket = new GridFSBucket(mongoose.db, { bucketName: collection });

        for (const id of fileIds) {
            const _id = typeof id === 'string' ? new ObjectId(id) : id;
            try {
                await bucket.delete(_id);
                deletedCount++;
                progressCallback(Math.floor((deletedCount / fileIds.length) * 100), `Plik o ID: ${_id}`);
                fileStatuses.push({ fileId: _id, status: 'deleted' });
            } catch (error: any) {
                fileStatuses.push({ fileId: _id, status: 'failed', error: error.message });
            }
        }
    });

    return { progress: Math.floor((deletedCount / fileIds.length) * 100), fileStatuses };
}