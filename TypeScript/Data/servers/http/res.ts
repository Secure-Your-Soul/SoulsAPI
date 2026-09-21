import { ipcRequest } from '../../../api.js';
import type { ServerResponse } from 'node:http';
import type { IncomingMessage } from 'node:http';
import type { ServerHttp2Stream } from 'node:http2';
import type { Readable } from 'stream';
import { TLSSocket } from 'tls';

type Config = { securityHeaders: Record<string, string> };
type Body = string | Record<string, any> | Readable | null;

// Target musi być unią, żeby posiadał metody Node.js (jak writeHead czy respond)
export type Target = (ServerResponse | ServerHttp2Stream) & {
  headers?: Record<string, any>;
  method?: string;
  url?: string;
  body?: any;
  params?: Record<string, string>;
  req?: IncomingMessage;
};

// Pomocnicza funkcja do wysyłania body, która akceptuje oba typy strumieni
const sendBody = (dst: ServerResponse | ServerHttp2Stream, body: Body) => {
  const target = dst as any; // Rzutowanie na any ułatwia obsługę metody .end() i .pipe()
  if (!body) return target.end();
  
  if (body && typeof (body as Readable).pipe === 'function') {
    (body as Readable).pipe(target);
  } else {
    target.end(typeof body === 'string' ? body : JSON.stringify(body));
  }
};

export default async function res(
  resOrStream: any, // Używamy any dla parametru wejściowego, by swobodnie sprawdzić właściwości
  body: Body = null,
  headers: Record<string, string | number> = {},
  code = 200
): Promise<void> {
  const CONFIG: Config = await ipcRequest('getConfig');

  // Sprawdzanie wersji protokołu
  const isH2 = 'respond' in resOrStream && typeof resOrStream.respond === 'function';
  const isH1 = 'writeHead' in resOrStream && typeof resOrStream.writeHead === 'function';

  if (!isH1 && !isH2) throw new Error("Nieznany typ odpowiedzi (ani H1 ani H2)");

  // --- HTTPS CHECK ---
  // H2 trzyma socket w sesji, H1 bezpośrednio w obiekcie res
  const sock = isH2 ? resOrStream.session?.socket : resOrStream.socket;
  const encrypted = sock instanceof TLSSocket;
  const secHeaders = encrypted ? CONFIG.securityHeaders : {};

  // --- LOGIKA DLA HTTP/2 ---
  if (isH2) {
    const stream = resOrStream as ServerHttp2Stream;
    if (stream.headersSent) return;

    stream.respond({ ':status': code, ...secHeaders, ...headers });
    sendBody(stream, body);
    return;
  }

  // --- LOGIKA DLA HTTP/1 ---
  if (isH1) {
    const response = resOrStream as ServerResponse;
    if (response.headersSent) return;

    response.writeHead(code, { ...secHeaders, ...headers });
    sendBody(response, body);
    return;
  }
}