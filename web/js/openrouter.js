/* openrouter.js · transporte para o LLM (modo LLM).
   Fala o protocolo OpenAI (/chat/completions) que a OpenRouter expõe.
   A key vive só na sessão do browser (sessionStorage) e só sai daqui para a
   OpenRouter. Nada é persistido em servidor. */
(function () {
  const AZ = (window.AZ = window.AZ || {});
  const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

  // modelos com tool-calling confiável (o avaliador pode digitar outro id)
  AZ.MODELS = [
    "openai/gpt-4o-mini",
    "openai/gpt-4o",
    "anthropic/claude-3.5-sonnet",
    "google/gemini-2.0-flash-001",
    "meta-llama/llama-3.3-70b-instruct",
    "deepseek/deepseek-chat",
  ];

  AZ.llm = {
    async chat({ apiKey, model, messages, tools }) {
      if (!apiKey) return { ok: false, error: "sem OPENROUTER_API_KEY" };
      let res;
      try {
        res = await fetch(ENDPOINT, {
          method: "POST",
          headers: {
            Authorization: "Bearer " + apiKey,
            "Content-Type": "application/json",
            "HTTP-Referer": location.origin || "https://adzhub-harness.demo",
            "X-Title": "AdzHub Harness Demo",
          },
          body: JSON.stringify({
            model, messages,
            tools, tool_choice: tools && tools.length ? "auto" : undefined,
            temperature: 0.2,
          }),
        });
      } catch (e) {
        return { ok: false, error: "falha de rede: " + (e && e.message || e) };
      }
      if (!res.ok) {
        let detail = "";
        try { detail = (await res.json()).error?.message || ""; } catch (_) {}
        return { ok: false, error: `OpenRouter ${res.status}: ${detail || res.statusText}` };
      }
      const data = await res.json();
      const msg = data.choices && data.choices[0] && data.choices[0].message;
      if (!msg) return { ok: false, error: "resposta sem message" };
      return { ok: true, message: msg, usage: data.usage };
    },
  };
})();
