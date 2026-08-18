/* app.js · UI: composer, render de mensagens, trace ao vivo, config. */
(function () {
  const AZ = window.AZ;
  const $ = (s) => document.querySelector(s);
  const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };

  // ---- estado (só na sessão do browser) -----------------------------------
  const S = {
    mode: sessionStorage.getItem("az_mode") || "sim",
    key: sessionStorage.getItem("az_key") || "",
    model: sessionStorage.getItem("az_model") || "openai/gpt-4o-mini",
    running: false,
  };

  // ---- markdown-lite ------------------------------------------------------
  function inline(s) {
    return s
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  }
  function renderMarkdown(text) {
    const lines = String(text).split("\n");
    let html = "", i = 0;
    const isTable = (l) => /^\s*\|.*\|\s*$/.test(l);
    while (i < lines.length) {
      const l = lines[i];
      if (isTable(l) && i + 1 < lines.length && /^\s*\|[\s|:-]+\|\s*$/.test(lines[i + 1])) {
        const rows = []; while (i < lines.length && isTable(lines[i])) { rows.push(lines[i]); i++; }
        const cells = (r) => r.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
        const head = cells(rows[0]); const body = rows.slice(2).map(cells);
        html += "<table><thead><tr>" + head.map((h) => `<th>${inline(h)}</th>`).join("") + "</tr></thead><tbody>" +
          body.map((r) => "<tr>" + r.map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>").join("") + "</tbody></table>";
        continue;
      }
      if (/^\s*[-•]\s+/.test(l)) {
        html += "<ul>"; while (i < lines.length && /^\s*[-•]\s+/.test(lines[i])) { html += `<li>${inline(lines[i].replace(/^\s*[-•]\s+/, ""))}</li>`; i++; } html += "</ul>"; continue;
      }
      if (/^\s*\d+\.\s+/.test(l)) {
        html += "<ol>"; while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { html += `<li>${inline(lines[i].replace(/^\s*\d+\.\s+/, ""))}</li>`; i++; } html += "</ol>"; continue;
      }
      if (l.trim() === "") { i++; continue; }
      html += `<p>${inline(l)}</p>`; i++;
    }
    return html;
  }

  // ---- render de step do trace --------------------------------------------
  function stepNode(step, idx) {
    if (step.type === "phase") {
      const n = el("div", "step");
      const head = el("div", "head");
      head.append(el("span", "idx", "0"), el("span", "badge phase", "fase"), el("span", "name", step.title));
      const det = el("div", "detail");
      det.innerHTML = step.detail || "";
      if (step.pack) { const pre = el("pre"); pre.textContent = step.pack; det.append(pre); }
      det.style.display = "none";
      head.onclick = () => det.style.display = det.style.display === "none" ? "block" : "none";
      n.append(head, det); return n;
    }
    if (step.type === "thinking") {
      const n = el("div", "step thinking");
      const head = el("div", "head");
      head.append(el("span", "idx", "·"), el("span", "name", "raciocínio"));
      const det = el("div", "detail"); det.textContent = step.text;
      n.append(head, det); return n;
    }
    if (step.type === "tool") {
      const n = el("div", "step");
      const head = el("div", "head");
      head.append(
        el("span", "idx", String(idx)),
        el("span", "badge " + step.layer, step.layer),
        el("span", "name", step.name),
        el("span", "lbl", step.label)
      );
      const det = el("div", "detail");
      const argStr = JSON.stringify(step.args || {});
      det.append(el("div", "args", "args: " + (argStr === "{}" ? "sem argumentos" : argStr)));
      det.append(el("div", null, "resultado: " + summarize(step.name, step.result)));
      const pre = el("pre");
      let js = JSON.stringify(step.result, null, 1);
      if (js.length > 1400) js = js.slice(0, 1400) + "\n… (truncado)";
      pre.textContent = js;
      det.append(pre); det.style.display = "none";
      head.onclick = () => det.style.display = det.style.display === "none" ? "block" : "none";
      n.append(head, det); return n;
    }
    if (step.type === "error") {
      const n = el("div", "step");
      const head = el("div", "head");
      head.append(el("span", "idx", "!"), el("span", "badge phase", "erro"), el("span", "name", "falha"));
      const det = el("div", "detail"); det.style.color = "var(--danger)"; det.textContent = step.text;
      n.append(head, det); return n;
    }
    return el("div");
  }

  function summarize(name, r) {
    if (!r || r.ok === false) return "erro";
    try {
      if (name === "list_ads") return r.ads.length + " anúncios";
      if (name === "get_leads") return `${r.summary.count} leads · ${r.summary.by_status.venda || 0} vendas · R$ ${r.summary.total_value_brl}`;
      if (name === "get_ad_insights") return `${(r.series_weekly || []).length} semanas` + (r.trend ? ` · hook ${r.trend.hook_rate_delta_pp}pp` : "");
      if (name === "search_client_context") return r.nodes.length + " nós / " + r.edges.length + " arestas";
      if (name === "get_timeline") return r.events.length + " eventos";
      if (name === "search_conversations") return r.threads.length + " conversas";
      if (name === "run_app_analise_criativos") return r.ranking.length + " criativos ranqueados";
      if (name === "get_mapa_solucao") return "ficha de marca";
    } catch (_) {}
    return "ok";
  }

  // ---- mensagens ----------------------------------------------------------
  const messages = $("#messages");
  function addMsg(role, buildBody) {
    const m = el("div", "msg " + role);
    m.append(el("div", "avatar", role === "user" ? "R" : "A"));
    const body = el("div", "body");
    body.append(el("div", "who", role === "user" ? "Você" : "Agente AdzHub"));
    buildBody(body);
    m.append(body); messages.append(m);
    messages.scrollTop = messages.scrollHeight;
    return body;
  }

  function greeting() {
    addMsg("bot", (body) => {
      const b = el("div", "bubble");
      b.innerHTML = renderMarkdown([
        "Sou o agente da conta **Housewhey** (operação SPOT). Não sou um chatbot: cruzo os dados reais da conta pelas tools e mostro cada passo no painel de trace à direita.",
        "",
        "Comece por um dos atalhos abaixo, ou peça o que quiser. No modo **simulado** (padrão) já funciono sem chave. Para raciocínio de LLM, abra **⚙ Configurar** e cole sua OpenRouter key.",
      ].join("\n"));
      body.append(b);
    });
  }

  // ---- envio --------------------------------------------------------------
  const liveTrace = $("#liveTrace");
  async function send(text) {
    if (!text.trim() || S.running) return;
    S.running = true; $("#sendBtn").disabled = true;
    addMsg("user", (body) => { const b = el("div", "bubble"); b.textContent = text; body.append(b); });
    liveTrace.innerHTML = "";
    const steps = [];
    let toolIdx = 0;
    const emit = (step) => {
      if (step.type === "final") return; // final vai pro balão
      steps.push(step);
      const idx = step.type === "tool" ? ++toolIdx : "";
      liveTrace.append(stepNode(step, idx));
      liveTrace.scrollTop = liveTrace.scrollHeight;
    };
    // placeholder "pensando"
    const thinkingBody = addMsg("bot", (body) => { const b = el("div", "bubble"); b.innerHTML = '<span class="spin"></span> orquestrando…'; body.append(b); body.dataset.ph = "1"; });

    let out;
    try { out = await AZ.Harness.run({ message: text, mode: S.mode, apiKey: S.key, model: S.model, emit }); }
    catch (e) { out = { answer: null, error: String(e && e.message || e) }; }

    // troca o placeholder pela resposta
    thinkingBody.innerHTML = "";
    thinkingBody.append(el("div", "who", "Agente AdzHub"));
    const bubble = el("div", "bubble");
    if (out && out.answer) bubble.innerHTML = renderMarkdown(out.answer);
    else bubble.innerHTML = renderMarkdown("**Não consegui responder.** " + (out && out.error ? out.error : "") +
      (S.mode === "llm" ? "\n\nConfira a key e o modelo em ⚙ Configurar, ou use o modo simulado." : ""));
    thinkingBody.append(bubble);

    // trace embutido no balão (histórico)
    if (steps.length) {
      const det = el("details", "trace-toggle");
      const nTools = steps.filter((s) => s.type === "tool").length;
      det.append(el("summary", null, `🔧 ${nTools} tool(s) · ${steps.length} passo(s) do harness`));
      const box = el("div", "steps");
      let ti = 0; steps.forEach((s) => box.append(stepNode(s, s.type === "tool" ? ++ti : "")));
      det.append(box); thinkingBody.append(det);
    }
    messages.scrollTop = messages.scrollHeight;
    S.running = false; $("#sendBtn").disabled = false;
  }

  // ---- config -------------------------------------------------------------
  function refreshCfgUI() {
    $("#modePill").textContent = "modo: " + (S.mode === "llm" ? "LLM · " + S.model : "simulado");
    const cfg = $("#cfg"); cfg.innerHTML = "";
    ["max_steps=" + AZ.HARNESS_CONFIG.maxSteps, "tools=" + AZ.HARNESS_CONFIG.allowlist.length + " (allowlist)", "memória=hidratada", "loop=ReAct"]
      .forEach((k) => cfg.append(el("span", "kv", k)));
  }
  function openModal() {
    $("#keyInput").value = S.key;
    $("#modelInput").value = S.model;
    document.querySelectorAll('input[name="mode"]').forEach((r) => { r.checked = r.value === S.mode; });
    markMode();
    const ks = $("#keyStatus");
    ks.innerHTML = S.key ? '<span class="status-dot on"></span><span style="font-size:11.5px;color:var(--app)">definida nesta sessão</span>'
      : '<span class="status-dot off"></span><span style="font-size:11.5px;color:var(--txt-faint)">não definida</span>';
    $("#modal").classList.add("on");
  }
  function markMode() {
    const v = document.querySelector('input[name="mode"]:checked').value;
    document.querySelectorAll("#modeRow label").forEach((l) => l.classList.toggle("sel", l.dataset.mode === v));
  }

  // ---- init ---------------------------------------------------------------
  function init() {
    // chips de exemplo
    const examples = [
      ["📊 Relatório de criativos", "Cruze o gasto por anúncio no Meta com as vendas no CRM por utm_content e me diga qual criativo está caro e qual está barato."],
      ["🔎 Diagnóstico da conta", "O CPA do Ômega 3 subiu. Investigue a causa e me diga o próximo passo."],
      ["🧭 Origem dos leads", "Vários leads dizem que vieram do Google, mas quase não rodamos Google. O que está acontecendo?"],
      ["🗒️ Pauta da call", "Monte a pauta da próxima call com a Housewhey."],
    ];
    const chips = $("#chips");
    examples.forEach(([label, prompt]) => {
      const c = el("div", "chip", label); c.onclick = () => { if (!S.running) send(prompt); }; chips.append(c);
    });
    // datalist de modelos
    const dl = $("#modelList"); AZ.MODELS.forEach((m) => { const o = el("option"); o.value = m; dl.append(o); });

    const input = $("#input");
    const grow = () => { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 160) + "px"; };
    input.addEventListener("input", grow);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); const v = input.value; input.value = ""; grow(); send(v); } });
    $("#sendBtn").onclick = () => { const v = input.value; input.value = ""; grow(); send(v); };

    $("#cfgBtn").onclick = openModal;
    $("#cfgCancel").onclick = () => $("#modal").classList.remove("on");
    $("#modeRow").addEventListener("change", markMode);
    $("#cfgSave").onclick = () => {
      S.mode = document.querySelector('input[name="mode"]:checked').value;
      S.key = $("#keyInput").value.trim();
      S.model = $("#modelInput").value.trim() || "openai/gpt-4o-mini";
      sessionStorage.setItem("az_mode", S.mode);
      sessionStorage.setItem("az_key", S.key);
      sessionStorage.setItem("az_model", S.model);
      $("#modal").classList.remove("on");
      refreshCfgUI();
    };
    $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") $("#modal").classList.remove("on"); });

    refreshCfgUI();
    greeting();
  }
  init();
})();
