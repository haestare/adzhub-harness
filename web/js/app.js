/* app.js · UI: composer, render de mensagens, resposta digitada ao vivo,
   trace com agrupamento de tools repetidas, config. */
(function () {
  const AZ = window.AZ;
  const $ = (s) => document.querySelector(s);
  const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };
  const reduced = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

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
  const NUM_RE = /^\s*(r\$\s*)?[-+]?\d[\d.,]*\s*%?\s*$/i;
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
        // detecta colunas numéricas (alinha à direita, estilo Ads Manager)
        const num = head.map((_, c) => {
          const vals = body.map((r) => r[c] || "").filter((v) => v !== "");
          if (!vals.length) return false;
          return vals.filter((v) => NUM_RE.test(v)).length / vals.length >= 0.6;
        });
        html += '<div class="tbl-wrap"><div class="tbl-scroll"><table class="fb-table"><thead><tr>' +
          head.map((h, c) => `<th class="${num[c] ? "num" : ""}">${inline(h)}</th>`).join("") +
          "</tr></thead><tbody>" +
          body.map((r) => "<tr>" + head.map((_, c) => `<td class="${num[c] ? "num" : ""}">${inline(r[c] || "")}</td>`).join("") + "</tr>").join("") +
          "</tbody></table></div></div>";
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

  // ---- trace: cards ------------------------------------------------------
  function callBlock(name, args, result, n) {
    const b = el("div", "call");
    b.append(el("div", "call-h", "chamada " + n));
    const argStr = JSON.stringify(args || {});
    b.append(el("div", "args", "args: " + (argStr === "{}" ? "sem argumentos" : argStr)));
    b.append(el("div", null, "resultado: " + summarize(name, result)));
    const pre = el("pre");
    let js = JSON.stringify(result, null, 1);
    if (js.length > 1100) js = js.slice(0, 1100) + "\n… (truncado)";
    pre.textContent = js;
    b.append(pre);
    return b;
  }
  // card de tool com N chamadas (agrupa repetições consecutivas do mesmo tool)
  function toolCard(name, layer, label, calls, startIdx) {
    const n = el("div", "step");
    if (calls.length > 1) n.classList.add("grouped");
    const head = el("div", "head");
    const idxSpan = el("span", "idx", calls.length > 1 ? startIdx + "-" + (startIdx + calls.length - 1) : String(startIdx));
    const mult = el("span", "mult", calls.length + "×"); if (calls.length < 2) mult.style.display = "none";
    head.append(idxSpan, mult, el("span", "badge " + layer, layer), el("span", "name", name), el("span", "lbl", label));
    const detail = el("div", "detail"); detail.style.display = "none";
    calls.forEach((c, i) => detail.append(callBlock(name, c.args, c.result, i + 1)));
    head.onclick = () => detail.style.display = detail.style.display === "none" ? "block" : "none";
    n.append(head, detail);
    return { node: n, detail, idxSpan, mult };
  }
  function plainStep(step) {
    if (step.type === "phase") {
      const n = el("div", "step"); const head = el("div", "head");
      head.append(el("span", "idx", "0"), el("span", "badge phase", "fase"), el("span", "name", step.title));
      const det = el("div", "detail"); det.innerHTML = step.detail || "";
      if (step.pack) { const pre = el("pre"); pre.textContent = step.pack; det.append(pre); }
      det.style.display = "none";
      head.onclick = () => det.style.display = det.style.display === "none" ? "block" : "none";
      n.append(head, det); return n;
    }
    if (step.type === "thinking") {
      const n = el("div", "step thinking"); const head = el("div", "head");
      head.append(el("span", "idx", "·"), el("span", "name", "raciocínio"));
      const det = el("div", "detail"); det.textContent = step.text;
      n.append(head, det); return n;
    }
    // error
    const n = el("div", "step"); const head = el("div", "head");
    head.append(el("span", "idx", "!"), el("span", "badge phase", "erro"), el("span", "name", "falha"));
    const det = el("div", "detail"); det.style.color = "var(--danger)"; det.textContent = step.text;
    n.append(head, det); return n;
  }
  // agrupa steps (para o trace embutido no balão)
  function groupSteps(steps) {
    const out = []; let idx = 0; let cur = null;
    for (const s of steps) {
      if (s.type === "tool") {
        idx++;
        if (cur && cur.type === "toolgroup" && cur.name === s.name) cur.calls.push({ args: s.args, result: s.result });
        else { cur = { type: "toolgroup", name: s.name, layer: s.layer, label: s.label, startIdx: idx, calls: [{ args: s.args, result: s.result }] }; out.push(cur); }
      } else { out.push({ type: "plain", step: s }); cur = null; }
    }
    return out;
  }

  // ---- resposta digitada ao vivo (typewriter, ambos os modos) -------------
  const messages = $("#messages");
  function revealAnswer(bubble, md, onDone) {
    if (reduced()) { bubble.innerHTML = renderMarkdown(md); onDone && onDone(); return; }
    const tokens = md.match(/\s+|\S+/g) || [];
    const perTick = 3 + Math.floor(tokens.length / 55); // rápido, escala com o tamanho
    let i = 0;
    bubble.classList.add("typing");
    const stepFn = () => {
      i = Math.min(tokens.length, i + perTick);
      bubble.innerHTML = renderMarkdown(tokens.slice(0, i).join(""));
      bubble.insertAdjacentHTML("beforeend", '<span class="caret"></span>');
      messages.scrollTop = messages.scrollHeight;
      if (i < tokens.length) requestAnimationFrame(stepFn);
      else { bubble.classList.remove("typing"); bubble.innerHTML = renderMarkdown(md); onDone && onDone(); }
    };
    requestAnimationFrame(stepFn);
  }

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
    let toolIdx = 0, last = null; // last: grupo de tool consecutivo aberto
    let resetLive = () => {};     // definido abaixo, junto com o balão ao vivo
    const emit = (step) => {
      if (step.type === "final") return;
      steps.push(step);
      if (step.type === "tool") {
        resetLive();              // o texto streamado antes da tool era raciocínio
        toolIdx++;
        if (last && last.name === step.name) { // mesma tool em sequência -> agrupa no card
          last.count++;
          last.idxSpan.textContent = last.start + "-" + toolIdx;
          last.node.classList.add("grouped");
          last.mult.style.display = ""; last.mult.textContent = last.count + "×";
          last.detail.append(callBlock(step.name, step.args, step.result, last.count));
        } else {
          const c = toolCard(step.name, step.layer, step.label, [{ args: step.args, result: step.result }], toolIdx);
          liveTrace.append(c.node);
          last = { name: step.name, node: c.node, detail: c.detail, idxSpan: c.idxSpan, mult: c.mult, count: 1, start: toolIdx };
        }
      } else {
        liveTrace.append(plainStep(step)); last = null;
      }
      liveTrace.scrollTop = liveTrace.scrollHeight;
    };

    const DOTS = '<span class="dots"><i></i><i></i><i></i></span>';
    const thinkingBody = addMsg("bot", (body) => { const b = el("div", "bubble"); b.innerHTML = DOTS; body.append(b); });
    const liveBubble = thinkingBody.querySelector(".bubble");

    // streaming: escreve o texto do LLM no balão conforme chega.
    // Se logo depois vier uma tool call, aquele texto era raciocínio (vai para o
    // trace) e o balão volta aos dots. Ver "reset" dentro do emit acima.
    let streamed = "";
    const onDelta = (_piece, full) => {
      streamed = full;
      liveBubble.innerHTML = renderMarkdown(full) + '<span class="caret"></span>';
      messages.scrollTop = messages.scrollHeight;
    };
    resetLive = () => { streamed = ""; liveBubble.innerHTML = DOTS; };

    let out;
    try { out = await AZ.Harness.run({ message: text, mode: S.mode, apiKey: S.key, model: S.model, emit, onDelta }); }
    catch (e) { out = { answer: null, error: String(e && e.message || e) }; }

    const cameFromStream = !!streamed && !!out && out.answer === streamed;
    thinkingBody.innerHTML = "";
    thinkingBody.append(el("div", "who", "Agente AdzHub"));
    const bubble = el("div", "bubble"); thinkingBody.append(bubble);

    const finalize = () => {
      if (steps.length) {
        const det = el("details", "trace-toggle");
        const nTools = steps.filter((s) => s.type === "tool").length;
        det.append(el("summary", null, `🔧 ${nTools} tool(s) · ${steps.length} passo(s) do harness`));
        const box = el("div", "steps");
        groupSteps(steps).forEach((it) => box.append(it.type === "toolgroup" ? toolCard(it.name, it.layer, it.label, it.calls, it.startIdx).node : plainStep(it.step)));
        det.append(box); thinkingBody.append(det);
      }
      messages.scrollTop = messages.scrollHeight;
      S.running = false; $("#sendBtn").disabled = false;
    };

    if (out && out.answer && cameFromStream) {
      // já foi escrito ao vivo (token a token): só fixa o markdown final
      bubble.innerHTML = renderMarkdown(out.answer);
      finalize();
    } else if (out && out.answer) revealAnswer(bubble, out.answer, finalize);
    else {
      bubble.innerHTML = renderMarkdown("**Não consegui responder.** " + (out && out.error ? out.error : "") +
        (S.mode === "llm" ? "\n\nConfira a key e o modelo em ⚙ Configurar, ou use o modo simulado." : ""));
      finalize();
    }
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
    $("#modelSelect").value = S.model;
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
    // tema claro/escuro (persistente em localStorage; o <head> já setou antes do paint)
    const applyTheme = (t) => {
      document.documentElement.dataset.theme = t;
      const btn = $("#themeBtn");
      btn.textContent = t === "light" ? "🌙" : "☀️";
      btn.title = t === "light" ? "Mudar para tema escuro" : "Mudar para tema claro";
    };
    let theme = localStorage.getItem("az_theme") || "dark";
    applyTheme(theme);
    $("#themeBtn").onclick = () => { theme = theme === "light" ? "dark" : "light"; localStorage.setItem("az_theme", theme); applyTheme(theme); };

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
    // dropdown de modelos (clicável, sem digitar)
    const sel = $("#modelSelect");
    const models = AZ.MODELS.slice();
    if (!models.includes(S.model)) models.unshift(S.model);
    models.forEach((m) => { const o = el("option"); o.value = m; o.textContent = m; sel.append(o); });
    sel.value = S.model;

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
      S.model = $("#modelSelect").value || "openai/gpt-4o-mini";
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
