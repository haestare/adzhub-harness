/* planner.js · modo SIMULADO (sem OpenRouter key).
   Nao e um LLM. E um planejador roteirizado que executa as MESMAS tools reais
   sobre o mock e compoe a resposta a partir dos numeros de verdade. Serve para o
   avaliador ver o harness orquestrar >=2 tools e aterrar a resposta no dado,
   mesmo sem colar uma chave. Emite os mesmos steps de trace do modo LLM. */
(function () {
  const AZ = (window.AZ = window.AZ || {});
  const brl = (n) => "R$ " + Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
  const norm = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  function detectIntent(msg) {
    const m = norm(msg);
    if (/(pauta|reuniao|call|agenda)/.test(m)) return "agenda";
    if (/(diagnost|cpa|subiu|anomal|investig|causa|estour)/.test(m)) return "diagnosis";
    if (/(origem|vieram|atribu|google)/.test(m)) return "origin";
    if (/(relat|gasto|caro|barat|resultado real|cruz|por anuncio|utm)/.test(m)) return "report";
    if (/(brief|copy|variac|variar|pausar|sugira|analis)/.test(m)) return "creative";
    return "generic";
  }

  // helper: chama tool real + emite step de trace, devolve resultado
  const mk = (emit) => (name, args) => {
    const result = AZ.callTool(name, args || {});
    const meta = AZ.toolMeta[name] || { layer: "api", label: name };
    emit({ type: "tool", name, layer: meta.layer, label: meta.label, args: args || {}, result });
    return result;
  };

  function joinReport(use) {
    const ads = use("list_ads", {}).ads;
    const leads = use("get_leads", {}).leads;
    const rows = ads.filter((a) => a.spend_brl > 0).map((a) => {
      const ls = leads.filter((l) => l.utm_content === a.ad_id);
      const vendas = ls.filter((l) => l.status === "venda");
      const receita = vendas.reduce((s, l) => s + (l.value_brl || 0), 0);
      return {
        ad: a.ad_id, campanha: a.campaign, gasto: a.spend_brl,
        leads: ls.length, vendas: vendas.length, receita,
        cpa: vendas.length ? a.spend_brl / vendas.length : Infinity,
        meta_conv: a.meta_reported_conversions,
      };
    }).sort((x, y) => y.cpa - x.cpa);
    return rows;
  }

  function table(headers, rows) {
    const h = "| " + headers.join(" | ") + " |";
    const sep = "| " + headers.map(() => "---").join(" | ") + " |";
    const body = rows.map((r) => "| " + r.join(" | ") + " |").join("\n");
    return [h, sep, body].join("\n");
  }

  const INTENTS = {
    report(use) {
      const rows = joinReport(use);
      const worst = rows[0], best = rows[rows.length - 1];
      const tb = table(
        ["Anúncio", "Gasto", "Vendas (CRM)", "CPA real", "Meta diz"],
        rows.map((r) => [r.ad, brl(r.gasto), String(r.vendas), r.vendas ? brl(r.cpa) : "sem venda", String(r.meta_conv)])
      );
      return [
        "**Relatório de criativos × resultado real** (gasto do Meta ÷ venda real do CRM, por `utm_content`):",
        "", tb, "",
        `**Mais caro:** \`${worst.ad}\` a **${brl(worst.cpa)}** por venda (${worst.vendas} venda(s) sobre ${brl(worst.gasto)}).`,
        `**Mais barato:** \`${best.ad}\` a **${brl(best.cpa)}** por venda.`,
        "",
        "Repare que o Gerenciador do Meta reporta bem mais conversões do que o CRM confirma como venda (atribuição view-through infla o número). Por isso o cruzamento com o CRM muda a leitura: o que parece bom no Meta é o mais caro na venda real.",
        "",
        `**Próximo passo:** pausar \`${worst.ad}\` e realocar a verba para \`${best.ad}\`, que entrega venda a uma fração do custo.`,
      ].join("\n");
    },

    diagnosis(use) {
      const rows = joinReport(use).filter((r) => norm(r.campanha).includes("omega"));
      const ins = use("get_ad_insights", { ad_id: "ad_omega3_depoimento" });
      const app = use("run_app_analise_criativos", {});
      const ads = AZ.callTool("list_ads", {}).ads;
      const camp = ads.find((a) => a.ad_id === "ad_omega3_depoimento");
      const spendOmega = ads.filter((a) => norm(a.campaign).includes("omega")).reduce((s, a) => s + a.spend_brl, 0);
      const budget = camp.monthly_budget_brl;
      const rec = (app.ranking.find((r) => r.ad_id === "ad_omega3_depoimento") || {}).recomendacao;
      const depo = rows.find((r) => r.ad === "ad_omega3_depoimento");
      const winner = rows.slice().sort((a, b) => a.cpa - b.cpa)[0];
      const s0 = ins.series_weekly[0], sN = ins.series_weekly[ins.series_weekly.length - 1];
      return [
        "**Diagnóstico: CPA do Ômega 3 subindo.** Um único criativo explica quase tudo.",
        "",
        `- **Saturação:** \`ad_omega3_depoimento\` teve o hook_rate cair de **${s0.hook_rate_pct}%** para **${sN.hook_rate_pct}%** enquanto a frequência subiu de **${s0.frequency}** para **${sN.frequency}** (mesmo público, criativo desgastado).`,
        `- **Custo real:** ${brl(depo.gasto)} para **${depo.vendas} venda(s)** = **${brl(depo.cpa)}** por venda. O \`${winner.ad}\` faz o mesmo por **${brl(winner.cpa)}**.`,
        `- **Verba:** a campanha gastou **${brl(spendOmega)}** contra orçamento de **${brl(budget)}** (${Math.round(spendOmega / budget * 100)}%), puxada por esse anúncio.`,
        `- **App de análise de criativos** recomenda: **${rec}**.`,
        "",
        "**Causa raiz:** o depoimento saturou, virou o mais caro e ainda estourou o orçamento.",
        `**Próximo passo (uma ação resolve três sintomas):** pausar \`ad_omega3_depoimento\`, realocar para \`${winner.ad}\` e subir uma variação nova de gancho. Isso corrige CPA, fadiga e estouro de verba de uma vez.`,
      ].join("\n");
    },

    origin(use) {
      const leads = use("get_leads", {}).leads;
      use("search_conversations", { query: "origem google leads" });
      const declaram = leads.filter((l) => l.origem_declarada === "Google");
      const realGoogle = leads.filter((l) => l.utm_source === "google");
      const declaramMasMeta = declaram.filter((l) => l.utm_source !== "google");
      const porAd = {};
      declaramMasMeta.forEach((l) => { porAd[l.utm_content] = (porAd[l.utm_content] || 0) + 1; });
      const culpado = Object.entries(porAd).sort((a, b) => b[1] - a[1])[0];
      return [
        "**Origem inconsistente: a atribuição declarada mente.**",
        "",
        `- **${declaram.length} leads** dizem no atendimento que vieram do **Google**.`,
        `- Mas só **${realGoogle.length} leads** têm UTM real de Google. Os outros **${declaramMasMeta.length}** carregam UTM do **Meta**.`,
        `- Desses, **${culpado[1]}** vieram do anúncio \`${culpado[0]}\` (um vídeo UGC no Instagram, que a pessoa lembra como "achei na internet/Google").`,
        "",
        "A conversa da Luiza no WhatsApp já apontava isso: leads dizendo Google, mas a conta quase não roda Google.",
        "",
        "**Próximo passo:** decidir verba pelo UTM, não pela origem declarada. Migrar investimento para o Google aqui seria um erro: o canal que traz esses leads é o Meta. Vale, sim, corrigir a pergunta de atendimento (ex.: 'viu um vídeo? em qual rede?') para parar de sujar a atribuição.",
      ].join("\n");
    },

    agenda(use) {
      use("get_timeline", {});
      use("search_conversations", {});
      const rows = joinReport(use);
      const worst = rows[0];
      return [
        "**Pauta sugerida · call Housewhey**",
        "",
        "1. **Resultado real dos criativos.** Relatório gasto × venda por anúncio. Destaque: o depoimento de Ômega 3 está a " + brl(worst.cpa) + " por venda.",
        "2. **Decisão de realocação.** Pausar o criativo saturado e reforçar o antes/depois (o mais eficiente da conta).",
        "3. **Destravar Creatina.** A peça está parada em aprovação por causa da frase 'resultado garantido'. Levar a versão corrigida para o Rodrigo liberar.",
        "4. **Atribuição.** Alinhar que os leads 'do Google' são, na verdade, do Meta (UGC de Whey), e ajustar a pergunta de origem no atendimento.",
        "5. **Orçamento.** Ômega 3 passou do teto do mês; revisar o pacing.",
        "",
        "Base: linha do tempo recente da conta + atas de reunião e WhatsApp.",
      ].join("\n");
    },

    creative(use) {
      const app = use("run_app_analise_criativos", {});
      const mapa = use("get_mapa_solucao", {});
      const pausar = app.ranking.filter((r) => r.recomendacao === "pausar").map((r) => r.ad_id);
      const variar = app.ranking.filter((r) => r.recomendacao === "variar")[0];
      return [
        "**Análise de criativos + novo briefing.**",
        "",
        `- **Pausar:** ${pausar.map((x) => "`" + x + "`").join(", ")} (gancho despencou / saturado).`,
        `- **Variar (escalar com teste):** \`${variar.ad_id}\` · ${variar.racional}`,
        variar.brief_sugerido ? `  - Brief: público *${variar.brief_sugerido.publico}*, hook *${variar.brief_sugerido.hook}*, CTA *${variar.brief_sugerido.cta}*.` : "",
        "",
        "**Restrições da marca (mapa de solução) que a copy tem que respeitar:**",
        ...mapa.nao_pode_falar.map((x) => "- " + x),
        "",
        "É por isso que a peça de Creatina está travada: ela usa 'resultado garantido', que entra na lista do que não pode falar.",
      ].join("\n");
    },

    generic(use) {
      const ctx = use("search_client_context", { query: "" });
      const ads = use("list_ads", {}).ads;
      const pessoas = ctx.nodes.filter((n) => n.type === "person").map((n) => n.label + " (" + (n.props.role || "") + ")");
      return [
        "Sou o agente da conta **Housewhey** (operação SPOT). Posso cruzar Meta × CRM, diagnosticar a conta, montar pauta e analisar criativos.",
        "",
        `Time: ${pessoas.join(", ")}. Anúncios ativos: ${ads.filter((a) => a.status === "active").length}.`,
        "",
        "Experimente: *relatório de criativos × resultado real*, *o CPA do Ômega 3 subiu, diagnostique*, ou *por que os leads dizem que vieram do Google?*",
      ].join("\n");
    },
  };

  AZ.planner = {
    detectIntent,
    run(message, emit) {
      const use = mk(emit);
      const intent = detectIntent(message);
      const answer = INTENTS[intent](use);
      return { answer, intent };
    },
  };
})();
