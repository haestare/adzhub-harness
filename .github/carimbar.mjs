/* carimbar.mjs · faz em BUILD TIME o que o server.js faz em runtime.
 *
 * O GitHub Pages é hospedagem estática pura: não há processo para carimbar as
 * URLs nem para injetar o horário do build. Sem isso o browser guardaria o JS
 * antigo e a página abriria a versão velha sem dar erro nenhum — que é
 * exatamente o problema que este arquivo existe para não repetir.
 *
 * Reescreve web/index.html:
 *   · src="js/app.js"  ->  src="js/app.js?v=<mtime em base36>"
 *   · injeta window.__BUILD, que a tela mostra no painel do harness.
 */
import fs from "node:fs";
import path from "node:path";

const WEB = path.join(process.cwd(), "web");
const INDEX = path.join(WEB, "index.html");

const carimbo = (rel) => {
  try { return "?v=" + Math.floor(fs.statSync(path.join(WEB, rel)).mtimeMs).toString(36); }
  catch { return ""; }
};

const build = (() => {
  const arqs = [INDEX, ...fs.readdirSync(path.join(WEB, "js")).map((f) => path.join(WEB, "js", f))];
  const t = Math.max(...arqs.map((f) => fs.statSync(f).mtimeMs));
  return new Date(t).toISOString().slice(0, 16).replace("T", " ") + " UTC";
})();

const html = fs.readFileSync(INDEX, "utf8")
  .replace(/(src|href)="((?:js\/[\w.-]+\.js|styles\.css|data\.js))"/g, (_, a, rel) => `${a}="${rel}${carimbo(rel)}"`)
  .replace("</head>", `<script>window.__BUILD=${JSON.stringify(build)};</script></head>`);

fs.writeFileSync(INDEX, html);
console.log("index.html carimbado · build", build);
