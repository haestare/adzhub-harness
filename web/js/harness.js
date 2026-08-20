/* harness.js · o RUNTIME do agente (a tese em código).
   Três mecanismos, um por camada do domínio:
     1) MEMÓRIA COMO AMBIENTE  -> hidrata um "pacote de contexto" do supercérebro
        (grafo + linha do tempo) ANTES do loop e injeta no prompt. Não é o LLM que
        precisa lembrar de chamar a memória: ela é ambiente.
     2) APIs COMO TOOLS        -> loop ReAct: o LLM decide chamar list_ads/get_leads/etc.
     3) APPS COMO SKILLS       -> tools também, mas de metodologia encapsulada; o harness
        chama o app, não reimplementa a metodologia no prompt.
   Guard-rails de harness (não de chatbot): allowlist de tools, max_steps, validação
   de args, e todo passo observável no trace.

   A PERSONA (NEXO) mora em nexo.js, fora daqui: este arquivo é mecanismo, ela é
   dado. O harness só a concatena com o contexto hidratado.

   CUSTO: cada passo do loop é uma chamada de LLM que reenvia a conversa inteira
   mais as observações das tools, então a entrada CRESCE a cada passo. O medidor
   registra chamada por chamada (usage real da API no modo LLM, estimativa
   marcada com ≈ no modo simulado) e devolve os totais do turno junto da resposta. */
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
      detail: `${ctx.nodes.length} nós do grafo + ${tl.events.length} eventos da timeline injetados no prompt (antes do loop). Custo: ~${AZ.tokens.fmt(AZ.tokens.estimar(pack))} tokens em TODA chamada do turno.`,
      pack,
    });
    return pack;
  }

  const systemPrompt = (pack) => AZ.NEXO.system(pack);

  // ---- 2/3. loop ReAct com tools (APIs) e skills (Apps) ---------------------
  async function llmLoop({ message, apiKey, model, pack, emit, onDelta, medidor }) {
    const messages = [
      { role: "system", content: systemPrompt(pack) },
      { role: "user", content: message },
    ];
    const allow = new Set(AZ.HARNESS_CONFIG.allowlist);

    // registra o custo de UMA chamada de LLM: usage real quando a API devolve,
    // estimativa marcada quando o provedor não contabiliza.
    const contabilizar = (r, msgs, tools, passo) => {
      let u = AZ.tokens.daApi(r && r.usage);
      if (!u) {
        const saida = AZ.tokens.estimar((r && r.message && r.message.content) || "") +
          AZ.tokens.estimar(JSON.stringify((r && r.message && r.message.tool_calls) || ""));
        const entrada = AZ.tokens.estimarEntrada(msgs, tools);
        u = { entrada, saida, total: entrada + saida, custo: 0, estimado: true };
      }
      medidor.registrar(u);
      emit({ type: "uso", passo, uso: u, modelo: model });
      return u;
    };

    for (let step = 1; step <= AZ.HARNESS_CONFIG.maxSteps; step++) {
      // o texto que chega em stream é escrito na tela ao vivo; se no fim vier
      // tool_calls junto, aquilo era raciocínio e a tela descarta (ver app.js).
      const enviadas = messages.slice();
      const r = await AZ.llm.chat({ apiKey, model, messages, tools: AZ.toolSpecs, onDelta });
      if (!r.ok) { emit({ type: "error", text: r.error }); return { answer: null, error: r.error, uso: medidor.totais() }; }
      contabilizar(r, enviadas, AZ.toolSpecs, step);
      const msg = r.message;
      const calls = msg.tool_calls || [];
      if (!calls.length) {
        emit({ type: "final", text: msg.content || "(sem conteúdo)" });
        return { answer: msg.content || "", uso: medidor.totais() };
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
        const bruto = JSON.stringify(result);
        emit({ type: "tool", name, layer: meta.layer, label: meta.label, args, result, tokens: AZ.tokens.estimar(bruto) });
        messages.push({ role: "tool", tool_call_id: tc.id, name, content: bruto });
      }
    }
    // atingiu max_steps: pede fechamento sem mais tools
    const fecha = messages.concat([{ role: "user", content: "Feche com a melhor resposta possível a partir do que já coletou." }]);
    const r = await AZ.llm.chat({ apiKey, model, messages: fecha, tools: [], onDelta });
    if (r.ok) contabilizar(r, fecha, [], "fecho");
    const text = r.ok ? (r.message.content || "") : (r.error || "");
    emit({ type: r.ok ? "final" : "error", text });
    return { answer: r.ok ? text : null, error: r.ok ? null : text, uso: medidor.totais() };
  }

  /* ---- custo do modo simulado -------------------------------------------
     Aqui NÃO existe LLM, então nada é medido: o que sai é o que este mesmo
     turno CUSTARIA, reconstruído do jeito que o loop real gasta. Uma chamada
     por tool observada mais a de fechamento, e cada uma reenviando tudo que
     veio antes, que é a razão de a entrada crescer passo a passo. */
  function estimarTurnoSimulado({ pack, message, chamadas, answer, emit, medidor }) {
    const msgs = [
      { role: "system", content: systemPrompt(pack) },
      { role: "user", content: message },
    ];
    const specs = AZ.toolSpecs;
    chamadas.forEach((c, i) => {
      const entrada = AZ.tokens.estimarEntrada(msgs, specs);
      const pedido = JSON.stringify({ name: c.name, arguments: c.args || {} });
      const saida = AZ.tokens.estimar(pedido);
      const u = { entrada, saida, total: entrada + saida, custo: 0, estimado: true };
      medidor.registrar(u);
      emit({ type: "uso", passo: i + 1, uso: u, modelo: "—" });
      msgs.push({ role: "assistant", content: "", tool_calls: [{ function: { name: c.name, arguments: pedido } }] });
      msgs.push({ role: "tool", content: JSON.stringify(c.result) });
    });
    const entrada = AZ.tokens.estimarEntrada(msgs, specs);
    const saida = AZ.tokens.estimar(answer);
    const u = { entrada, saida, total: entrada + saida, custo: 0, estimado: true };
    medidor.registrar(u);
    emit({ type: "uso", passo: chamadas.length + 1, uso: u, modelo: "—" });
    return medidor.totais();
  }

  // ---- orquestrador ---------------------------------------------------------
  AZ.Harness = {
    async run({ message, mode, apiKey, model, emit, onDelta, anexos }) {
      emit = emit || (() => {});
      const medidor = AZ.tokens.medidor();
      const pack = hydrate(message, emit); // memória sempre hidratada (ambiente)
      if (mode === "llm") {
        // ⚠️ o anexo entra DEPOIS da pergunta e como bloco marcado, nunca colado
        // no texto do gestor: o modelo precisa saber o que ele mesmo pediu e o que
        // é dado que veio junto, senão trata o CSV inteiro como instrução.
        const comAnexo = anexos ? message + "\n\n" + anexos : message;
        return await llmLoop({ message: comAnexo, apiKey, model, pack, emit, onDelta, medidor });
      }
      // modo simulado: planner roteirizado executando as tools reais
      const chamadas = [];
      const espiao = (s) => {
        if (s.type === "tool") { chamadas.push(s); s.tokens = AZ.tokens.estimar(JSON.stringify(s.result)); }
        emit(s);
      };
      const { answer, intent } = AZ.planner.run(message, espiao);
      const uso = estimarTurnoSimulado({ pack, message, chamadas, answer, emit, medidor });
      emit({ type: "final", text: answer, intent });
      return { answer, uso };
    },
  };
})();
