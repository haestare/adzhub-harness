/* modelos.js · catálogo de modelos da OpenRouter, ranqueado do mais forte para o
 * mais fraco (#1 = mais forte).
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

  function ranquear(brutos) {
    return brutos
      .map((m) => {
        const c = classificar(m.id);
        const saida = parseFloat((m.pricing && m.pricing.completion) || 0) * 1e6; // US$/M tokens
        return { id: m.id, nome: m.name || m.id, tier: c.tier, nota: c.nota, saida, ctx: m.context_length || 0 };
      })
      .sort((a, b) => a.tier - b.tier || b.saida - a.saida || b.ctx - a.ctx);
  }

  AZ.modelos = {
    lista: FALLBACK.map((id, i) => ({ id, nome: id, tier: i === 0 ? 0 : 1, nota: "", saida: 0, ctx: 0 })),
    origem: "fallback",

    // busca no browser de quem abre a demo; devolve os N melhores com tool-calling
    async carregar(limite = 12) {
      try {
        const res = await fetch(ENDPOINT, { headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const { data } = await res.json();
        const comTools = (data || []).filter((m) =>
          Array.isArray(m.supported_parameters) && m.supported_parameters.includes("tools"));
        if (!comTools.length) throw new Error("nenhum modelo com tools");
        // um por família, para o dropdown não virar 40 variações do mesmo modelo
        const vistos = new Set(), enxuto = [];
        for (const m of ranquear(comTools)) {
          const fam = m.id.split("/")[1].replace(/[:@].*$/, "").replace(/-(\d{4}|\d{2}-\d{2}|latest|preview|beta)$/i, "");
          if (vistos.has(fam)) continue;
          vistos.add(fam); enxuto.push(m);
          if (enxuto.length >= limite) break;
        }
        this.lista = enxuto; this.origem = "api";
        return this.lista;
      } catch (e) {
        this.origem = "fallback: " + (e && e.message || e);
        return this.lista;
      }
    },

    // "#1 · anthropic/claude-opus-4.6 (flagship Anthropic)"
    rotulo(m, i) {
      const preco = m.saida ? ` · $${m.saida.toFixed(2)}/M` : "";
      return `#${i + 1} · ${m.id}${m.nota ? " (" + m.nota + ")" : ""}${preco}`;
    },
  };
})();
