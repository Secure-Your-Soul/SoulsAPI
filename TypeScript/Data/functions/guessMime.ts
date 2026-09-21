const guessMime = (ext: string): string => ({
  '.html':'text/html; charset=utf-8', '.htm':'text/html; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.js':'application/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8', '.png':'image/png',
  '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.gif':'image/gif',
  '.svg':'image/svg+xml', '.webp':'image/webp', '.avif':'image/avif', '.ico':'image/x-icon',
  '.txt':'text/plain; charset=utf-8', '.woff2':'font/woff2', '.woff':'font/woff',
  '.ttf':'font/ttf', '.otf':'font/otf', '.mp4':'video/mp4', '.mp3':'audio/mpeg', '.ts': 'video/mp2t',
}[ext] || 'application/octet-stream');
export default guessMime;