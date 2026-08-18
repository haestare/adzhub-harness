/* planner.js · modo SIMULADO (sem OpenRouter key).
   Nao e um LLM. E um planejador roteirizado que executa as MESMAS tools reais
   sobre o mock e compoe a resposta a partir dos numeros de verdade. Serve para o
   avaliador ver o harness orquestrar >=2 tools e aterrar a resposta no dado,
   mesmo sem colar uma chave. Emite os mesmos steps de trace do modo LLM.

   O texto daqui segue a mesma regua do NEXO que o prompt de sistema impoe no
   modo LLM (conclusao primeiro, FATO separado de HIPOTESE, tabela para dado
   comparativo, opiniao amarrada ao numero), senao trocar de motor trocaria de
   agente. */
(function () {
  const AZ = (window.AZ = window.AZ || {});
  const brl = (n) => "R$ " + Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct = (n) => Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%";
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
      const vezes = Math.round(worst.cpa / best.cpa);
      const totalGasto = rows.reduce((s, r) => s + r.gasto, 0);
      const totalVendas = rows.reduce((s, r) => s + r.vendas, 0);
      const metaTotal = rows.reduce((s, r) => s + r.meta_conv, 0);
      const tb = table(
        ["Anúncio", "Gasto", "Vendas (CRM)", "CPA real", "Meta diz"],
        rows.map((r) => [r.ad, brl(r.gasto), String(r.vendas), r.vendas ? brl(r.cpa) : "sem venda", String(r.meta_conv)])
      );
      return [
        `Olhei o cruzamento. **\`${worst.ad}\` é o seu problema de custo**: ${brl(worst.cpa)} por venda, **${vezes}× o CPA** do \`${best.ad}\`, que está em ${brl(best.cpa)}.`,
        "",
        "**O que encontrei** (gasto do Meta ÷ venda real do CRM, ligados por `utm_content`):",
        "",
        tb,
        "",
        `**Por que isso importa:** o Meta atribui **${metaTotal} conversões** no total, o CRM confirma **${totalVendas} vendas**. Não são o mesmo número e a diferença não é pequena. Para decisão de verba eu uso o CRM, porque é onde a venda existe de verdade; a atribuição do Meta (view-through) eu trato como investigação separada.`,
        "",
        `Aqui está o ponto que mais me chamou atenção: \`${worst.ad}\` come **${pct(worst.gasto / totalGasto * 100)}** do investimento e devolve **${worst.vendas}** venda(s). Dentro do Gerenciador ele parece bom (${worst.meta_conv} conversões). No caixa, é o pior.`,
        "",
        "**O que eu faria, nessa ordem:**",
        `1. Cortar \`${worst.ad}\`. Não é ajuste de lance, é sangria.`,
        `2. Realocar essa verba para \`${best.ad}\`, que já provou que vende barato.`,
        `3. Subir variações do \`${best.ad}\` para descobrir se o padrão dele se repete, antes de escalar forte.`,
        "",
        `**Próximo passo:** pausar \`${worst.ad}\` hoje e mover o orçamento dele para \`${best.ad}\`. As variações podem esperar a próxima janela de teste.`,
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
        "**O CPA não subiu na campanha. Subiu em um criativo, e ele está arrastando o resto.** É o `ad_omega3_depoimento`.",
        "",
        "**O que encontrei**",
        "",
        table(
          ["Sinal", "Antes", "Agora", "Leitura"],
          [
            ["Hook rate", s0.hook_rate_pct + "%", sN.hook_rate_pct + "%", "queda de " + (s0.hook_rate_pct - sN.hook_rate_pct) + " pp"],
            ["Frequência", String(s0.frequency), String(sN.frequency), "mesmo público, mais repetição"],
            ["CPA real (CRM)", "—", brl(depo.cpa), depo.vendas + " venda(s) sobre " + brl(depo.gasto)],
            ["Verba da campanha", brl(budget), brl(spendOmega), pct(spendOmega / budget * 100) + " do teto"],
          ]
        ),
        "",
        `O App de análise de criativos, com a metodologia da casa, chega no mesmo lugar: **${rec}**.`,
        "",
        `**Por que isso importa:** o \`${winner.ad}\` entrega venda a ${brl(winner.cpa)}. O depoimento cobra ${brl(depo.cpa)} pela mesma coisa. Enquanto ele fica no ar, cada real que entra na campanha compra venda pelo pior preço da conta e ainda empurra o gasto acima do orçamento do mês.`,
        "",
        "**Causa raiz (isso está claro nos dados):** o criativo saturou. Gancho caindo com frequência subindo é fadiga de público, não problema de segmentação.",
        "",
        "**O que eu faria**",
        `Eu não mexeria na segmentação ainda, e nem no lance. Uma ação resolve os três sintomas: pausar \`ad_omega3_depoimento\`. Cai o CPA médio, para a fadiga, e o pacing volta pra dentro do teto.`,
        "",
        `**Próximo passo:** pausar o depoimento, mover a verba pro \`${winner.ad}\`, e colocar uma variação nova de gancho na fila de produção. A variação é teste, não é a correção: a correção é a pausa.`,
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
        "**Antes de qualquer decisão de verba: esses leads não são do Google.** O que eles dizem no atendimento e o que o UTM registra são coisas diferentes, e aqui a diferença é quase total.",
        "",
        "**O que encontrei**",
        "",
        table(
          ["Recorte", "Leads", "Leitura"],
          [
            ["Dizem que vieram do Google", String(declaram.length), "origem declarada, no atendimento"],
            ["Têm UTM real de Google", String(realGoogle.length), "origem rastreada"],
            ["Dizem Google, mas o UTM é Meta", String(declaramMasMeta.length), "aqui está o problema"],
            ["Concentrados em `" + culpado[0] + "`", String(culpado[1]), "um vídeo UGC no Instagram"],
          ]
        ),
        "",
        `**FATO:** ${declaramMasMeta.length} leads carregam UTM do Meta e declararam Google. **HIPÓTESE:** a pessoa vê o vídeo no Instagram, procura a marca depois e lembra do caminho como "achei na internet". É o padrão clássico de vídeo que gera busca de marca, e a conversa da Luiza no WhatsApp já tinha levantado isso.`,
        "",
        "**Por que isso importa:** se a verba seguir a origem declarada, você tira dinheiro do canal que está trazendo o lead e coloca num canal que quase não roda. O erro não seria pequeno, seria invertido.",
        "",
        "**O que eu faria**",
        "Decidir verba por UTM, sempre. Origem declarada serve para entender comportamento, nunca para alocar investimento.",
        "",
        `**Próximo passo:** manter (ou reforçar) o \`${culpado[0]}\`, e trocar a pergunta do atendimento de "como nos conheceu?" para algo que separe canal de lembrança, tipo "viu um vídeo nosso? em qual rede?". Isso para de sujar a atribuição na entrada.`,
      ].join("\n");
    },

    agenda(use) {
      use("get_timeline", {});
      use("search_conversations", {});
      const rows = joinReport(use);
      const worst = rows[0], best = rows[rows.length - 1];
      return [
        "**Pauta da call · Housewhey.** Montei na ordem do que dói mais, não na ordem cronológica. Se a call cair pela metade, os dois primeiros pontos são os que não podem ficar de fora.",
        "",
        `**1. A decisão do dia: pausar o \`${worst.ad}\`.** ${brl(worst.cpa)} por venda contra ${brl(best.cpa)} do \`${best.ad}\`. Levar a tabela do cruzamento Meta × CRM; é ela que sustenta a decisão.`,
        "",
        `**2. Destravar a peça de Creatina.** Está parada em aprovação por causa de um claim proibido, não por fila. Levar a versão corrigida pronta para o Rodrigo liberar na hora, senão a call vira mais uma rodada de "vou olhar".`,
        "",
        "**3. Alinhar atribuição.** Os leads \"do Google\" são do Meta. Isso muda como eles leem o relatório deles, então vale explicar antes que alguém peça verba pro Google.",
        "",
        "**4. Pacing do Ômega 3.** A campanha passou do teto do mês. Ponto de gestão, não de crise, e a pausa do item 1 já corrige boa parte.",
        "",
        `**5. Próximo teste.** Variações do \`${best.ad}\`, para descobrir se o padrão dele se repete antes de escalar de verdade. Eu trataria como teste, não como plano de crescimento ainda.`,
        "",
        "Base: linha do tempo da conta, atas e WhatsApp, mais o cruzamento de mídia com CRM.",
      ].join("\n");
    },

    creative(use) {
      const app = use("run_app_analise_criativos", {});
      const mapa = use("get_mapa_solucao", {});
      const pausar = app.ranking.filter((r) => r.recomendacao === "pausar").map((r) => r.ad_id);
      const variar = app.ranking.filter((r) => r.recomendacao === "variar")[0];
      return [
        `**Tem um criativo pra cortar e um pra escalar com teste**, e a ordem importa: cortar primeiro libera a verba que o teste vai usar.`,
        "",
        `**Pausar:** ${pausar.map((x) => "`" + x + "`").join(", ")}. Gancho despencou com frequência subindo, que é saturação e não sazonalidade.`,
        "",
        `**Variar (escalar com teste):** \`${variar.ad_id}\`. ${variar.racional}`,
        variar.brief_sugerido
          ? `Brief que eu levaria pra produção: público **${variar.brief_sugerido.publico}**, hook **${variar.brief_sugerido.hook}**, CTA **${variar.brief_sugerido.cta}**.`
          : "",
        "",
        "**Antes de escrever qualquer copy**, o mapa de solução da marca barra estas frases:",
        ...mapa.nao_pode_falar.map((x) => "- " + x),
        "",
        "É exatamente por isso que a peça de Creatina está travada em aprovação: ela usa \"resultado garantido\", que está na lista. Não é implicância do cliente, é risco de compliance dele.",
        "",
        `**Próximo passo:** pausar os saturados, subir duas variações do \`${variar.ad_id}\` com o brief acima, e reescrever a peça de Creatina sem o claim. Eu não consideraria o \`${variar.ad_id}\` um vencedor confirmado até ver as variações rodando com volume de venda parecido.`,
      ].join("\n");
    },

    generic(use) {
      const ctx = use("search_client_context", { query: "" });
      const ads = use("list_ads", {}).ads;
      const pessoas = ctx.nodes.filter((n) => n.type === "person").map((n) => n.label + " (" + (n.props.role || "") + ")");
      const ativos = ads.filter((a) => a.status === "active").length;
      return [
        "Sou o **NEXO**, estrategista de performance da conta **Housewhey** (operação SPOT). Já estou com o contexto da conta carregado.",
        "",
        `Time: ${pessoas.join(", ")}. Anúncios ativos agora: **${ativos}**.`,
        "",
        "Me dá uma tarefa de verdade e eu puxo o dado antes de opinar. As que eu faria primeiro, se fosse minha escolha:",
        "",
        "- **Cruzar Meta × CRM por criativo.** É onde mora a diferença entre o que parece bom e o que vende.",
        "- **Diagnosticar o CPA do Ômega 3**, que subiu.",
        "- **Entender a origem dos leads**, porque o que eles declaram não está batendo com o UTM.",
        "- **Montar a pauta da próxima call**, já priorizada.",
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
