/* usage.js · contabilidade de tokens do harness.
   Por que existe: quem opera um agente precisa ver o que ele custa. Um turno de
   agente não é uma chamada de LLM, são N (uma por passo do loop ReAct), e cada
   passo reenvia a conversa inteira mais as observações das tools. É por isso que
   a entrada cresce a cada passo e o total de um turno não se parece em nada com
   o de um chat comum. Este módulo torna isso visível por chamada, por turno e
   por sessão.

   De onde vem o número:
     · modo LLM  -> usage REAL da OpenRouter (prompt/completion/total, e custo em
                    US$ quando o provedor devolve). É a verdade, não estimativa.
     · modo simulado -> não existe LLM, então nada é medido de verdade. O que
                    aparece é uma ESTIMATIVA do que aquele mesmo turno custaria
                    (contexto hidratado + prompt + observações das tools), sempre
                    marcada com "≈". Estimativa nunca é apresentada como medição. */
(function () {
  const AZ = (window.AZ = window.AZ || {});

  // heurística: ~3,7 caracteres por token em português. Caractere não-ASCII
  // (acento, emoji) costuma custar mais de um token no BPE, daí o adicional.
  function estimar(texto) {
    const s = String(texto == null ? "" : texto);
    if (!s) return 0;
    const naoAscii = (s.match(/[^\x00-\x7F]/g) || []).length;
    return Math.max(1, Math.round(s.length / 3.7 + naoAscii * 0.35));
  }

  // estimativa da janela de entrada: mensagens + specs das tools (que também
  // viajam no prompt a cada chamada, e são fáceis de esquecer na conta).
  function estimarEntrada(messages, tools) {
    let n = 0;
    for (const m of messages || []) {
      n += 4; // overhead de role/delimitador por mensagem
      n += estimar(m.content || "");
      if (m.tool_calls) n += estimar(JSON.stringify(m.tool_calls));
    }
    if (tools && tools.length) n += estimar(JSON.stringify(tools));
    return n;
  }

  const zero = () => ({ entrada: 0, saida: 0, total: 0, custo: 0, chamadas: 0, estimado: false });

  function somar(alvo, u) {
    alvo.entrada += u.entrada || 0;
    alvo.saida += u.saida || 0;
    alvo.total += u.total || (u.entrada || 0) + (u.saida || 0);
    alvo.custo += u.custo || 0;
    alvo.chamadas += 1;
    if (u.estimado) alvo.estimado = true;
    return alvo;
  }

  // normaliza o usage da OpenRouter (formato OpenAI) para o nosso
  function daApi(usage) {
    if (!usage) return null;
    const entrada = usage.prompt_tokens || 0;
    const saida = usage.completion_tokens || 0;
    return {
      entrada, saida,
      total: usage.total_tokens || entrada + saida,
      custo: typeof usage.cost === "number" ? usage.cost : 0,
      estimado: false,
    };
  }

  // acumulador de um turno: guarda cada chamada de LLM em separado, porque é
  // exatamente a lista delas que explica por que o turno custou o que custou.
  function medidor() {
    const chamadas = [];
    return {
      chamadas,
      registrar(u) { if (!u) return; chamadas.push(u); },
      totais() { return chamadas.reduce(somar, zero()); },
    };
  }

  // sessão: sobrevive ao reload (mesma vida da key, que é sessionStorage)
  const CHAVE = "az_usage_sessao";
  function lerSessao() {
    try { return Object.assign(zero(), JSON.parse(sessionStorage.getItem(CHAVE) || "{}")); }
    catch (_) { return zero(); }
  }
  let sessao = lerSessao();

  function fmt(n) {
    n = Math.round(n || 0);
    if (n < 1000) return String(n);
    if (n < 100000) return (n / 1000).toFixed(1).replace(".", ",") + "k";
    return Math.round(n / 1000) + "k";
  }
  function fmtCusto(c) {
    if (!c) return null;
    if (c < 0.01) return "US$ " + c.toFixed(4).replace(".", ",");
    return "US$ " + c.toFixed(3).replace(".", ",");
  }

  AZ.tokens = {
    estimar, estimarEntrada, medidor, daApi, fmt, fmtCusto,
    sessao: () => Object.assign({}, sessao),
    acumularNaSessao(t) {
      sessao.entrada += t.entrada; sessao.saida += t.saida; sessao.total += t.total;
      sessao.custo += t.custo; sessao.chamadas += t.chamadas;
      if (t.estimado) sessao.estimado = true;
      try { sessionStorage.setItem(CHAVE, JSON.stringify(sessao)); } catch (_) {}
      return Object.assign({}, sessao);
    },
    zerarSessao() { sessao = zero(); try { sessionStorage.removeItem(CHAVE); } catch (_) {} return Object.assign({}, sessao); },
  };
})();
