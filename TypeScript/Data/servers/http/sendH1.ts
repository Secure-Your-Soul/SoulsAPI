import api from '../../../api.js';
import type { ServerResponse } from 'node:http';
import { TLSSocket } from 'node:tls';
import { Readable } from 'stream';

type Config = {
  securityHeaders: Record<string, string>;
};


type Headers = Record<string, string>;
type Body = Record<string, string | number> | Readable | string | null;

const sendH1 = async (res: ServerResponse, code: number, headers: Headers = {}, body: Body = null): Promise<void> => {
  const CONFIG: Config = await api.ipcRequest('getConfig');
  if (res.headersSent) return;

  const sock = res.socket;
  const secHeaders = sock instanceof TLSSocket ? CONFIG.securityHeaders : {};
  const finalHeaders: Record<string, string> = { ...secHeaders, ...headers };
  res.writeHead(code, finalHeaders);

  if (body instanceof Readable) {
    body.pipe(res);
  } else {
    let bodyToSend = '';
    if (body) {
      if (typeof body === 'string') bodyToSend = body;
      else bodyToSend = JSON.stringify(body);
    }
    res.end(bodyToSend);
  }
};

export default sendH1;