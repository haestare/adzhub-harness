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

// 🔴 CACHE-BUSTING: sem isso o browser continua rodando o JS antigo depois de um
// deploy, e o sintoma é cruel — a página abre, não dá erro nenhum, e mostra a
// versão velha (foi o que aconteceu com o dropdown de modelos). Aqui o próprio
// servidor carimba cada asset com o mtime dele, então um arquivo novo é sempre
// uma URL nova. Também expõe o horário do build para dar para conferir na tela.
function carimbar(html) {
  const v = (rel) => {
    try { return "?v=" + Math.floor(fs.statSync(path.join(ROOT, rel)).mtimeMs).toString(36); }
    catch (_) { return ""; }
  };
  return html
    .replace(/(src|href)="((?:js\/[\w.-]+\.js|styles\.css|data\.js))"/g, (_, a, rel) => `${a}="${rel}${v(rel)}"`)
    .replace("</head>", `<script>window.__BUILD=${JSON.stringify(BUILD)};</script></head>`);
}
const BUILD = (() => {
  try { // mais recente entre os arquivos servidos = quando esta versão foi publicada
    const arqs = [path.join(ROOT, "index.html"), ...fs.readdirSync(path.join(ROOT, "js")).map((f) => path.join(ROOT, "js", f))];
    const t = Math.max(...arqs.map((f) => fs.statSync(f).mtimeMs));
    return new Date(t).toISOString().slice(0, 16).replace("T", " ") + " UTC";
  } catch (_) { return "?"; }
})();

http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || "/").split("?")[0]);
  if (p === "/" || p === "") p = "/index.html";
  const fp = path.join(ROOT, path.normalize(p));
  if (!fp.startsWith(ROOT)) return end404(res); // nunca sair da raiz
  fs.readFile(fp, (err, buf) => {
    if (err) return end404(res);
    if (fp.endsWith("index.html")) buf = Buffer.from(carimbar(buf.toString("utf8")), "utf8");
    send(res, path.extname(fp), buf);
  });
}).listen(PORT, () => console.log("demo AdzHub em http://0.0.0.0:" + PORT + " · build " + BUILD));
