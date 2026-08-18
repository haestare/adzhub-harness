/* openrouter.js · transporte para o LLM (modo LLM).
   Fala o protocolo OpenAI (/chat/completions) que a OpenRouter expõe.
   A key vive só na sessão do browser (sessionStorage) e só sai daqui para a
   OpenRouter. Nada é persistido em servidor.

   STREAMING (SSE): quando recebe onDelta, consome `stream: true` e entrega o
   texto em pedaços, do jeito que o Claude escreve. Os tool_calls também chegam
   fatiados (name e arguments em pedaços, indexados), então eles são REMONTADOS
   aqui antes de voltar ao loop. É isso que permite streamar o loop inteiro sem
   uma chamada extra só para a resposta final.
   Se o streaming falhar antes de produzir qualquer coisa, cai para a chamada
   normal (não-streaming) e nada quebra.

   CONTABILIDADE DE TOKENS: dois parâmetros pedem o consumo de volta.
     · `usage: { include: true }` (extensão da OpenRouter) traz o custo em US$;
     · `stream_options: { include_usage: true }` (padrão OpenAI) faz o usage vir
       no ÚLTIMO chunk do SSE. ⚠️ Esse chunk chega com `choices: []`, então quem
       lê o stream tem que pegar o `usage` ANTES de descartar o chunk por não ter
       delta: era assim que o número sumia sem erro nenhum.
   ⚠️ Se algum provedor recusar esses dois parâmetros (400), a chamada é refeita
   UMA vez sem eles: melhor perder o medidor de tokens do que perder a resposta. */
(function () {
  const AZ = (window.AZ = window.AZ || {});
  const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

  // modelos com tool-calling confiável (o avaliador escolhe no dropdown)
  AZ.MODELS = [
    "openai/gpt-4o-mini",
    "openai/gpt-4o",
    "anthropic/claude-3.5-sonnet",
    "google/gemini-2.0-flash-001",
    "meta-llama/llama-3.3-70b-instruct",
    "deepseek/deepseek-chat",
  ];

  const headers = (apiKey) => ({
    Authorization: "Bearer " + apiKey,
    "Content-Type": "application/json",
    "HTTP-Referer": location.origin || "https://adzhub-harness.demo",
    "X-Title": "AdzHub Harness Demo",
  });

  async function errorOf(res) {
    let detail = "";
    try { detail = (await res.json()).error?.message || ""; } catch (_) {}
    return `OpenRouter ${res.status}: ${detail || res.statusText}`;
  }

  function post({ apiKey, model, messages, tools, stream, contabilidade }) {
    const body = {
      model, messages,
      tools, tool_choice: tools && tools.length ? "auto" : undefined,
      temperature: 0.2,
      stream: stream || undefined,
    };
    if (contabilidade) {
      body.usage = { include: true };                       // custo em US$ (OpenRouter)
      if (stream) body.stream_options = { include_usage: true }; // usage no fim do SSE
    }
    return fetch(ENDPOINT, { method: "POST", headers: headers(apiKey), body: JSON.stringify(body) });
  }

  // manda com contabilidade e, se o provedor recusar (400), repete sem ela
  async function postComFallback(opts) {
    const res = await post(Object.assign({}, opts, { contabilidade: true }));
    if (res.status !== 400) return { res, contabilizado: true };
    const res2 = await post(Object.assign({}, opts, { contabilidade: false }));
    return { res: res2, contabilizado: false };
  }

  // remonta a mensagem a partir dos deltas SSE
  async function readStream(res, onDelta) {
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "", text = "", usage = null;
    const calls = []; // por índice: { id, type, function: { name, arguments } }
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() || "";               // guarda a linha incompleta
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith("data:")) continue; // ignora keep-alive (": OPENROUTER PROCESSING")
        const payload = t.slice(5).trim();
        if (payload === "[DONE]") continue;
        let json; try { json = JSON.parse(payload); } catch (_) { continue; }
        if (json.usage) usage = json.usage;   // ⚠️ antes do descarte por falta de delta
        const delta = json.choices && json.choices[0] && json.choices[0].delta;
        if (!delta) continue;
        if (delta.content) { text += delta.content; onDelta(delta.content, text); }
        for (const tc of delta.tool_calls || []) {
          const i = tc.index == null ? 0 : tc.index;
          if (!calls[i]) calls[i] = { id: "", type: "function", function: { name: "", arguments: "" } };
          if (tc.id) calls[i].id = tc.id;
          if (tc.function && tc.function.name) calls[i].function.name += tc.function.name;
          if (tc.function && tc.function.arguments) calls[i].function.arguments += tc.function.arguments;
        }
      }
    }
    const tool_calls = calls.filter(Boolean);
    return { message: { role: "assistant", content: text, tool_calls: tool_calls.length ? tool_calls : null }, usage };
  }

  AZ.llm = {
    async chat({ apiKey, model, messages, tools, onDelta }) {
      if (!apiKey) return { ok: false, error: "sem OPENROUTER_API_KEY" };
      const wantStream = typeof onDelta === "function";

      if (wantStream) {
        try {
          const { res } = await postComFallback({ apiKey, model, messages, tools, stream: true });
          if (!res.ok) return { ok: false, error: await errorOf(res) };
          if (res.body) {
            const { message, usage } = await readStream(res, onDelta);
            return { ok: true, message, usage, streamed: true };
          }
        } catch (e) {
          // cai para o caminho normal abaixo (nada foi entregue ao usuário ainda)
        }
      }

      let res;
      try { ({ res } = await postComFallback({ apiKey, model, messages, tools, stream: false })); }
      catch (e) { return { ok: false, error: "falha de rede: " + (e && e.message || e) }; }
      if (!res.ok) return { ok: false, error: await errorOf(res) };
      const data = await res.json();
      const msg = data.choices && data.choices[0] && data.choices[0].message;
      if (!msg) return { ok: false, error: "resposta sem message" };
      return { ok: true, message: msg, usage: data.usage };
    },
  };
})();
