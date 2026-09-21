import { resolve } from "node:path";
import YAML from "yaml";
import fs from "node:fs/promises";
const __dirname = process.cwd();
// ---------- CONFIG ----------
export type config = {
  tls: {
    key: string;
    cert: string;
    ca: string;
    ocsp: string;
    minVersion: string;
    maxVersion: string;
    ciphers: string;
    ecdhCurve: string;
    sigalgs: string;
  };
  defaultRoot: string;
  configFolder: string;
  certFolder: string;
  logFolder: string;
  domains: Record<string, string>;
  acmeDir: string;
  securityHeaders: Record<string, string | number>;
  logging: {
    dir: string;
    file: string;
    level: "info" | "warn" | "error";
  };
  ALLOWED_EXT: string[];
  COMPRESS_EXT: string[];
  publicIP?: string;
  mainDomain?: string;
  company?: {
    name: string;
    contactEMail: string;
  };
  ipBlock?: {
    ips: string[];
    regex: string[];
    cidr: string[];
  };
  rateLimit?: {
    max: number;
    windowMs: number;
    banAfter: number;
    banTimeMs: number;
  };
};
const CONFIG: config = {
  tls: {
    key: resolve(__dirname, "Data/Cert/Google/securesouls.com.key"),
    cert: resolve(__dirname, "Data/Cert/Google/fullchain.cer"),
    ca: resolve(__dirname, "Data/Cert/Google/ca.cer"),
    ocsp: resolve(__dirname, "Data/Cert/Google/securesouls.com.ocsp"),
    minVersion: "TLSv1.2",
    maxVersion: "TLSv1.3",
    ciphers: [
      "TLS_AES_256_GCM_SHA384", // TLS1.3, silniejszy 256-bit
      //"TLS_CHACHA20_POLY1305_SHA256", // TLS1.3, dla mobilnych (ARM)
      //"ECDHE-ECDSA-CHACHA20-POLY1305", // TLS1.2, ChaCha dla PFS
      "ECDHE-ECDSA-AES256-GCM-SHA384", // TLS1.2, ECDHE PFS 256-bit
      //"ECDHE-ECDSA-AES128-GCM-SHA256", // TLS1.2 EC dla androida 5 i 6
      //"ECDHE-ECDSA-AES128-SHA", // TLS1.2 EC Safari
    ].join(":"),
    ecdhCurve: [
      "X25519MLKEM768",
      "x448",
      "brainpoolP512r1",
      "P-521",
      "brainpoolP384r1",
      "P-384",
      "X25519",
    ].join(":"), // nie wspierany jeszcze SecP521r1MLKEM1024:x448MLKEM1024 SecP384r1MLKEM1024: X25519MLKEM1024:
    sigalgs: [
      "ML-DSA-87",
      "ML-DSA-65",
      "ML-DSA-44",
      "ed448",
      "ecdsa_secp521r1_sha512",
      "ecdsa_secp384r1_sha384",
      "ed25519",
    ].join(":"), // rsa_pss_rsae_sha384',
  },
  defaultRoot: resolve(__dirname, "Data/Applications/Secure Your Soul/Public"),
  configFolder: resolve(__dirname, "Data/Config"),
  certFolder: resolve(__dirname, "Data/Cert"),
  logFolder: resolve(__dirname, "Data/Logs"),
  domains: {},
  acmeDir: "C:/acme/.well-known/acme-challenge",
  securityHeaders: {},
  logging: {
    dir: resolve(__dirname, "/Data/Logs"),
    file: resolve(__dirname, "/Data/Logs/log.txt"),
    level: "info", // info|warn|error (console override still writes all)
  },
  ALLOWED_EXT: [
    ".html",
    ".css",
    ".js",
    ".json",
    ".svg",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".avif",
    ".mp4",
    ".mp3",
    ".ts",
    ".woff",
    ".woff2",
    ".ttf",
    ".otf",
    ".ico",
    ".txt",
  ],
  COMPRESS_EXT: [
    ".html",
    ".css",
    ".js",
    ".json",
    ".svg",
    ".txt",
    ".woff",
    ".woff2",
    ".ttf",
    ".otf",
  ],
};
async function wczytajYaml<T>(path: string, defaultData: T): Promise<T> {
  try {
    const file = await fs.readFile(path, "utf8");
    const data = YAML.parse(file);
    return Object.assign({}, defaultData, data); // do CONFIG dopisujemy wartości z pliku
  } catch (err: any) {
    if (err.code === "ENOENT") {
      console.warn(`Brak pliku ${path}, tworzę nowy.`);
      await zapiszYaml(path, defaultData);
      return defaultData;
    }
    console.error("Błąd wczytywania YAML:", err);
    return defaultData;
  }
}

