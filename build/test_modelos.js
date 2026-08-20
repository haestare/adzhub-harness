/* test_modelos.js · trava o catálogo de modelos: filtro, ranking, grupos.
 *
 * Por que existe: a versão anterior cortava a lista em 12 e ainda colapsava um por
 * família, então o catálogo inteiro sumia do dropdown sem erro nenhum. Regressão
 * desse tipo não quebra a demo, ela só empobrece o dropdown em silêncio, que é
 * pior. Roda sem rede e sem chave: o fetch é falso.
 */
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const CATALOGO = [
  { id: "anthropic/claude-opus-4.8",  name: "Claude Opus 4.8",  supported_parameters: ["tools"], pricing: { prompt: "0.000015", completion: "0.000075" }, context_length: 200000 },
  { id: "anthropic/claude-opus-4.6",  name: "Claude Opus 4.6",  supported_parameters: ["tools"], pricing: { prompt: "0.000015", completion: "0.000075" }, context_length: 200000 },
  { id: "anthropic/claude-sonnet-5",  name: "Claude Sonnet 5",  supported_parameters: ["tools"], pricing: { prompt: "0.000003", completion: "0.000015" }, context_length: 200000 },
  { id: "openai/gpt-4o-mini",         name: "GPT-4o mini",      supported_parameters: ["tools"], pricing: { prompt: "0.00000015", completion: "0.0000006" }, context_length: 128000 },
  { id: "z-ai/glm-5:free",            name: "GLM 5 free",       supported_parameters: ["tools"], pricing: { prompt: "0", completion: "0" }, context_length: 128000 },
  { id: "meta/llama-4-scout:free",    name: "Llama 4 Scout",    supported_parameters: ["tools"], pricing: { prompt: "0", completion: "0" }, context_length: 64000 },
  { id: "algum/modelo-sem-tools",     name: "Sem tools",        supported_parameters: ["temperature"], pricing: { prompt: "0.000001", completion: "0.000002" }, context_length: 8000 },
];

function carregarModulo(respostaFetch) {
  const janela = {};
  const ctx = {
    window: janela,
    fetch: async () => respostaFetch(),
    console,
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "web", "js", "modelos.js"), "utf8"), ctx);
  return janela.AZ.modelos;
}
const ok = { ok: true, json: async () => ({ data: CATALOGO }) };

(async () => {
  // ---- caminho feliz --------------------------------------------------------
  const m = carregarModulo(() => ok);
  await m.carregar();
  assert.equal(m.origem, "api", "deveria ter usado a API");

  // filtro: modelo sem tool-calling não entra em lugar nenhum
  assert.equal(m.todos.length, 6, "esperava 6 modelos com tools");
  assert.ok(!m.todos.some((x) => x.id.includes("sem-tools")), "modelo sem tools vazou para o catálogo");

  // catálogo completo em ordem alfabética (é assim que se caça um id específico)
  const ids = m.todos.map((x) => x.id);
  assert.deepEqual(ids, ids.slice().sort((a, b) => a.localeCompare(b)), "o catálogo deveria estar em ordem alfabética");

  // ranking: o flagship vem em #1
  assert.equal(m.lista[0].id.split("/")[0], "anthropic", "#1 deveria ser o flagship");
  assert.ok(/opus/.test(m.lista[0].id), "#1 deveria ser um opus");

  // destaques colapsam família (as duas opus viram uma), o catálogo NÃO colapsa
  const opusNosDestaques = m.lista.filter((x) => /claude-opus/.test(x.id));
  assert.equal(opusNosDestaques.length, 1, "destaques deveriam ter uma opus só");
  assert.equal(m.todos.filter((x) => /claude-opus/.test(x.id)).length, 2, "o catálogo deveria manter as duas opus");

  // grátis: detectado por preço zero, não por sufixo do id
  const grupos = m.grupos();
  const gratis = grupos.find((g) => /Grátis/.test(g.titulo));
  assert.ok(gratis, "faltou o grupo de grátis");
  assert.equal(gratis.itens.length, 2, "esperava 2 modelos grátis");
  assert.ok(gratis.itens.every((x) => x.gratis), "grupo de grátis com modelo pago dentro");

  // três grupos, e o catálogo por último (é o mais longo)
  assert.equal(grupos.length, 3, "esperava 3 grupos");
  assert.ok(/Recomendados/.test(grupos[0].titulo) && grupos[0].ranqueado, "o 1º grupo é o ranqueado");
  assert.ok(/Todos/.test(grupos[2].titulo), "o catálogo completo é o último grupo");
  assert.ok(grupos[2].titulo.includes("6"), "o título do catálogo deveria trazer a contagem");

  // rótulos
  assert.ok(m.rotulo(m.lista[0], 0).startsWith("#1 · "), "rótulo ranqueado deveria começar em #1");
  assert.ok(m.rotuloSimples(gratis.itens[0]).endsWith("· free"), "grátis deveria ser marcado no rótulo");

  // ---- rede caída: cai no fallback e continua utilizável ---------------------
  const f = carregarModulo(() => { throw new Error("sem rede"); });
  await f.carregar();
  assert.ok(f.origem.startsWith("fallback"), "deveria ter caído no fallback");
  const gf = f.grupos();
  assert.ok(gf[0].itens.length >= 3, "o fallback ainda precisa render um dropdown usável");
  // preço ausente não é preço zero: o fallback não sabe o que é grátis
  assert.ok(!gf.some((g) => /Grátis/.test(g.titulo)), "fallback não pode anunciar modelo grátis");
  assert.ok(!f.todos.some((x) => x.gratis), "sem pricing da API, nada é grátis");
  // e não repete os mesmos itens em dois grupos
  assert.equal(gf.length, 1, "no fallback o catálogo é a própria lista de destaque");

  // ---- API respondeu, mas nenhum modelo serve -------------------------------
  const v = carregarModulo(() => ({ ok: true, json: async () => ({ data: [CATALOGO[6]] }) }));
  await v.carregar();
  assert.ok(v.origem.startsWith("fallback"), "catálogo sem tool-calling deveria virar fallback");

  console.log("tudo passou");
})();
