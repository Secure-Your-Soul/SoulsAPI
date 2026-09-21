import fs from 'node:fs/promises';
import os from 'node:os';
import { dirname, resolve, join } from 'node:path';
import { type config, logger } from '../../api.js'
export type installProgramFile = config & { channel: string, path: string, installedAt: string, exe: string, user: string, platform: string}
export default async function createDefaultFirstRunFile(config: config): Promise<void> {
    const log: (text: string, level?: 'info' | 'warn' | 'error', inConsole?: boolean) => Promise<void> = logger(config.displayName);
    const currentExe: string = process.execPath;
    const currentFolder: string = dirname(currentExe);
    const platform: string = process.platform;
    const filePath: string = resolve(join(platform === 'win32' ? join(process.env.LOCALAPPDATA ?? "", config.company.name) : join(os.homedir(), `.${config.company.name}`), config.displayName, 'Data', 'install.json'));
    try {
        // Sprawdzenie, czy plik istnieje
        await fs.access(filePath, fs.constants.F_OK);
        const install: installProgramFile = JSON.parse(await fs.readFile(filePath, 'utf-8'));

        let isChanged: boolean = false;

        // 1. Sprawdzasz folder (path)
        if (install.path !== currentFolder) {
            log(`[path] Zmieniono z ${install.path} na ${currentFolder}`);
            install.path = currentFolder;
            isChanged = true;
        }

        // 2. Sprawdzasz plik (exe) - CAŁKOWICIE OSOBNO
        if (install.exe !== currentExe) {
            log(`[exe] Zmieniono z ${install.exe} na ${currentExe}`);
            install.exe = currentExe;
            isChanged = true;
        }

        // 3. Jeśli cokolwiek się zmieniło, zapisujesz plik raz a dobrze
        if (isChanged) await fs.writeFile(filePath, JSON.stringify(install, null, 2));
    } catch(err: any) {
        if(err.code === 'ENOENT') {
            // Jeśli plik nie istnieje, tworzymy foldery i plik
            await fs.mkdir(dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, JSON.stringify({
                name: config.displayName,
                version: config.version,
                channel: (config.version.match(/-(alpha|beta|dev|rc)/i)?.[1] ?? 'stable').toLowerCase(),
                path: currentFolder,
                installedAt: new Date().toISOString(),
                exe: currentExe,
                repository: { url: config.repository.url.length > 1 ? config.repository.url : `https://api.github.com/repos/${config.company.name.replace(/\s+/g, '-')}/${config.displayName}`},
                user: process.env.USER || process.env.USERNAME,
                platform
            }, null, 2));
        } else throw err;
    }
}