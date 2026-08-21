/* test_contas.js · trava o isolamento entre clientes (multi-conta).
 *
 * A promessa do desenho e forte: o modelo NAO alcanca dado de outra conta, porque
 * conta nao e argumento de tool, e estado do harness. Promessa desse tamanho
 * precisa de teste, senao vira frase de paper. Roda sem browser e sem rede.
 */
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const ctx = { console, location: { origin: "" }, setTimeout, JSON, Math, Date };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ["web/data.js", "web/js/tools.js"]) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f });
}
const AZ = ctx.AZ;
const anuncios = () => AZ.callTool("list_ads", {}).ads.map((a) => a.ad_id);

// ---- existem duas contas, com nome vindo do proprio dado -------------------
const contas = AZ.contas.lista();
assert.ok(contas.length >= 2, "esperava pelo menos 2 clientes no mock");
assert.ok(contas.includes("housewhey") && contas.includes("bravopet"), "clientes esperados: housewhey e bravopet");
assert.equal(AZ.contas.nome("bravopet"), "Bravo Pet", "o nome sai do no do grafo, nao de uma segunda lista");

// ---- cada conta devolve o SEU dado ----------------------------------------
AZ.contas.definir("housewhey");
const hw = anuncios();
AZ.contas.definir("bravopet");
const bp = anuncios();
assert.ok(hw.length && bp.length, "as duas contas precisam ter anuncios");
assert.equal(hw.filter((x) => bp.includes(x)).length, 0, "nenhum anuncio pode aparecer nas duas contas");
assert.ok(hw.some((x) => /omega3/.test(x)), "housewhey deveria ter o Omega 3");
assert.ok(bp.some((x) => /racao/.test(x)), "bravopet deveria ter a Racao");

// ---- a troca reescopa TUDO, nao so uma tool -------------------------------
const alcance = () => ({
  ads: anuncios().length,
  leads: AZ.callTool("get_leads", {}).summary.count,
  timeline: AZ.callTool("get_timeline", {}).events.length,
  mapa: AZ.callTool("get_mapa_solucao", {}).marca.nome,
});
AZ.contas.definir("housewhey"); const a = alcance();
AZ.contas.definir("bravopet");  const b = alcance();
assert.notEqual(a.ads, b.ads); assert.notEqual(a.leads, b.leads);
assert.notEqual(a.timeline, b.timeline);
assert.notEqual(a.mapa, b.mapa, "ate o App de marca tem que trocar junto");

// ---- 🔴 a invariante que sustenta a promessa -------------------------------
// nenhuma tool pode aceitar "cliente"/"conta" como parametro: se aceitasse, o
// modelo poderia pedir dado de outra conta, e o isolamento viraria promessa de
// prompt em vez de propriedade do runtime.
for (const t of AZ.toolSpecs) {
  const props = Object.keys((t.function.parameters || {}).properties || {});
  const proibido = props.filter((p) => /client|conta|account|tenant/i.test(p));
  assert.equal(proibido.length, 0, `a tool ${t.function.name} expoe ${proibido.join(",")} ao modelo`);
}

// ---- conta desconhecida nao derruba nem troca em silencio ------------------
const antes = AZ.contas.atual;
AZ.contas.definir("nao_existe");
assert.equal(AZ.contas.atual, antes, "conta inexistente nao pode trocar o escopo");

console.log("tudo passou");
