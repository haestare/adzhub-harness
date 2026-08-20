/* app.js · UI: composer, render de mensagens, resposta digitada ao vivo,
   trace com agrupamento de tools repetidas, medidor de tokens e config.

   MEDIDOR DE TOKENS: o gestor vê o consumo em três granularidades, porque cada
   uma responde uma pergunta diferente. Por CHAMADA (no trace) mostra por que a
   entrada cresce a cada passo do loop; por TURNO (rodapé da resposta) mostra o
   que aquela pergunta custou; por SESSÃO (medidor do topo) mostra o acumulado.
   Número medido e número estimado nunca se misturam: estimativa sempre com ≈. */
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
  // item de lista: captura indentação, marcador (- * • ou 1. 1)) e o texto
  const ITEM_RE = /^(\s*)([-*•]|\d+[.)])\s+(.*)$/;
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
      // título: vira h1/h2/h3 de verdade (o "#" NUNCA aparece na tela)
      const h = l.match(/^\s{0,3}(#{1,6})\s+(.*)$/);
      if (h) { const n = Math.min(h[1].length, 4); html += `<h${n}>${inline(h[2].replace(/\s*#+\s*$/, ""))}</h${n}>`; i++; continue; }

      // LISTAS com aninhamento por indentação.
      // ⚠️ Antes cada item numerado interrompido por bullets abria um <ol> NOVO,
      // e por isso a tela mostrava "1." em todos os itens. A pilha abaixo mantém
      // a mesma lista aberta e pendura os bullets DENTRO do item, preservando a
      // numeração 1, 2, 3.
      if (ITEM_RE.test(l)) {
        const pilha = []; // [{ tag, indent }]
        const fecha = () => { html += `</li></${pilha.pop().tag}>`; };
        while (i < lines.length) {
          const m = lines[i].match(ITEM_RE);
          if (!m) {
            // linha solta e indentada = continuação do item anterior
            if (pilha.length && lines[i].trim() && /^\s+\S/.test(lines[i])) { html += " " + inline(lines[i].trim()); i++; continue; }
            break;
          }
          const indent = m[1].replace(/\t/g, "    ").length;
          const tag = /\d/.test(m[2]) ? "ol" : "ul";
          while (pilha.length && indent < pilha[pilha.length - 1].indent) fecha();
          if (!pilha.length || indent > pilha[pilha.length - 1].indent) {
            html += `<${tag}>`; pilha.push({ tag, indent });          // novo nível (fica dentro do <li> aberto)
          } else {
            html += "</li>";
            if (pilha[pilha.length - 1].tag !== tag) {                 // trocou de tipo no mesmo nível
              html += `</${pilha.pop().tag}><${tag}>`; pilha.push({ tag, indent });
            }
          }
          html += `<li>${inline(m[3])}`;
          i++;
        }
        while (pilha.length) fecha();
        continue;
      }
      if (l.trim() === "") { i++; continue; }
      html += `<p>${inline(l)}</p>`; i++;
    }
    return html;
  }

  AZ.render = renderMarkdown; // exposto para teste (build/test_md.js)

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
    if (step.type === "uso") {
      const u = step.uso, est = u.estimado;
      const n = el("div", "step uso"); const head = el("div", "head");
      head.append(
        // ⚠️ emoji aqui depende de fonte de emoji instalada e vira caixinha onde
        // não há; badge de texto usa a mesma fonte do resto e nunca quebra
        el("span", "badge custo", "custo"),
        el("span", "name", (typeof step.passo === "number" ? "chamada " + step.passo : String(step.passo)) + " de LLM"),
        el("span", "lbl", (est ? "≈ " : "") + "↑" + AZ.tokens.fmt(u.entrada) + " ↓" + AZ.tokens.fmt(u.saida))
      );
      const det = el("div", "detail"); det.style.display = "none";
      const custo = AZ.tokens.fmtCusto(u.custo);
      det.innerHTML = [
        `entrada: <b>${u.entrada.toLocaleString("pt-BR")}</b> · saída: <b>${u.saida.toLocaleString("pt-BR")}</b> · total: <b>${u.total.toLocaleString("pt-BR")}</b>`,
        custo ? `custo: <b>${custo}</b>` : "",
        `modelo: ${step.modelo || "—"}`,
        est ? "<i>estimado: neste modo não há LLM, o número reconstrói o que este mesmo turno custaria.</i>"
            : "<i>medido: usage devolvido pela própria API.</i>",
      ].filter(Boolean).join("<br>");
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
  // 🔴 CADA CONVERSA TEM O PRÓPRIO DOM, e estas duas variáveis apontam para a
  // conversa ATIVA. Guardar histórico como innerHTML e restaurar depois pareceu
  // mais simples e é armadilha: innerHTML recria os nós e leva junto todo
  // ouvinte de clique, então os passos do trace parariam de abrir, sem erro.
  let messages = null;   // .messages da conversa ativa
  let liveTrace = null;  // .steps da conversa ativa
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
    m.append(el("div", "avatar", role === "user" ? "R" : "N"));
    const body = el("div", "body");
    body.append(el("div", "who", role === "user" ? "Você" : AZ.NEXO.nome));
    buildBody(body);
    m.append(body); messages.append(m);
    messages.scrollTop = messages.scrollHeight;
    return body;
  }

  function greeting() {
    addMsg("bot", (body) => {
      const b = el("div", "bubble");
      b.innerHTML = renderMarkdown(AZ.NEXO.abertura);
      body.append(b);
    });
  }

  // ---- medidor de tokens --------------------------------------------------
  // rodapé de um turno: total + abre o detalhamento chamada por chamada, que é
  // o que explica o número (um turno de agente é N chamadas, não uma).
  function usoDoTurno(uso, passos) {
    const est = uso.estimado;
    const custo = AZ.tokens.fmtCusto(uso.custo);
    const det = el("details", "uso-box");
    det.append(el("summary", null,
      `<span class="uso-tot">${est ? "≈" : ""}${AZ.tokens.fmt(uso.total)} tokens</span>` +
      `<span class="uso-sep">↑ ${AZ.tokens.fmt(uso.entrada)} entrada</span>` +
      `<span class="uso-sep">↓ ${AZ.tokens.fmt(uso.saida)} saída</span>` +
      `<span class="uso-sep">${uso.chamadas} chamada${uso.chamadas > 1 ? "s" : ""} de LLM</span>` +
      (custo ? `<span class="uso-sep">${custo}</span>` : "") +
      (est ? `<span class="uso-tag">estimado</span>` : `<span class="uso-tag medido">medido</span>`)));
    const linhas = passos.map((p, i) =>
      `<tr><td>${typeof p.passo === "number" ? "chamada " + p.passo : p.passo}</td>` +
      `<td class="num">${p.uso.entrada.toLocaleString("pt-BR")}</td>` +
      `<td class="num">${p.uso.saida.toLocaleString("pt-BR")}</td>` +
      `<td class="num">${p.uso.total.toLocaleString("pt-BR")}</td></tr>`).join("");
    const box = el("div", "uso-det");
    box.innerHTML =
      `<table class="uso-tbl"><thead><tr><th>passo</th><th class="num">entrada</th><th class="num">saída</th><th class="num">total</th></tr></thead><tbody>${linhas}</tbody></table>` +
      `<p class="uso-nota">${est
        ? "Não houve LLM neste turno (modo simulado). Os números reconstroem o que ele custaria: uma chamada por tool mais a de fechamento, cada uma reenviando tudo que veio antes. É por isso que a entrada cresce a cada passo."
        : "Números medidos, vindos do <code>usage</code> da própria API. A entrada cresce a cada passo porque o loop reenvia a conversa inteira mais as observações das tools."}</p>`;
    det.append(box);
    return det;
  }

  // medidor da sessão, no topo (o acumulado de tudo que já rodou nesta aba)
  function pintarMedidor(ultimo) {
    const sess = AZ.tokens.sessao();
    $("#meterN").textContent = (sess.estimado ? "≈" : "") + AZ.tokens.fmt(sess.total);
    const custo = AZ.tokens.fmtCusto(sess.custo);
    const linha = (rot, u) => u ?
      `<div class="mp-row"><span>${rot}</span><b>${(u.estimado ? "≈" : "") + AZ.tokens.fmt(u.total)}</b></div>
       <div class="mp-sub">↑ ${u.entrada.toLocaleString("pt-BR")} entrada · ↓ ${u.saida.toLocaleString("pt-BR")} saída · ${u.chamadas} chamada(s)</div>` : "";
    $("#meterPanel").innerHTML =
      `<div class="mp-h">Consumo de tokens</div>` +
      linha("Última resposta", ultimo) +
      linha("Sessão inteira", sess) +
      (custo ? `<div class="mp-sub">custo acumulado: <b>${custo}</b></div>` : "") +
      `<div class="mp-nota">${sess.estimado
        ? "Inclui turno(s) do modo simulado, onde não há LLM: ali o número é estimativa (≈), não medição."
        : "Números medidos pela API a cada chamada."}</div>` +
      `<button class="btn mp-zerar" id="meterZerar">Zerar contador</button>`;
    $("#meterZerar").onclick = (e) => { e.stopPropagation(); AZ.tokens.zerarSessao(); pintarMedidor(null); };
  }

  // ---- envio --------------------------------------------------------------
  async function send(text) {
    if (!text.trim() || S.running) return;
    // comando de barra é ação LOCAL de sessão: não entra no harness, não gasta token
    if (AZ.Comandos && AZ.Comandos.eComando(text)) {
      addMsg("user", (body) => { const b = el("div", "bubble"); b.textContent = text; body.append(b); });
      const { resposta } = AZ.Comandos.executar(text, ctxComandos());
      if (resposta) addMsg("bot", (body) => { const b = el("div", "bubble"); b.innerHTML = renderMarkdown(resposta); body.append(b); });
      messages.scrollTop = messages.scrollHeight;
      return;
    }
    S.running = true; $("#sendBtn").disabled = true;
    ultima = text;
    const anexados = AZ.Anexos.lista.slice();
    addMsg("user", (body) => {
      const b = el("div", "bubble"); b.textContent = text; body.append(b);
      anexados.forEach((a) => {
        const chip = el("div", "anexo-msg");
        chip.textContent = "anexo: " + a.nome + (a.cortado ? " (cortado pelo harness)" : "");
        b.append(chip);
      });
    });
    if (AZ._chat) AZ._chat.registrar(text);   // a linha da lateral passa a mostrar o que foi perguntado
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
    const anexos = AZ.Anexos.paraContexto();
    // ⚠️ O motor simulado é um planner roteirizado: ele não lê arquivo, e fingir
    // que leu seria a única mentira desta demo. Diz na cara, na hora.
    if (anexos && S.mode !== "llm") {
      avisoDoSistema("Recebi o arquivo, mas o motor simulado é roteirizado e não lê anexo: ele executa as tools sobre o mock. Para o agente realmente ler o que você anexou, troque para o modo LLM em ⚙ Configurar.");
    }
    try { out = await AZ.Harness.run({ message: text, mode: S.mode, apiKey: S.key, model: S.model, emit, onDelta, anexos }); }
    catch (e) { out = { answer: null, error: String(e && e.message || e) }; }

    const cameFromStream = !!streamed && !!out && out.answer === streamed;
    thinkingBody.innerHTML = "";
    thinkingBody.append(el("div", "who", AZ.NEXO.nome));
    const bubble = el("div", "bubble"); thinkingBody.append(bubble);

    const finalize = () => {
      if (out && out.uso && out.uso.chamadas) {
        thinkingBody.append(usoDoTurno(out.uso, steps.filter((s) => s.type === "uso")));
        AZ.tokens.acumularNaSessao(out.uso);
        pintarMedidor(out.uso);
      }
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
      // ⚠️ o anexo vale para UM turno. Sem isto ele seria reenviado a cada
      // mensagem seguinte, e o custo de entrada (Quadro 1) cresceria calado.
      AZ.Anexos.limpar(); pintarAnexos();
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

  // ---- contexto que os comandos recebem (o que eles podem mexer) ----------
  let ultima = "";            // última pergunta de verdade (para /refazer)
  let ddModelos = null;       // listbox de modelos (js/dropdown.js)
  let temaAtual = "dark";     // espelha o tema; init() define de fato
  function ctxComandos() {
    return {
      S, messages, send, openModal, renderMarkdown,
      ultimaPergunta: () => ultima,
      limparConversa() {                       // /limpar age só na conversa aberta
        messages.innerHTML = "";
        liveTrace.innerHTML = '<div class="empty">Envie uma mensagem para ver o harness orquestrar as tools.</div>';
        greeting();
      },
      setModo(m) { S.mode = m; sessionStorage.setItem("az_mode", m); refreshCfgUI(); },
      setModelo(m) { S.model = m; sessionStorage.setItem("az_model", m); if (ddModelos) ddModelos.atualizar(); refreshCfgUI(); },
      trocarTema(alvo) { temaAtual = alvo || (temaAtual === "light" ? "dark" : "light"); aplicarTema(temaAtual); return temaAtual; },
      repintarMedidor: () => pintarMedidor(null),
    };
  }
  function aplicarTema(t) {
    temaAtual = t;
    document.documentElement.dataset.theme = t;
    localStorage.setItem("az_theme", t);
    const btn = $("#themeBtn");
    btn.textContent = t === "light" ? "☾" : "☀";
    btn.title = t === "light" ? "Mudar para tema escuro" : "Mudar para tema claro";
  }

  // ---- config -------------------------------------------------------------
  function refreshCfgUI() {
    $("#modePill").textContent = "modo: " + (S.mode === "llm" ? "LLM · " + S.model : "simulado");
    const cfg = $("#cfg"); cfg.innerHTML = "";
    const chips = ["max_steps=" + AZ.HARNESS_CONFIG.maxSteps, "tools=" + AZ.HARNESS_CONFIG.allowlist.length + " (allowlist)", "memória=hidratada", "loop=ReAct"];
    // build visível: sem isso não dá para saber, olhando a tela, se o deploy pegou
    if (window.__BUILD) chips.push("build=" + window.__BUILD);
    chips.forEach((k) => cfg.append(el("span", "kv", k)));
  }
  function openModal() {
    $("#keyInput").value = S.key;
    if (ddModelos) ddModelos.atualizar();
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

  // aviso do próprio app (não é o agente falando): erro de anexo, microfone, etc.
  function avisoDoSistema(txt) {
    addMsg("bot", (body) => {
      const b = el("div", "bubble aviso");
      b.textContent = txt;
      body.append(b);
    });
    messages.scrollTop = messages.scrollHeight;
  }

  function pintarAnexos() {
    const host = $("#anexos"); if (!host) return;
    host.innerHTML = "";
    AZ.Anexos.lista.forEach((a) => {
      const kb = Math.max(1, Math.round(a.bytes / 1024));
      const chip = el("span", "anexo");
      chip.innerHTML = '<span class="a-ico"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M20 11.5 11.7 19.8a4.5 4.5 0 0 1-6.4-6.4l8.3-8.3a3 3 0 0 1 4.2 4.2l-8.3 8.3a1.5 1.5 0 0 1-2.1-2.1l7.4-7.4"/></svg></span>';
      const nome = el("span", "a-nome"); nome.textContent = a.nome + " · " + kb + " KB" + (a.cortado ? " · cortado" : "");
      const x = el("button", "a-x", "✕"); x.title = "Remover"; x.onclick = () => { AZ.Anexos.remover(a.nome); pintarAnexos(); };
      chip.append(nome, x); host.append(chip);
    });
  }

  // ---- init ---------------------------------------------------------------
  function init() {
    // tema claro/escuro (persistente em localStorage; o <head> já setou antes do paint)
    aplicarTema(localStorage.getItem("az_theme") || "dark");
    $("#themeBtn").onclick = () => aplicarTema(temaAtual === "light" ? "dark" : "light");

    // ---- conversas ------------------------------------------------------------
    // 🔴 CADA TAREFA É UMA CONVERSA SEPARADA, não um botão que injeta mensagem na
    // conversa aberta. É o que o gestor faz de verdade: o diagnóstico do CPA e a
    // pauta da call são assuntos diferentes, com históricos diferentes, e misturar
    // os dois no mesmo fio faz o agente reenviar contexto que não é daquela tarefa
    // (que, pelo Quadro 1 do paper, é justamente o que custa caro num loop ReAct).
    const input = $("#input");
    const grow = () => { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 160) + "px"; };
    input.addEventListener("input", grow);

    const TAREFAS = [
      { nome: "Relatório de criativos", sub: "Meta × CRM por utm_content", av: "av-1",
        prompt: "Cruze o gasto por anúncio no Meta com as vendas no CRM por utm_content e me diga qual criativo está caro e qual está barato." },
      { nome: "Diagnóstico da conta", sub: "o CPA do Ômega 3 subiu", av: "av-2",
        prompt: "O CPA do Ômega 3 subiu. Investigue a causa e me diga o próximo passo." },
      { nome: "Origem dos leads", sub: "o que o lead diz × o que o UTM diz", av: "av-3",
        prompt: "Vários leads dizem que vieram do Google, mas quase não rodamos Google. O que está acontecendo?" },
      { nome: "Pauta da call", sub: "o que mudou e o que ficou pendente", av: "av-4",
        prompt: "Monte a pauta da próxima call com a Housewhey." },
    ];

    const msgHost = $("#msgHost"), traceHost = $("#traceHost"), convs = $("#convs");
    const CHATS = [];
    let ativo = null;
    const agora = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    function criarChat(t) {
      const chat = {
        id: "c" + (CHATS.length + 1), nome: t.nome, sub: t.sub, av: t.av || "av-1",
        prompt: t.prompt || "", quando: agora(), preview: t.sub, usado: false,
        elMsgs: el("div", "messages"), elSteps: el("div", "steps"),
      };
      chat.elSteps.innerHTML = '<div class="empty">Envie uma mensagem para ver o harness orquestrar as tools.</div>';
      msgHost.append(chat.elMsgs); traceHost.append(chat.elSteps);
      CHATS.push(chat);
      return chat;
    }

    function abrirChat(chat) {
      if (S.running) return;                      // trocar de fio no meio de um turno perderia o trace
      ativo = chat;
      CHATS.forEach((c) => { c.elMsgs.classList.toggle("on", c === chat); c.elSteps.classList.toggle("on", c === chat); });
      messages = chat.elMsgs; liveTrace = chat.elSteps;
      $("#statusTxt").textContent = chat.nome + " · Housewhey";
      // ⚠️ A abertura longa do NEXO só cabe UMA vez. Repetir aquele texto inteiro em
      // toda conversa nova é ruído, e pior: uma bolha aparecendo sozinha ao abrir o
      // fio se parece com "ele enviou minha mensagem", que é justamente o que não
      // acontece aqui. As outras conversas ganham uma linha curta, que diz o estado.
      if (!chat.elMsgs.childElementCount) {
        if (CHATS.indexOf(chat) === 0) greeting();
        else addMsg("bot", (body) => {
          const b = el("div", "bubble");
          b.innerHTML = renderMarkdown(chat.prompt
            ? `Conversa nova sobre **${chat.nome}**. Deixei a pergunta pronta no campo abaixo: mande como está, ou edite antes.`
            : "Conversa nova. Manda a tarefa e eu puxo o dado antes de opinar.");
          body.append(b);
        });
      }
      // ⚠️ abrir uma tarefa NÃO manda a pergunta sozinha: deixa ela pronta no campo.
      // Disparar no clique é o comportamento que ele recusou (mensagem aparecendo
      // sem ele ter pedido), e além disso tira dele a chance de editar o pedido.
      if (!chat.usado && chat.prompt) { input.value = chat.prompt; grow(); }
      else if (!chat.usado) { input.value = ""; grow(); }
      input.focus();
      pintarConversas($("#filtroTarefa").value);
    }

    function pintarConversas(filtro) {
      const f = (filtro || "").toLowerCase().trim();
      convs.innerHTML = "";
      const vistas = CHATS.filter((c) => !f || (c.nome + " " + c.preview).toLowerCase().includes(f));
      if (!vistas.length) { convs.append(el("div", "empty", "Nenhuma conversa com esse nome.")); return; }
      vistas.forEach((c) => {
        const linha = el("div", "conv" + (c === ativo ? " on" : ""));
        linha.innerHTML = `<span class="av ${c.av}">${c.nome.slice(0, 1)}</span>`
          + `<span class="txt"><b></b><small></small></span><span class="quando"></span>`;
        // textContent e não innerHTML: o preview vem do que o gestor digitou
        linha.querySelector("b").textContent = c.nome;
        linha.querySelector("small").textContent = c.preview;
        linha.querySelector(".quando").textContent = c.quando;
        linha.onclick = () => abrirChat(c);
        convs.append(linha);
      });
    }

    // exposto para o send() marcar a conversa como usada e atualizar o preview
    AZ._chat = {
      registrar(texto) {
        if (!ativo) return;
        ativo.usado = true; ativo.preview = texto; ativo.quando = agora();
        pintarConversas($("#filtroTarefa").value);
      },
    };

    TAREFAS.forEach(criarChat);
    abrirChat(CHATS[0]);
    $("#filtroTarefa").addEventListener("input", (e) => pintarConversas(e.target.value));
    $("#novoChat").onclick = () => {
      const n = criarChat({ nome: "Nova conversa", sub: "sem mensagens ainda", av: "av-" + (1 + CHATS.length % 4) });
      abrirChat(n);
    };

    // os chips continuam existindo, mas agora ABREM a conversa daquela tarefa
    const chips = $("#chips");
    TAREFAS.forEach((t, i) => {
      const c = el("div", "chip", t.nome);
      c.onclick = () => abrirChat(CHATS[i]);
      chips.append(c);
    });

    // ---- listbox de modelos --------------------------------------------------
    // Não é um <select> porque o nativo abre sempre rolado até o item escolhido,
    // e com centenas de modelos isso jogava os recomendados para fora da tela.
    const atualizarDica = () => {
      const dica = $("#modelHint");
      if (!dica) return;
      dica.textContent = AZ.modelos.origem === "api"
        ? `Lista viva da OpenRouter: ${AZ.modelos.todos.length} modelos com tool-calling. Abre sempre nos recomendados, ranqueados do mais forte (#1) para o mais fraco.`
        : "Lista local (a API da OpenRouter não respondeu agora). Ranqueada do mais forte (#1) para o mais fraco.";
    };
    ddModelos = AZ.Dropdown.criar({
      host: $("#modelDD"),
      grupos: () => AZ.modelos.grupos(),
      rotulo: (m, i, g) => (g.ranqueado ? AZ.modelos.rotulo(m, i) : AZ.modelos.rotuloSimples(m)),
      valor: () => S.model,
      onEscolher: (id) => ctxComandos().setModelo(id),
      extra: {
        // o catálogo também envelhece: modelo lançado hoje não está em lista nenhuma
        texto: "Outro (digitar id)…",
        aoClicar: () => {
          const id = (window.prompt("id do modelo na OpenRouter (ex.: anthropic/claude-opus-4.6)") || "").trim();
          if (id) ctxComandos().setModelo(id);
        },
      },
    });
    ddModelos.atualizar();
    atualizarDica();
    AZ.modelos.carregar().then(() => { ddModelos.atualizar(); atualizarDica(); });

    // paleta de comandos: instalada ANTES do keydown de enviar, porque quando ela
    // está aberta o Enter escolhe o comando em vez de mandar a mensagem.
    AZ.Comandos.instalarPaleta({
      input, palette: $("#palette"),
      onEscolher: (v) => { input.value = ""; grow(); send(v); },
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey && !e.defaultPrevented) { e.preventDefault(); const v = input.value; input.value = ""; grow(); send(v); }
    });
    $("#sendBtn").onclick = () => { const v = input.value; input.value = ""; grow(); send(v); };
    // o "+" do composer é a porta visível dos comandos: digitar "/" é atalho de
    // quem já sabe, e ninguém descobre atalho que não está escrito em lugar nenhum
    // ---- anexo de arquivo ----------------------------------------------------
    $("#anexoBtn").onclick = () => $("#anexoInput").click();
    $("#anexoInput").addEventListener("change", async (e) => {
      for (const f of Array.from(e.target.files || [])) {
        const r = await AZ.Anexos.adicionar(f);
        if (r.erro) avisoDoSistema(r.erro);
        else if (r.cortado) avisoDoSistema(`"${f.name}" é grande: mandei os primeiros 40 mil caracteres. Num loop ReAct cada passo reenvia o que já entrou, então arquivo inteiro custa uma vez por passo, não uma vez.`);
      }
      e.target.value = "";      // permite reanexar o mesmo arquivo depois de remover
      pintarAnexos();
    });

    // ---- ditado --------------------------------------------------------------
    const mic = $("#micBtn");
    if (!AZ.Voz.suportado) mic.title = AZ.Voz.motivo;
    mic.onclick = () => {
      AZ.Voz.alternar({
        aoTexto: (t, final) => {
          input.value = t; grow();
          if (final) input.focus();
        },
        aoEstado: (ligado) => {
          mic.classList.toggle("gravando", ligado);
          mic.title = ligado ? "Ouvindo… clique para parar" : "Ditar a mensagem";
        },
        aoErro: (m) => avisoDoSistema(m),
      });
    };

    $("#cfgBtn").onclick = openModal;
    $("#cfgCancel").onclick = () => $("#modal").classList.remove("on");
    $("#modeRow").addEventListener("change", markMode);
    $("#cfgSave").onclick = () => {
      S.mode = document.querySelector('input[name="mode"]:checked').value;
      S.key = $("#keyInput").value.trim();
      // o modelo já foi gravado em S no clique da listbox; aqui só garantimos que
      // ele nunca fica vazio (um id vazio viraria 400 na primeira chamada)
      S.model = S.model || "openai/gpt-4o-mini";
      sessionStorage.setItem("az_mode", S.mode);
      sessionStorage.setItem("az_key", S.key);
      sessionStorage.setItem("az_model", S.model);
      $("#modal").classList.remove("on");
      refreshCfgUI();
    };
    $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") $("#modal").classList.remove("on"); });

    // medidor de tokens no topo: clique abre o detalhamento da sessão
    pintarMedidor(null);
    $("#meterBtn").onclick = (e) => { e.stopPropagation(); $("#meter").classList.toggle("on"); };
    document.addEventListener("click", (e) => { if (!e.target.closest("#meter")) $("#meter").classList.remove("on"); });

    refreshCfgUI();   // a abertura do NEXO já foi escrita ao abrir a 1ª conversa
  }
  init();
})();
