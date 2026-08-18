/* test_md.js · trava os dois defeitos de renderização que apareceram na tela:
 *   1. lista numerada com sub-bullets mostrava "1." em TODOS os itens, porque
 *      cada item interrompido por bullets abria um <ol> novo;
 *   2. "###" aparecia cru no balão, em vez de virar título maior.
 * Roda sem browser: extrai o renderMarkdown do app.js e executa num contexto
 * mínimo, do mesmo jeito que test_sim.js faz com o harness. */
const fs = require("fs"), vm = require("vm"), path = require("path");
const ROOT = path.resolve(__dirname, "..");

// contexto mínimo de DOM: o renderer só monta string, não toca no documento
const ctx = { console, JSON, Math, Date, sessionStorage: { getItem: () => null, setItem() {} },
  localStorage: { getItem: () => null, setItem() {} },
  matchMedia: () => ({ matches: false }),
  document: { querySelector: () => null, addEventListener() {}, documentElement: { dataset: {} }, createElement: () => ({ style: {}, classList: { add() {}, remove() {}, toggle() {} }, append() {}, addEventListener() {} }) },
};
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ["web/data.js", "web/js/tools.js", "web/js/usage.js", "web/js/nexo.js", "web/js/planner.js",
                 "web/js/openrouter.js", "web/js/harness.js", "web/js/modelos.js", "web/js/comandos.js"]) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f });
}
// app.js roda até o init() falhar (não há DOM de verdade); o que importa é AZ.render
try { vm.runInContext(fs.readFileSync(path.join(ROOT, "web/js/app.js"), "utf8"), ctx, { filename: "app.js" }); } catch (_) {}

let falhas = 0;
const ok = (cond, msg) => { console.log(`  ${cond ? "ok " : "FALHOU"}  ${msg}`); if (!cond) falhas++; };
const render = ctx.AZ.render;
if (!render) { console.error("AZ.render não foi exposto pelo app.js"); process.exit(1); }

console.log("\n# 1. lista numerada com sub-bullets mantém a numeração");
const pauta = ["### Pauta da call", "", "1. **Abertura**", "   - Breve introdução.",
  "2. **Performance**", "   - Ômega 3", "     - CPA subiu", "   - Whey", "3. **Creatina**", "4. **Próximos passos**"].join("\n");
const h = render(pauta);
ok((h.match(/<ol>/g) || []).length === 1, "abre UM <ol> só (não um por item)");
ok((h.match(/<ol><li>|<\/li><li>/g) || []).length >= 4, "os 4 itens ficam no mesmo <ol>");
ok(/<ol><li>[\s\S]*?Abertura[\s\S]*?<ul><li>[\s\S]*?Breve/.test(h), "o bullet fica DENTRO do item numerado");
ok(/<ul><li>[\s\S]*?Ômega[\s\S]*?<ul><li>[\s\S]*?CPA/.test(h), "segundo nível de bullet aninha");

console.log("\n# 2. títulos viram h1/h2/h3 e o # nunca aparece");
ok(/<h3>Pauta da call<\/h3>/.test(h), "### vira <h3>");
ok(!/#/.test(h.replace(/&#\d+;/g, "")), "nenhum # sobra no HTML");
ok(/<h1>Um<\/h1>/.test(render("# Um")), "# vira <h1>");
ok(/<h2>Dois<\/h2>/.test(render("## Dois")), "## vira <h2>");
ok(/<h4>/.test(render("#### Quatro")), "#### e abaixo viram <h4>");
ok(/<p>#semtitulo<\/p>/.test(render("#semtitulo")), "# sem espaço NÃO é título (é texto)");

console.log("\n# 3. o que já funcionava continua de pé");
ok(/<table class="fb-table">/.test(render("| a | b |\n| --- | --- |\n| 1 | 2 |")), "tabela ainda renderiza");
ok(/<td class="num">/.test(render("| Anúncio | Gasto |\n| --- | --- |\n| x | R$ 4.200 |")), "coluna numérica alinha à direita");
ok(/<strong>oi<\/strong>/.test(render("**oi**")), "negrito");
ok(/<code>x<\/code>/.test(render("`x`")), "código inline");
ok(/<ul><li>a<\/li><li>b<\/li><\/ul>/.test(render("- a\n- b")), "lista simples");

console.log("\n# 4. ranking de modelos: #1 é o mais forte");
const r = ctx.AZ.modelos;
ok(r.lista.length > 0, "há catálogo (fallback embutido)");
ok(typeof r.rotulo(r.lista[0], 0) === "string" && r.rotulo(r.lista[0], 0).startsWith("#1 · "), "rótulo começa em #1");

console.log(falhas ? `\n${falhas} falha(s)` : "\ntudo passou");
process.exit(falhas ? 1 : 0);
