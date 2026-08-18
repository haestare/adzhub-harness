/* test_uso.js · testa a contabilidade de tokens SEM REDE e SEM CHAVE.
   Existe por causa de um modo de falhar silencioso: no streaming, o chunk que
   traz o `usage` chega com `choices: []`, entao qualquer leitor que descarte o
   chunk por "nao tem delta" perde o numero e NADA quebra: a resposta sai
   inteira, o medidor so mostra estimativa pra sempre. Aqui um fetch falso
   entrega exatamente esse formato. */
const fs = require('fs'), vm = require('vm');
const ROOT = __dirname + '/..';
const ctx = { console, location: { origin: '' }, setTimeout, JSON, Math, Date, TextDecoder };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['web/data.js', 'web/js/tools.js', 'web/js/usage.js', 'web/js/nexo.js', 'web/js/planner.js', 'web/js/openrouter.js', 'web/js/harness.js']) {
  vm.runInContext(fs.readFileSync(ROOT + '/' + f, 'utf8'), ctx, { filename: f });
}
const AZ = ctx.AZ;

(async () => {
  let falhas = 0;
  const ok = (cond, nome, extra) => { console.log((cond ? '  ok  ' : '  FALHOU  ') + nome + (cond ? '' : ' -> ' + extra)); if (!cond) falhas++; };

  // --- fetch falso que fala SSE como a OpenRouter --------------------------
  function sse(linhas) {
    const bytes = new TextEncoder().encode(linhas.map((l) => 'data: ' + JSON.stringify(l) + '\n\n').join('') + 'data: [DONE]\n\n');
    let entregue = false;
    return {
      ok: true, status: 200,
      body: { getReader: () => ({ read: async () => (entregue ? { done: true } : (entregue = true, { done: false, value: bytes })) }) },
    };
  }

  console.log('\n# 1. streaming remonta texto, tool_calls fatiados e captura o usage do ultimo chunk');
  ctx.fetch = async () => sse([
    { choices: [{ delta: { content: 'olhei o ' } }] },
    { choices: [{ delta: { content: 'cruzamento' } }] },
    { choices: [{ delta: { tool_calls: [{ index: 0, id: 'c1', function: { name: 'list_' } }] } }] },
    { choices: [{ delta: { tool_calls: [{ index: 0, function: { name: 'ads', arguments: '{"sta' } }] } }] },
    { choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: 'tus":"active"}' } }] } }] },
    { choices: [], usage: { prompt_tokens: 1234, completion_tokens: 56, total_tokens: 1290, cost: 0.0031 } },
  ]);
  let pedacos = 0;
  let r = await AZ.llm.chat({ apiKey: 'k', model: 'm', messages: [], tools: [], onDelta: () => pedacos++ });
  ok(r.ok && r.message.content === 'olhei o cruzamento', 'texto remontado', JSON.stringify(r.message && r.message.content));
  ok(pedacos === 2, 'onDelta chamado por pedaco', pedacos);
  const tc = r.message.tool_calls && r.message.tool_calls[0];
  ok(tc && tc.function.name === 'list_ads', 'nome da tool remontado', tc && tc.function.name);
  ok(tc && tc.function.arguments === '{"status":"active"}', 'argumentos remontados', tc && tc.function.arguments);
  ok(!!r.usage && r.usage.total_tokens === 1290, 'usage capturado do chunk sem choices (o bug silencioso)', JSON.stringify(r.usage));

  console.log('\n# 2. usage da API vira numero MEDIDO, nao estimado');
  const u = AZ.tokens.daApi(r.usage);
  ok(u.entrada === 1234 && u.saida === 56 && u.total === 1290, 'campos normalizados', JSON.stringify(u));
  ok(u.custo === 0.0031 && u.estimado === false, 'custo lido e marcado como medido', JSON.stringify(u));

  console.log('\n# 3. loop ReAct acumula uma medicao POR CHAMADA e soma o turno');
  const respostas = [
    { ok: true, message: { content: '', tool_calls: [{ id: 't1', function: { name: 'list_ads', arguments: '{}' } }] }, usage: { prompt_tokens: 1000, completion_tokens: 20, total_tokens: 1020, cost: 0.001 } },
    { ok: true, message: { content: 'resposta final', tool_calls: null }, usage: { prompt_tokens: 3000, completion_tokens: 200, total_tokens: 3200, cost: 0.004 } },
  ];
  let i = 0;
  AZ.llm.chat = async () => respostas[i++];
  let passos = [];
  let out = await AZ.Harness.run({ message: 'relatorio', mode: 'llm', apiKey: 'k', model: 'm', emit: (s) => passos.push(s) });
  const usos = passos.filter((s) => s.type === 'uso');
  ok(out.answer === 'resposta final', 'resposta devolvida', out.answer);
  ok(usos.length === 2, 'um passo de custo por chamada de LLM', usos.length);
  ok(out.uso.total === 4220 && out.uso.entrada === 4000 && out.uso.saida === 220, 'totais do turno somados', JSON.stringify(out.uso));
  ok(Math.abs(out.uso.custo - 0.005) < 1e-9, 'custo somado', out.uso.custo);
  ok(out.uso.estimado === false, 'turno inteiro medido', out.uso.estimado);

  console.log('\n# 4. provedor que NAO devolve usage cai na estimativa, e isso fica marcado');
  i = 0;
  AZ.llm.chat = async () => ({ ok: respostas[i] ? true : false, message: (respostas[i++] || {}).message });
  passos = [];
  out = await AZ.Harness.run({ message: 'relatorio', mode: 'llm', apiKey: 'k', model: 'm', emit: (s) => passos.push(s) });
  ok(out.uso.estimado === true, 'turno marcado como estimado', JSON.stringify(out.uso));
  ok(out.uso.entrada > 0, 'estimativa de entrada nao e zero', out.uso.entrada);

  console.log('\n# 5. modo simulado: estimativa reconstroi uma chamada por tool + o fechamento');
  passos = [];
  out = await AZ.Harness.run({ message: 'Cruze o gasto por anuncio com as vendas do CRM', mode: 'sim', emit: (s) => passos.push(s) });
  const tools = passos.filter((s) => s.type === 'tool').length;
  const usos5 = passos.filter((s) => s.type === 'uso');
  ok(usos5.length === tools + 1, 'uma chamada por tool mais a de fechamento', usos5.length + ' vs ' + (tools + 1));
  ok(out.uso.estimado === true, 'sempre marcado como estimativa (nao ha LLM aqui)', out.uso.estimado);
  const cresce = usos5.every((p, k) => k === 0 || p.uso.entrada >= usos5[k - 1].uso.entrada);
  ok(cresce, 'entrada cresce a cada passo (o loop reenvia tudo que veio antes)', usos5.map((p) => p.uso.entrada).join('<'));
  ok(out.uso.custo === 0, 'estimativa nao inventa custo em dinheiro', out.uso.custo);

  console.log('\n# 6. formatacao');
  ok(AZ.tokens.fmt(999) === '999' && AZ.tokens.fmt(17600) === '17,6k', 'fmt curto e em k', AZ.tokens.fmt(17600));
  ok(AZ.tokens.fmtCusto(0) === null, 'custo zero nao vira texto', AZ.tokens.fmtCusto(0));
  ok(AZ.tokens.fmtCusto(0.0031) === 'US$ 0,0031', 'custo pequeno com 4 casas', AZ.tokens.fmtCusto(0.0031));

  console.log('\n' + (falhas ? falhas + ' FALHA(S)' : 'tudo passou'));
    process.exit(falhas ? 1 : 0);

})();
