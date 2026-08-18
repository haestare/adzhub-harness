// server.js (raiz) - serve a pasta web/ como site estatico. Zero dependencia.
// Existe para hosts que rodam um processo (Railway/Render). Local: abra web/index.html direto.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "web");
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

http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || "/").split("?")[0]);
  if (p === "/" || p === "") p = "/index.html";
  const fp = path.join(ROOT, path.normalize(p));
  if (!fp.startsWith(ROOT)) { res.writeHead(404); return res.end("404"); }
  fs.readFile(fp, (err, buf) => {
    if (err) { res.writeHead(404); return res.end("404"); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(fp)] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(buf);
  });
}).listen(PORT, () => console.log("demo AdzHub (raiz) em http://0.0.0.0:" + PORT));