async function zapiszYaml(path: string, data: any): Promise<any> {
  try {
    const yamlStr = YAML.stringify(data, { indent: 2 }); // konwersja obiektu do YAML
    await fs.mkdir(path.split("/").slice(0, -1).join("/"), { recursive: true });
    await fs.writeFile(path, yamlStr, "utf8");
  } catch (err: any) {
    console.error("Błąd zapisu YAML:", err);
  }
}
async function main() {
  await Object.assign(
    CONFIG,
    await wczytajYaml(CONFIG.configFolder + "/config.yml", {
      publicIP: (
        await (await fetch("https://checkip.amazonaws.com/")).text()
      ).trim(),
      mainDomain: "",
      company: {
        name: "",
        contactEMail: "",
      },
      ipBlock: {
        ips: ["52.169.72.127"],
        regex: [
          "/^127./",
          "/^192.168./",
          "/^::1$/",
          // /^10\./,
          // /^172\.(1[6-9]|2[0-9]|3[0-1])\./
        ],
        cidr: [
          // '203.0.113.0/24'
        ],
      },
      rateLimit: {
        max: 10000, // requests per window
        windowMs: 60_000, // 1 min
        banAfter: 2, // windows exceeded before ban
        banTimeMs: 15 * 60_000, // 15 min
      },
    })
  );
  CONFIG.domains = {
    [`${CONFIG.mainDomain}`]: `${CONFIG.defaultRoot}`,
    [`api.${CONFIG.mainDomain}`]: `${CONFIG.defaultRoot}`,
    [`blog.${CONFIG.mainDomain}`]: resolve(
      __dirname,
      "Data/Applications/SoulsBlog/Public"
    ),
    [`deniskontek.${CONFIG.mainDomain}`]: resolve(
      __dirname,
      "Data/Applications/Denis Kontek/Public"
    ),
    [`detector.${CONFIG.mainDomain}`]: resolve(
      __dirname,
      "Data/Applications/SoulDetector/Public"
    ),
    [`developer.${CONFIG.mainDomain}`]: `${CONFIG.defaultRoot}`,
    [`dev.${CONFIG.mainDomain}`]: `${CONFIG.defaultRoot}`,
    [`hub.${CONFIG.mainDomain}`]: resolve(
      __dirname,
      "Data/Applications/SoulHub/Public"
    ),
    [`login.${CONFIG.mainDomain}`]: resolve(
      __dirname,
      "Data/Applications/SoulVerifier/Public"
    ),
    [`pay.${CONFIG.mainDomain}`]: `${CONFIG.defaultRoot}`,
    [`souls.${CONFIG.mainDomain}`]: resolve(
      __dirname,
      "Data/Applications/SecureSouls/Public"
    ),
    [`store.${CONFIG.mainDomain}`]: resolve(
      __dirname,
      "Data/Applications/SecureStore/Public"
    ),
    [`www.${CONFIG.mainDomain}`]: `${CONFIG.defaultRoot}`,
  };
  CONFIG.securityHeaders = {
    "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
    "x-content-type-options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "referrer-policy": "strict-origin-when-cross-origin",
    "cross-origin-opener-policy": "same-origin",
    "cross-origin-embedder-policy": "require-corp",
    "cross-origin-resource-policy": "same-site",

    "content-security-policy":
      "require-trusted-types-for 'script'; " +
      "trusted-types default safeUI goog#html; " +
      "default-src 'self'; " +
      "script-src 'self'; " +
      "script-src-elem 'self'; " +
      "style-src 'self'; " +
      `img-src 'self' data: https://souls.${CONFIG.mainDomain} https://store.${CONFIG.mainDomain} https://detector.${CONFIG.mainDomain} https://deniskontek.${CONFIG.mainDomain} https://blog.${CONFIG.mainDomain}; ` +
      "object-src 'none'; " +
      `connect-src 'self' https://souls.${CONFIG.mainDomain} https://store.${CONFIG.mainDomain} https://detector.${CONFIG.mainDomain} https://deniskontek.${CONFIG.mainDomain} https://blog.${CONFIG.mainDomain}; ` +
      `frame-src 'self'; ` +
      `frame-ancestors 'self' https://www.${CONFIG.mainDomain} https://${CONFIG.mainDomain}; ` +
      "base-uri 'self'; " +
      "form-action 'self'; " +
      "font-src 'self'; " +
      "manifest-src 'self'; " +
      "worker-src 'self'; " +
      "upgrade-insecure-requests; " +
      "script-src-attr 'none';",

    "permissions-policy": `geolocation=(), camera=("https://souls.${CONFIG.mainDomain}"), microphone=("https://souls.${CONFIG.mainDomain}")`,
    "X-XSS-Protection": 0,
    "origin-agent-cluster": "?1",
    server: "SoulServer",

    // 🔒 Dodatkowe polecane nagłówki:
    "X-DNS-Prefetch-Control": "on",

    "Cache-Control": "no-cache, no-store, must-revalidate",
    "X-Robots-Tag":
      "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
  };
}
main();
export default CONFIG;
