import api from '../../api.js';
export default async function pickRoot (host: string, ip: string | null = null, pathname: string | null = null) {
  const CONFIG = await api.ipcRequest('getConfig');
  const h = (host || '').split(':')[0]?.toLowerCase();
  if (!h) {
    console.warn('⛔ Brak Host w request', { ip, url: pathname });
    return null;
  }
  if (!Object.keys(CONFIG.domains).includes(h) && h !== CONFIG.mainDomain) {
    console.warn('⛔ Nieznany Host', { host: h, ip });
    return null; // Lub rzuć 400/404
  }
  return CONFIG.domains[h] || CONFIG.defaultRoot;
};