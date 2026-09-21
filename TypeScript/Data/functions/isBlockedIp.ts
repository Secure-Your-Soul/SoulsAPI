import api from "../../api.js";

interface PreparedConfig {
  ips: Set<string>;
  regex: RegExp[];
  cidrV4: { network: number; mask: number }[];
  cidrV6: { network: bigint; shift: bigint }[];
}

let cache: PreparedConfig | null = null;

export const reloadIpCache = async () => {
  const raw: any = await api.ipcRequest("getConfig");
  const ipBlock = raw?.ipBlock || {};

  cache = {
    ips: new Set(
      (ipBlock.ips || []).map((ip: string) => ip.trim().toLowerCase())
    ),
    regex: (ipBlock.regex || [])
      .filter((r: string) => r && r.length > 0)
      .map((r: string) => new RegExp(r, "i")),

    cidrV4: (ipBlock.cidr || [])
      .filter(
        (c: string) =>
          typeof c === "string" && !c.includes(":") && c.includes("/")
      )
      .map((c: string) => {
        const parts = c.split("/");
        const rangeIp = parts[0] ?? "0.0.0.0";
        const bits = parseInt(parts[1] ?? "32");

        const mask = ~(2 ** (32 - bits) - 1) >>> 0;
        const network =
          rangeIp
            .split(".")
            .reduce((acc, octet) => (acc << 8) + (parseInt(octet) || 0), 0) >>>
          0;
        return { network: network & mask, mask };
      }),

    cidrV6: (ipBlock.cidr || [])
      .filter(
        (c: string) =>
          typeof c === "string" && c.includes(":") && c.includes("/")
      )
      .map((c: string) => {
        const parts = c.split("/");
        const rangeIp = parts[0] ?? "::";
        const bits = BigInt(parts[1] ?? "128");

        const network = ipv6ToBigInt(rangeIp);
        const shift = 128n - bits;
        return { network: network >> shift, shift };
      }),
  };
};

export default async function isBlockedIp(
  ip: string | null | undefined
): Promise<boolean> {
  // Sprawdzenie typu rozwiązuje błędy "Element ip jest prawdopodobnie niezdefiniowany"
  if (typeof ip !== "string" || !ip) return false;
  if (!cache) await reloadIpCache();

  const cleanIp = ip.trim().toLowerCase();
  const isV6 = cleanIp.includes(":");

  if (cache!.ips.has(cleanIp)) return true;
  if (cache!.regex.some((r) => r.test(cleanIp))) return true;

  if (!isV6) {
    const ipNum =
      cleanIp
        .split(".")
        .reduce((acc, octet) => (acc << 8) + (parseInt(octet) || 0), 0) >>> 0;
    return cache!.cidrV4.some((c) => (ipNum & c.mask) === c.network);
  } else {
    const ipNum = ipv6ToBigInt(cleanIp);
    return cache!.cidrV6.some((c) => ipNum >> c.shift === c.network);
  }
}

function ipv6ToBigInt(addr: string): bigint {
  let full = addr;
  if (addr.includes("::")) {
    const parts = addr.split("::");
    const left = parts[0] ?? "";
    const right = parts[1] ?? "";
    const lp = left.split(":").filter(Boolean);
    const rp = right.split(":").filter(Boolean);
    full = [...lp, ...Array(8 - lp.length - rp.length).fill("0"), ...rp].join(
      ":"
    );
  }
  return full
    .split(":")
    .reduce((acc, p) => (acc << 16n) + BigInt(parseInt(p || "0", 16)), 0n);
}
