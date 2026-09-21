import { logger, type LogFunction } from "../../api.js";
import { HttpStatus, Router, type handler } from "./router.js";
import http2, {
  type SecureServerOptions,
  type ServerOptions,
} from "node:http2";
import crypto from "node:crypto";
import { Socket } from "node:net";
//import fs from "node:fs";
//import { pipeline } from "node:stream/promises";
export type tHttps = {
  options?: http2.SecureServerOptions;
  callback?: () => void;
};
export type tHttp = {
  port: number;
  host: string;
  options?: http2.ServerOptions;
  callback?: () => void;
};
const defaultOptions: http2.SecureServerOptions = {
  minVersion: "TLSv1.2",
  maxVersion: "TLSv1.3",
  ciphers: [
    "TLS_AES_256_GCM_SHA384",
    "ECDHE-ECDSA-CHACHA20-POLY1305",
    "ECDHE-ECDSA-AES256-GCM-SHA384",
  ].join(":"),
  ecdhCurve: "P-384:P-521:X25519",
  sigalgs: "ecdsa_secp384r1_sha384:rsa_pss_rsae_sha384",
  sessionTimeout: 300,
  maxSessionMemory: 5,
  settings: {
    maxConcurrentStreams: 200,
    initialWindowSize: 1024 * 64,
    maxFrameSize: 16 * 1024,
    maxHeaderListSize: 16 * 1024,
  },
  honorCipherOrder: true,
  ALPNProtocols: ["h2", "http/1.1"],
  allowHTTP1: true,
  sessionIdContext: "SoulServer",
  secureOptions:
    crypto.constants.SSL_OP_NO_TICKET |
    crypto.constants.SSL_OP_NO_SSLv2 |
    crypto.constants.SSL_OP_NO_SSLv3 |
    crypto.constants.SSL_OP_NO_TLSv1 |
    crypto.constants.SSL_OP_NO_TLSv1_1 |
    crypto.constants.SSL_OP_NO_COMPRESSION |
    crypto.constants.SSL_OP_CIPHER_SERVER_PREFERENCE |
    crypto.constants.SSL_OP_PRIORITIZE_CHACHA |
    crypto.constants.SSL_OP_NO_RENEGOTIATION |
    crypto.constants.SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION,
};
async function connectionSecurity(socket: Socket, log: LogFunction) {
  const ip = socket.remoteAddress;
  if (!ip) {
    log(`[CONNECTION] [IP_BLOCK] Connection reject ${ip} is blocked`, "warn");
    socket.destroy();
  }
}
export class HTTPServer {
  public router: Router;
  public httpsLog = logger("HTTPS");
  public httpLog = logger("HTTP");

  constructor(options?: {
    router?: Router;
    log?: {
      serviceName?: string;
      logPath?: string;
    };
  }) {
    this.router = options?.router || new Router();
  }
  public HTTPS(options?: {
    log?: {
      serviceName: string;
      logPath: string;
    };
    options?: SecureServerOptions;
  }) {
    const httpsLog = logger(
      options?.log?.serviceName || "HTTPS",
      options?.log?.logPath || "./Data/Logs"
    );
    const httpsServer = http2.createSecureServer(
      options?.options || defaultOptions
    );
    httpsServer.on("connection", async (socket: Socket) => {
      httpsLog("[CONNECTION] " + socket.remoteAddress);
      connectionSecurity(socket, this.httpsLog);
    });
    httpsServer.on("OCSPRequest", () => {
      httpsLog("[OCSP REQUEST]");
    });
    httpsServer.on("resumeSession", () => {
      httpsLog("[RESUME SESSION]");
    });
    httpsServer.on("sessionError", (err: Error) => {
      httpsLog("[SESSION ERROR] " + err, "error");
    });
    httpsServer.on("tlsClientError", (err: Error) => {
      httpsLog("[TLS CLIENT ERROR] " + err, "error");
    });
    httpsServer.on("stream", (stream, headers) => {
      httpsLog("[STREAM] " + stream);
      httpsLog("[STREAM] " + headers);
    });
    httpsServer.on("close", () => {
      httpsLog("[CLOSE]");
    });
    httpsServer.on("error", (err: Error) => {
      httpsLog("[ERROR] " + err, "error");
    });
    httpsServer.on("timeout", () => {
      httpsLog("[TIMEOUT]", "warn");
    });
    return httpsServer;
  }
  public HTTP(options?: {
    redirect: boolean;
    log: {
      serviceName: string;
      logPath: string;
    };
    options?: ServerOptions;
  }) {
    const httpLog = logger(
      options?.log?.serviceName || "HTTP",
      options?.log?.logPath || "./Data/Logs"
    );
    const httpServer = http2.createServer(options?.options || defaultOptions);
    httpServer.on("connection", async (socket: Socket) => {
      httpLog("[CONNECTION] " + socket);
      connectionSecurity(socket, this.httpLog);
    });
    httpServer.on("sessionError", (err: Error) => {
      httpLog("[SESSION ERROR] " + err, "error");
    });
    httpServer.on("request", (req, res) => {
      httpLog("[REQUEST] " + req);
      httpLog("[REQUEST] " + res);
      if (options?.redirect || false) {
        const hostHeader = req.headers.host || "";
        const target = `https://${hostHeader}${req.url || ""}`;

        res.writeHead(HttpStatus.movedPermanently, { Location: target });
        res.end(`Redirecting to secure gateway...`);
      }
    });
    httpServer.on("close", () => {
      httpLog("[CLOSE]");
    });
    httpServer.on("error", (err: Error) => {
      httpLog("[ERROR] " + err, "error");
    });
    httpServer.on("timeout", () => {
      httpLog("[TIMEOUT]", "warn");
    });
    return httpServer;
  }
  // Delegacja routera (get, post itd.)
  public head = (path: string, handler: handler) =>
    this.router.Domain("").head(path, handler);
  public get = (path: string, handler: handler) =>
    this.router.Domain("").get(path, handler);
  public post = (path: string, handler: handler) =>
    this.router.Domain("").post(path, handler);
  public put = (path: string, handler: handler) =>
    this.router.Domain("").put(path, handler);
  public patch = (path: string, handler: handler) =>
    this.router.Domain("").patch(path, handler);
  public delete = (path: string, handler: handler) =>
    this.router.Domain("").delete(path, handler);
  public options = (path: string, handler: handler) =>
    this.router.Domain("").options(path, handler);
}
export default HTTPServer;
