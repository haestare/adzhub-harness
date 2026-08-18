/* harness.js · o RUNTIME do agente (a tese em código).
   Três mecanismos, um por camada do domínio:
     1) MEMÓRIA COMO AMBIENTE  -> hidrata um "pacote de contexto" do supercérebro
        (grafo + linha do tempo) ANTES do loop e injeta no prompt. Não é o LLM que
        precisa lembrar de chamar a memória: ela é ambiente.
     2) APIs COMO TOOLS        -> loop ReAct: o LLM decide chamar list_ads/get_leads/etc.
     3) APPS COMO SKILLS       -> tools também, mas de metodologia encapsulada; o harness
        chama o app, não reimplementa a metodologia no prompt.
   Guard-rails de harness (não de chatbot): allowlist de tools, max_steps, validação
   de args, e todo passo observável no trace. */
(function () {
  const AZ = (window.AZ = window.AZ || {});

  AZ.HARNESS_CONFIG = {
    maxSteps: 8,
    get allowlist() { return AZ.toolSpecs.map((t) => t.function.name); },
  };

  // ---- 1. hidratação de contexto (memória como ambiente) --------------------
  function hydrate(message, emit) {
    const ctx = AZ.callTool("search_client_context", { query: message });
    const tl = AZ.callTool("get_timeline", {});
    const persons = ctx.nodes.filter((n) => n.type === "person")
      .map((n) => `${n.label} (${n.props.role || "?"})`);
    const camps = ctx.nodes.filter((n) => n.type === "campaign")
      .map((n) => `${n.label} [${n.props.status || "?"}]`);
    const events = tl.events.slice(-5).map((e) => `• ${e.occurred_at.slice(0, 10)} ${e.title}: ${e.summary}`);
    const pack = [
      `Cliente: Housewhey (e-commerce de suplementos) · operação SPOT.`,
      persons.length ? `Time: ${persons.join(", ")}.` : "",
      camps.length ? `Campanhas em foco: ${camps.join(", ")}.` : "",
      `Linha do tempo recente:`, ...events,
    ].filter(Boolean).join("\n");
    emit({
      type: "phase", key: "hydrate",
      title: "Hidratando contexto do supercérebro",
      detail: `${ctx.nodes.length} nós do grafo + ${tl.events.length} eventos da timeline injetados no prompt (antes do loop).`,
      pack,
    });
    return pack;
  }

  function systemPrompt(pack) {
    return [
      "Você é um agente de marketing da AdzHub operando a conta da Housewhey (operação SPOT).",
      "Resolva a tarefa do gestor CRUZANDO dados reais das tools, não dando palpite.",
      "Regras:",
      "1) Toda métrica vem de uma tool; nunca invente número.",
      "2) Gasto por anúncio está no Meta (list_ads / get_ad_insights). Venda REAL está no CRM (get_leads), ligada por utm_content = ad_id. Para custo por venda, cruze os dois.",
      "3) Metodologia de criativo vem do App (run_app_analise_criativos); não reinvente. Antes de propor copy/CTA, consulte get_mapa_solucao (o que a marca não pode falar).",
      "4) O contexto da conta (quem/o quê/quando) já foi hidratado abaixo. Aprofunde com search_client_context / get_timeline / search_conversations quando precisar do PORQUÊ (ex.: aprovação travada).",
      "5) Responda em português, direto: causa + números + próximo passo acionável. Seja conciso.",
      "",
      "CONTEXTO HIDRATADO (supercérebro):",
      pack,
    ].join("\n");
  }

  // ---- 2/3. loop ReAct com tools (APIs) e skills (Apps) ---------------------
  async function llmLoop({ message, apiKey, model, pack, emit }) {
    const messages = [
      { role: "system", content: systemPrompt(pack) },
      { role: "user", content: message },
    ];
    const allow = new Set(AZ.HARNESS_CONFIG.allowlist);
    for (let step = 1; step <= AZ.HARNESS_CONFIG.maxSteps; step++) {
      const r = await AZ.llm.chat({ apiKey, model, messages, tools: AZ.toolSpecs });
      if (!r.ok) { emit({ type: "error", text: r.error }); return { answer: null, error: r.error }; }
      const msg = r.message;
      const calls = msg.tool_calls || [];
      if (!calls.length) {
        emit({ type: "final", text: msg.content || "(sem conteúdo)" });
        return { answer: msg.content || "" };
      }
      if (msg.content) emit({ type: "thinking", text: msg.content });
      messages.push({ role: "assistant", content: msg.content || "", tool_calls: calls });
      for (const tc of calls) {
        const name = tc.function.name;
        let args = {};
        try { args = JSON.parse(tc.function.arguments || "{}"); } catch (_) {}
        let result;
        if (!allow.has(name)) result = { ok: false, error: `tool '${name}' fora da allowlist` };
        else result = AZ.callTool(name, args);
        const meta = AZ.toolMeta[name] || { layer: "api", label: name };
        emit({ type: "tool", name, layer: meta.layer, label: meta.label, args, result });
        messages.push({ role: "tool", tool_call_id: tc.id, name, content: JSON.stringify(result) });
      }
    }
    // atingiu max_steps: pede fechamento sem mais tools
    const r = await AZ.llm.chat({ apiKey, model, messages: messages.concat([{ role: "user", content: "Feche com a melhor resposta possível a partir do que já coletou." }]), tools: [] });
    const text = r.ok ? (r.message.content || "") : (r.error || "");
    emit({ type: r.ok ? "final" : "error", text });
    return { answer: r.ok ? text : null, error: r.ok ? null : text };
  }

  // ---- orquestrador ---------------------------------------------------------
  AZ.Harness = {
    async run({ message, mode, apiKey, model, emit }) {
      emit = emit || (() => {});
      const pack = hydrate(message, emit); // memória sempre hidratada (ambiente)
      if (mode === "llm") {
        return await llmLoop({ message, apiKey, model, pack, emit });
      }
      // modo simulado: planner roteirizado executando as tools reais
      const { answer, intent } = AZ.planner.run(message, emit);
      emit({ type: "final", text: answer, intent });
      return { answer };
    },
  };
})();
