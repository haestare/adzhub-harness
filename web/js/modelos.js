/* modelos.js · catálogo de modelos da OpenRouter, em três grupos:
 * recomendados (ranqueados, #1 = mais forte), grátis, e o catálogo inteiro.
 *
 * 🔴 A LISTA VEM DA API, NÃO DA MINHA CABEÇA. `GET /api/v1/models` é público (não
 * precisa de key) e roda no browser do avaliador. Fixar IDs à mão envelhece rápido:
 * um slug errado no dropdown vira 400 na cara de quem está avaliando. Se a rede
 * falhar, cai no FALLBACK abaixo e a demo continua utilizável.
 *
 * ⚠️ "Força" não é um campo que a API devolve, então o ranking é uma HEURÍSTICA
 * declarada, nesta ordem:
 *   1. família (flagship de fronteira > modelo médio > mini/flash/turbo),
 *   2. preço de saída (proxy de classe: casa de fronteira cobra mais),
 *   3. janela de contexto.
 * A heurística casa por PADRÃO DE NOME (claude-opus, gpt-5, gemini-*-pro…), nunca
 * por versão exata, para continuar valendo quando a próxima versão sair.
 *
 * 🔴 POR QUE TRÊS GRUPOS E NÃO UMA LISTA SÓ (decisão de 19/08): a versão anterior
 * cortava em 12 e ainda colapsava um por família, então `claude-opus-4.6`, `4.8` e
 * `opus-5` viravam UMA linha e o resto do catálogo simplesmente não existia no
 * dropdown. Ranking sem catálogo resolve "qual é o melhor" e quebra "quero ESTE
 * aqui". Catálogo sem ranking faz o avaliador rolar 300 linhas para escolher.
 * Os dois grupos juntos respondem as duas perguntas, e "Outro (digitar id)" cobre
 * o modelo que nasceu depois desta lista.
 */
