/* tools.js · as 7 tools do harness sobre o dataset mock (Housewhey).
   Classic script (roda de file://). Anexa em window.AZ.
   Cada tool: entrada = objeto de args, saida = objeto JSON-serializavel.
   Erro sempre { ok:false, error:"..." }.

   A TAG DE CAMADA e o que a tese defende, visivel no trace:
     - api         : dado cru da operacao (o LLM chama quando precisa)
     - memoria     : supercerebro (grafo + linha do tempo + conversas) = ambiente
     - app         : metodologia empacotada (skill; o harness chama, nao reimplementa)
*/
(function () {
  const AZ = (window.AZ = window.AZ || {});
  const CLIENT = "cli_housewhey";
  const D = () => window.ADZHUB_DATA;

  const norm = (s) =>
    (s == null ? "" : String(s))
      .normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const terms = (q) => norm(q).split(/[^a-z0-9_]+/).filter((t) => t.length > 2);

  function flattenAds() {
    const out = [];
    for (const c of D().meta.campaigns)
      for (const a of c.adsets || [])
        for (const ad of a.ads || [])
          out.push({
            ...ad,
            campaign_id: c.campaign_id, campaign: c.name,
            adset_id: a.adset_id, adset: a.name,
            daily_budget_brl: a.daily_budget_brl,
            monthly_budget_brl: c.monthly_budget_brl,
          });
    return out;
  }

  // ------------------------------------------------------------ MEMORIA (grafo)
  function search_client_context(args = {}) {
    const g = D().graph;
    const ts = terms(args.query || "");
    const nodeText = (n) => norm(n.label + " " + n.type + " " + JSON.stringify(n.props || {}));
    let picked;
    if (!ts.length) {
      picked = g.nodes.filter(
        (n) => n.type === "hub" || n.type === "person" ||
          (n.type === "campaign" && (n.props || {}).status !== "encerrada"));
    } else {
      const scored = g.nodes
        .map((n) => ({ n, s: ts.reduce((a, t) => a + (nodeText(n).includes(t) ? 1 : 0), 0) }))
        .filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
      picked = scored.map((x) => x.n);
      // ancoragem: sempre inclui o cliente e as pessoas do time
      for (const n of g.nodes)
        if ((n.id === CLIENT || n.type === "person") && !picked.includes(n)) picked.push(n);
    }
    picked = picked.slice(0, 12);
    const ids = new Set(picked.map((n) => n.id));
    // traz vizinhos 1-hop das arestas relevantes
    const edges = g.edges.filter((e) => ids.has(e.from) || ids.has(e.to));
    const neighborIds = new Set();
    edges.forEach((e) => { neighborIds.add(e.from); neighborIds.add(e.to); });
    const nodes = g.nodes.filter((n) => ids.has(n.id) || neighborIds.has(n.id)).slice(0, 16);
    return {
      client_id: CLIENT,
      nodes: nodes.map((n) => ({ id: n.id, type: n.type, label: n.label, props: n.props || {} })),
      edges,
      note: "Recorte do grafo relevante para a consulta (nao e o grafo inteiro).",
    };
  }

  // -------------------------------------------------------- MEMORIA (temporal)
  function get_timeline(args = {}) {
    let ev = D().timeline.events.slice();
    if (args.since) ev = ev.filter((e) => e.occurred_at >= args.since);
    if (args.until) ev = ev.filter((e) => e.occurred_at <= args.until);
    if (!args.since && !args.until) ev = ev.slice(-6); // recente por padrao
    return { client_id: CLIENT, events: ev };
  }

  // -------------------------------------------------------- MEMORIA (conversas)
  function search_conversations(args = {}) {
    const ts = terms(args.query || "");
    const blob = (t) =>
      norm(t.titulo + " " + (t.bullets || []).join(" ") +
        " " + (t.mensagens || []).map((m) => m.texto).join(" "));
    let th = D().conversas.threads;
    if (ts.length) {
      const m = th.filter((t) => ts.some((k) => blob(t).includes(k)));
      if (m.length) th = m;
    }
    return { client_id: CLIENT, threads: th };
  }

  // ------------------------------------------------------------- API (Meta Ads)
  function list_ads(args = {}) {
    const ads = flattenAds().map((a) => ({
      ad_id: a.ad_id, ad_name: a.ad_name, campaign: a.campaign, adset: a.adset,
      creative_type: a.creative_type, audience: a.audience, status: a.status,
      spend_brl: a.spend_brl, impressions: a.impressions, clicks: a.clicks,
      ctr_pct: a.ctr_pct, cpc_brl: a.cpc_brl, hook_rate_pct: a.hook_rate_pct,
      frequency: a.frequency, meta_reported_conversions: a.meta_reported_conversions,
      daily_budget_brl: a.daily_budget_brl, monthly_budget_brl: a.monthly_budget_brl,
      utm_content: a.utm_content,
    }));
    return {
      client_id: CLIENT, currency: D().meta.currency, period: D().meta.period,
      note: "meta_reported_conversions e o que o Gerenciador atribui; a venda real esta no CRM.",
      ads,
    };
  }

  function get_ad_insights(args = {}) {
    const ad = flattenAds().find((a) => a.ad_id === args.ad_id);
    if (!ad) return { ok: false, error: `ad_id '${args.ad_id}' nao encontrado` };
    const s = ad.insights && ad.insights.series_weekly || [];
    let trend = null;
    if (s.length >= 2) {
      trend = {
        hook_rate_delta_pp: +(s[s.length - 1].hook_rate_pct - s[0].hook_rate_pct).toFixed(1),
        frequency_delta: +(s[s.length - 1].frequency - s[0].frequency).toFixed(1),
      };
    }
    return {
      ad_id: ad.ad_id, ad_name: ad.ad_name, campaign: ad.campaign, adset: ad.adset,
      status: ad.status, spend_brl: ad.spend_brl, hook_rate_pct: ad.hook_rate_pct,
      frequency: ad.frequency, series_weekly: s, trend,
    };
  }

  // ----------------------------------------------------------------- API (CRM)
  function get_leads(args = {}) {
    let ls = D().crm.leads.slice();
    if (args.since) ls = ls.filter((l) => l.created_at >= args.since);
    if (args.until) ls = ls.filter((l) => l.created_at <= args.until);
    if (args.utm_content) ls = ls.filter((l) => l.utm_content === args.utm_content);
    const by = {};
    let value = 0;
    for (const l of ls) { by[l.status] = (by[l.status] || 0) + 1; value += l.value_brl || 0; }
    return {
      client_id: CLIENT,
      summary: { count: ls.length, by_status: by, total_value_brl: value },
      note: "Cada lead traz utm_content (=ad_id) e origem_declarada (o que o lead diz no atendimento).",
      leads: ls,
    };
  }

  // --------------------------------------------------------------- APP (skills)
  function run_app_analise_criativos() {
    const a = D().appCriativos;
    return { app: a.app, metodologia: a.metodologia, ranking: a.ranking, pecas_bloqueadas: a.pecas_bloqueadas };
  }
  function get_mapa_solucao() { return D().mapa; }

  // --------------------------------------------------------------- registry
  const REG = {
    search_client_context: { fn: search_client_context, layer: "memoria", label: "Supercérebro · grafo" },
    get_timeline:          { fn: get_timeline,          layer: "memoria", label: "Supercérebro · timeline" },
    search_conversations:  { fn: search_conversations,  layer: "memoria", label: "Memória de canal" },
    list_ads:              { fn: list_ads,              layer: "api",     label: "API · Meta Ads" },
    get_ad_insights:       { fn: get_ad_insights,       layer: "api",     label: "API · Meta Ads" },
    get_leads:             { fn: get_leads,             layer: "api",     label: "API · CRM" },
    run_app_analise_criativos: { fn: run_app_analise_criativos, layer: "app", label: "App · Análise de criativos" },
    get_mapa_solucao:      { fn: get_mapa_solucao,      layer: "app",     label: "App · Mapa de solução" },
  };

  AZ.toolMeta = Object.fromEntries(Object.entries(REG).map(([k, v]) => [k, { layer: v.layer, label: v.label }]));

  // dispatch com validacao de allowlist
  AZ.callTool = function (name, args) {
    const entry = REG[name];
    if (!entry) return { ok: false, error: `tool '${name}' fora da allowlist` };
    try { return entry.fn(args || {}); }
    catch (e) { return { ok: false, error: String(e && e.message || e) }; }
  };

  // specs no formato OpenAI (function calling) para o LLM
  const P = (props, required) => ({ type: "object", properties: props, required: required || [] });
  const s = (type, description) => ({ type, description });
  AZ.toolSpecs = [
    { type: "function", function: { name: "search_client_context",
      description: "Supercérebro (grafo). Nós e arestas relevantes da conta: pessoas, campanhas, canais, tarefas, ativos. Use para saber QUEM e O QUÊ existe na operação.",
      parameters: P({ query: s("string", "termos da intenção, ex: 'creatina aprovação' ou 'ômega 3'") }, []) } },
    { type: "function", function: { name: "get_timeline",
      description: "Supercérebro (linha do tempo). Eventos da conta em ordem, em linguagem de tarefa. Use para reconstruir o histórico recente (pauta, contexto de diagnóstico).",
      parameters: P({ since: s("string", "ISO date opcional"), until: s("string", "ISO date opcional") }, []) } },
    { type: "function", function: { name: "search_conversations",
      description: "Memória de canal (reunião + WhatsApp). Atas e mensagens que explicam aprovações e alinhamentos. Use para achar o PORQUÊ de algo estar travado.",
      parameters: P({ query: s("string", "termos, ex: 'aprovação creatina' ou 'origem leads'") }, []) } },
    { type: "function", function: { name: "list_ads",
      description: "API Meta Ads. Anúncios com gasto, impressões, cliques, hook_rate, frequência e verba. NÃO traz venda real (isso está no CRM). Use para saber gasto por anúncio.",
      parameters: P({ since: s("string", "opcional"), until: s("string", "opcional") }, []) } },
    { type: "function", function: { name: "get_ad_insights",
      description: "API Meta Ads. Série semanal de um anúncio (hook_rate e frequência ao longo do tempo) + tendência. Use para detectar saturação/fadiga de criativo.",
      parameters: P({ ad_id: s("string", "id do anúncio, ex: 'ad_omega3_depoimento'") }, ["ad_id"]) } },
    { type: "function", function: { name: "get_leads",
      description: "API CRM. Leads com status (lead/agendamento/venda/perdido), value_brl, utm_content (=ad_id) e origem_declarada. É AQUI que está a venda real. Cruze utm_content com list_ads para custo por venda.",
      parameters: P({ since: s("string", "opcional"), until: s("string", "opcional"), utm_content: s("string", "opcional: filtra por anúncio (=ad_id)") }, []) } },
    { type: "function", function: { name: "run_app_analise_criativos",
      description: "App de metodologia (skill). Ranking de criativos com nota de gancho/CTA e recomendação (seguir/pausar/variar) + brief sugerido. O harness CHAMA o app; não reimplemente a metodologia no seu raciocínio.",
      parameters: P({}, []) } },
    { type: "function", function: { name: "get_mapa_solucao",
      description: "App de contexto de marca. Oferta, promessa, prova, objeções, tom de voz e o que NÃO pode falar (restrições). Use antes de propor copy/CTA ou julgar uma peça.",
      parameters: P({}, []) } },
  ];
})();
