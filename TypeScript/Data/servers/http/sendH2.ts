import api from '../../../api.js';
import type { ServerHttp2Stream } from 'node:http2';
import { TLSSocket } from 'node:tls';

// Typ CONFIG – dopasuj pola do tego, co zwraca ipcRequest
type Config = {
  securityHeaders: Record<string, string>;
  noCache: Record<string, string>;
  // inne pola jeśli potrzebujesz
};

// Top-level await – wymaga ESNext w tsconfig

const sendH2 = async ( stream: ServerHttp2Stream, code: number, headers: Record<string, string> = {}, body: Record<string, string | number> | NodeJS.ReadableStream | null = null ): Promise<void> => {
  const CONFIG: Config = await api.ipcRequest('getConfig');
  if (stream.headersSent) return;

  const sock = stream.session?.socket;
  const secHeaders = sock instanceof TLSSocket ? CONFIG.securityHeaders : {};

  // Wysyłamy nagłówki
  stream.respond({ ':status': code, ...secHeaders, ...CONFIG.noCache, ...headers });

  // Wysyłamy body
  if (body) {
    if ('pipe' in body && typeof body.pipe === 'function') {
      body.pipe(stream);
    } else {
      stream.end(body);
    }
  } else {
    stream.end();
  }
};

export default sendH2;
