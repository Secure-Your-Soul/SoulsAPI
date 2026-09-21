import http from "node:http";
import http2 from "node:http2";
export type tSoulRequest = {
  headers: Record<string, string>;
  url: string;
  method: string;
  params?: Record<string, string>;
  body?: any;
  raw: tRequest;
};
export type tSoulResponse = {
  send: (data: any, code: number) => void;
  raw: tResponse;
};
/** Typy dla Middleware i Handlera */
export type Next = () => Promise<void> | void;
export type Middleware = (
  req: tRequest,
  res: tResponse,
  next: Next
) => Promise<void> | void;
export type handler = (
  req: tSoulRequest,
  res: tSoulResponse
) => void | Promise<void>;
export type Route = {
  path: string;
  handler: handler;
};
export type endpoints = Record<HTTPMethod, Route[]>;
export type Routes = Record<string, endpoints>;
export type MethodsReturn = {
  head: (path: string, handler?: handler) => void;
  get: (path: string, handler?: handler) => void;
  post: (path: string, handler?: handler) => void;
  put: (path: string, handler?: handler) => void;
  patch: (path: string, handler?: handler) => void;
  delete: (path: string, handler?: handler) => void;
  options: (path: string, handler?: handler) => void;
};
export type DomainReturn = (domain: string) => MethodsReturn;
export type tRequest = http.IncomingMessage | http2.ServerHttp2Stream;
export type tResponse = http.ServerResponse;
export type HTTPMethod =
  | "HEAD"
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "OPTIONS";
export enum textInfo {
  error = "[SoulAPI] [Error]",
  methodNotAllowed = "Method Not Allowed",
  internalServerError = "Internal Server Error",
  notFound = "Not Found",
}
export enum HttpStatus {
  // 2xx - Sukces
  ok = 200,
  created = 201,
  accepted = 202,
  noContent = 204,

  // 3xx - Przekierowania
  movedPermanently = 301,
  found = 302,
  notModified = 304,

  // 4xx - Błędy klienta
  badRequest = 400,
  unauthorized = 401,
  forbidden = 403,
  notFound = 404,
  methodNotAllowed = 405,
  conflict = 409,
  payloadTooLarge = 413,
  unsupportedMediaType = 415,
  unprocessableEntity = 422,
  tooManyRequests = 429,

  // 5xx - Błędy serwera
  internalServerError = 500,
  notImplemented = 501,
  badGateway = 502,
  serviceUnavailable = 503,
  gatewayTimeout = 504,
}
// Prosty mapper rozszerzeń
/*
const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".zip": "application/zip",
};*/

export class Router {
  private readonly endpoints: Routes = {};
  //private readonly Middlewares: Record<string, Middleware[]> = {};
  public Domain: DomainReturn = (domain) => {
    const normalizedDomain = domain.toLowerCase().trim();
    if (!normalizedDomain)
      throw new Error(
        `${textInfo.error} Invalid subdomain: received ${domain}`
      );

    const methods: MethodsReturn = {
      head: (endpointPath, handler) =>
        add("HEAD", endpointPath, handler as handler),
      get: (endpointPath, handler) =>
        add("GET", endpointPath, handler as handler),
      post: (endpointPath, handler) =>
        add("POST", endpointPath, handler as handler),
      put: (endpointPath, handler) =>
        add("PUT", endpointPath, handler as handler),
      patch: (endpointPath, handler) =>
        add("PATCH", endpointPath, handler as handler),
      delete: (endpointPath, handler) =>
        add("DELETE", endpointPath, handler as handler),
      options: (endpointPath, handler) =>
        add("OPTIONS", endpointPath, handler as handler),
    };

    // Helper generyczny <T> zwraca MethodsReturn
    const add = <T extends HTTPMethod>(
      method: T,
      path: string,
      handler: handler
    ): MethodsReturn => {
      // Walidacja ścieżki (czy nie jest undefined, null lub pusta)
      if (!path || typeof path !== "string" || path.trim() === "") {
        throw new Error(
          `${textInfo.error} Path is required for method ${method}`
        );
      }

      const normalizedPath = path.startsWith("/") ? path : `/${path}`;
      this.endpoints[normalizedDomain] ??= {
        HEAD: [],
        GET: [],
        POST: [],
        PUT: [],
        PATCH: [],
        DELETE: [],
        OPTIONS: [],
      };
      const targetArray = this.endpoints[normalizedDomain][method];

      if (targetArray.some((route) => route.path === normalizedPath)) {
        throw new Error(
          `${textInfo.error} [Route] [${method}] ${normalizedPath} already exists for Domain ${normalizedDomain}`
        );
      }
      targetArray.push({ path: normalizedPath, handler });
      return methods;
    };
    return methods;
  };
  /* 
    RS = Request/Stream 
    RH = Response/Headers
  */
  public Routes<RS extends tRequest, RH extends tResponse>(rs: RS, rh: RH) {
    /*const domain = rs.headers[":authority"] || "default";
    const path = rs.headers[":path"];
    const method = rs.headers[":method"];

    const handler = this.endpoints[domain]?.[method]?.[path];

    if (!handler) return this.send404(rs);

    // B. TWORZENIE TWOICH OBIEKTÓW (O których rozmawialiśmy)
    const req: tSoulRequest = {
      url: path as string,
      method: method as string,
      headers: rs.headers,
    };

    const res: tSoulResponse = {
      send: (data, code = 200) => {
        const payload = JSON.stringify(data);
        // Tutaj ukrywasz logikę HTTP/2 streamu
        rs.respond({ ":status": code, "content-type": "application/json" });
        rs.end(payload);
      },
      raw: rs, // To jest Twój tResponse (stream)
    };

    // C. WYWOŁANIE HANDLERA
    handler(req, res);*/
    if ("respond" in rs) {
      // Obsługa HTTP2 Stream, Headers
      rs.on("headers", (headers) => {
        console.log(headers[":path"]); // np. "/api/data"
        console.log(headers["user-agent"]);
        console.log(headers["x-forwarded-for"]);
      });
      rs.respond({ ":status": 200 });
      rs.end();
    } else {
      // Obsługa HTTP1/1 Request, Response
      rh.writeHead(200);
      rh.end();
    }
    console.log(rh);
  }
  public use() {}
  *[Symbol.iterator](): Generator<
    { Router: Router; Domain: DomainReturn },
    void
  > {
    yield {
      Router: this,
      Domain: this.Domain,
    };
  }
}

export default Router;
