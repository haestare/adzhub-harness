// server.js - servidor estatico minimo, zero dependencia, para deploy (Railway/Render/etc).
// A demo e 100% estatica (o dado vive embutido em data.js); isto so serve os arquivos.
// Local: basta abrir index.html por duplo clique. Isto existe para hosts que rodam um processo.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const PORT = process.env.PORT || 8099;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

function send(res, ext, buf) {
  res.writeHead(200, { "Content-Type": TYPES[ext] || "application/octet-stream", "Cache-Control": "no-cache" });
  res.end(buf);
}
function end404(res) {
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("404");
}

http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || "/").split("?")[0]);
  if (p === "/" || p === "") p = "/index.html";
  const fp = path.join(ROOT, path.normalize(p));
  if (!fp.startsWith(ROOT)) return end404(res); // nunca sair da raiz
  fs.readFile(fp, (err, buf) => {
    if (err) return end404(res);
    send(res, path.extname(fp), buf);
  });
}).listen(PORT, () => console.log("demo AdzHub em http://0.0.0.0:" + PORT));