(function () {
  const AZ = (window.AZ = window.AZ || {});
  const ENDPOINT = "https://openrouter.ai/api/v1/models";

  // usada só quando a API não responde (IDs conferidos na própria OpenRouter)
  const FALLBACK = [
    "anthropic/claude-opus-4.6",
    "deepseek/deepseek-v4-pro",
    "google/gemini-3.5-flash",
    "openai/gpt-4o",
    "openai/gpt-4o-mini",
  ];

  // padrões do mais forte para o mais fraco; o primeiro que casar define o tier
  const TIERS = [
    { re: /claude-(opus|4\.\d*opus)/i,               tier: 0, nota: "flagship Anthropic" },
    { re: /gpt-5(\.\d+)?(-(sol|pro|max))?$/i,        tier: 0, nota: "flagship OpenAI" },
    { re: /gemini-\d+(\.\d+)?-pro/i,                 tier: 0, nota: "flagship Google" },
    { re: /grok-\d+(\.\d+)?$/i,                      tier: 0, nota: "flagship xAI" },
    { re: /deepseek-v\d+-pro/i,                      tier: 0, nota: "topo DeepSeek" },
    { re: /claude-(sonnet|3\.\d-sonnet)/i,           tier: 1, nota: "trabalho pesado, mais barato" },
    { re: /gpt-(4o|4\.1)$/i,                         tier: 1, nota: "geração anterior, sólido" },
    { re: /deepseek-(v\d+|chat|r\d)/i,               tier: 1, nota: "custo-benefício" },
    { re: /llama-\d+(\.\d+)?-(70b|405b|maverick)/i,  tier: 1, nota: "aberto, robusto" },
    { re: /qwen.*(max|plus|\d{2,}b)/i,               tier: 1, nota: "aberto, robusto" },
    { re: /gemini-\d+(\.\d+)?-flash/i,               tier: 2, nota: "rápido e barato" },
    { re: /claude-(haiku|3\.\d-haiku)/i,             tier: 2, nota: "rápido e barato" },
    { re: /(mini|flash|lite|small|turbo|8b|7b)/i,    tier: 3, nota: "econômico" },
  ];
  const classificar = (id) => TIERS.find((t) => t.re.test(id)) || { tier: 2, nota: "" };
  const num = (v) => { const n = parseFloat(v); return isFinite(n) ? n : 0; };

  function normalizar(m) {
    const c = classificar(m.id);
    const p = m.pricing || {};
    return {
      id: m.id,
      nome: m.name || m.id,
      tier: c.tier,
      nota: c.nota,
      saida: num(p.completion) * 1e6,                       // US$ por milhão de tokens
      // ⚠️ preço AUSENTE não é preço zero. Sem esta guarda, as entradas do FALLBACK
      // (que não têm pricing) apareciam etiquetadas "free", ou seja o dropdown
      // prometia custo zero num claude-opus. Só a API diz que algo é grátis.
      gratis: !!m.pricing && num(p.completion) === 0 && num(p.prompt) === 0,
      ctx: m.context_length || 0,
    };
  }
  const porForca = (a, b) => a.tier - b.tier || b.saida - a.saida || b.ctx - a.ctx;

  // "claude-opus-4.8" e "claude-opus-5" são a mesma família para fins de destaque
  function familia(id) {
    const nome = (id.split("/")[1] || id).replace(/[:@].*$/, "");
    return nome
      .replace(/-(\d{4}|\d{2}-\d{2}|latest|preview|beta|exp|fast)$/i, "")
      .replace(/-?\d+(\.\d+)*$/, "");
  }

  AZ.modelos = {
    lista: FALLBACK.map((id) => normalizar({ id })),  // destaques (compatível com o uso antigo)
    todos: FALLBACK.map((id) => normalizar({ id })),
    origem: "fallback",

    async carregar(destaques = 12) {
      try {
        const res = await fetch(ENDPOINT, { headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const { data } = await res.json();
        // só quem sabe chamar tool: o harness inteiro depende disso, e um modelo
        // sem tool-calling responderia texto bonito sem nunca tocar numa tool.
        const comTools = (data || []).filter((m) =>
          m && m.id && Array.isArray(m.supported_parameters) && m.supported_parameters.includes("tools"));
        if (!comTools.length) throw new Error("nenhum modelo com tools");

        const ranqueados = comTools.map(normalizar).sort(porForca);
        const vistas = new Set(), topo = [];
        for (const m of ranqueados) {
          const f = familia(m.id);
          if (vistas.has(f)) continue;
          vistas.add(f); topo.push(m);
          if (topo.length >= destaques) break;
        }
        this.lista = topo;
        this.todos = ranqueados.slice().sort((a, b) => a.id.localeCompare(b.id));
        this.origem = "api";
        return this.lista;
      } catch (e) {
        this.origem = "fallback: " + ((e && e.message) || e);
        return this.lista;
      }
    },

    // o que o dropdown desenha, na ordem
    grupos() {
      const gratis = this.todos.filter((m) => m.gratis);
      const g = [{ titulo: "Recomendados · ranqueados (#1 = mais forte)", itens: this.lista, ranqueado: true }];
      if (gratis.length) g.push({ titulo: `Grátis · custo zero na sua key (${gratis.length})`, itens: gratis });
      // no fallback o catálogo É a lista de destaque; repetir os mesmos 5 itens em
      // dois grupos só faz o dropdown parecer maior do que é
      const extra = this.todos.some((m) => !this.lista.some((d) => d.id === m.id));
      if (extra) g.push({ titulo: `Todos com tool-calling (${this.todos.length})`, itens: this.todos });
      return g;
    },

    // "#1 · anthropic/claude-opus-4.6 (flagship Anthropic) · $75.00/M"
    rotulo(m, i) {
      const preco = m.saida ? ` · $${m.saida.toFixed(2)}/M` : "";
      return `#${i + 1} · ${m.id}${m.nota ? " (" + m.nota + ")" : ""}${preco}`;
    },
    // no catálogo o id manda; preço só quando existe, para a linha não ficar longa
    rotuloSimples(m) {
      return m.gratis ? `${m.id} · free` : `${m.id}${m.saida ? ` · $${m.saida.toFixed(2)}/M` : ""}`;
    },
  };
})();
