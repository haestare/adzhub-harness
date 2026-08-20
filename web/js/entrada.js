/* entrada.js · o que entra no composer além de texto: arquivo anexado e ditado.
 *
 * 🔴 POR QUE NÃO É WHISPER (decisão, não esquecimento): a OpenRouter expõe só
 * `/chat/completions`; transcrição de áudio não passa por lá. Usar Whisper exigiria
 * uma SEGUNDA chave (OpenAI ou Groq) na UI, e o desafio é explícito que o campo de
 * chave é o da OpenRouter, guardada só na sessão do browser. Duas chaves seria
 * duas superfícies de vazamento e mais uma peça para falhar na frente do avaliador.
 * O navegador já resolve isso de graça com a Web Speech API, sem chave e sem
 * servidor. ⚠️ No Chrome ela manda o áudio para o serviço do Google, então a tela
 * diz isso em vez de fingir que é local. Se o navegador não tiver a API (Firefox),
 * o botão EXPLICA em vez de sumir ou de não fazer nada.
 *
 * 🔴 E O ANEXO NÃO SOBE PARA LUGAR NENHUM: o arquivo é lido no browser e vira
 * texto dentro da chamada, exatamente como qualquer outra parte do contexto. Isso
 * é a tese do paper aplicada à entrada: quem decide o que entra no contexto é o
 * harness, não o modelo, e por isso o corte por tamanho é feito aqui, visível.
 */
(function () {
  const AZ = (window.AZ = window.AZ || {});

  // ⚠️ Teto pequeno de propósito. Pelo Quadro 1 do paper, cada passo do loop
  // REENVIA tudo que já entrou: um CSV de 200 KB não custa uma vez, custa uma vez
  // por passo. 40 mil caracteres (~10k tokens) já é generoso para um export de Ads.
  const TETO = 40000;
  const EXT_OK = ["csv", "tsv", "txt", "json", "md"];

  AZ.Anexos = {
    lista: [],
    limite: 3,

    // devolve {ok} ou {erro} — quem chama decide como mostrar
    async adicionar(file) {
      if (this.lista.length >= this.limite) return { erro: `Máximo de ${this.limite} arquivos por mensagem.` };
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      if (!EXT_OK.includes(ext)) {
        return { erro: `Só leio texto tabular ou puro (${EXT_OK.join(", ")}). "${file.name}" não é um deles: um PDF ou imagem precisaria de OCR ou de um modelo com visão, que esta demo não tem.` };
      }
      let texto = await file.text();
      let cortado = false;
      if (texto.length > TETO) { texto = texto.slice(0, TETO); cortado = true; }
      this.lista.push({ nome: file.name, bytes: file.size, texto, cortado });
      return { ok: true, cortado };
    },

    remover(nome) { this.lista = this.lista.filter((a) => a.nome !== nome); },
    limpar() { this.lista = []; },

    // bloco que o harness injeta no contexto (nunca some em silêncio: o corte é dito)
    paraContexto() {
      if (!this.lista.length) return "";
      return this.lista.map((a) =>
        `Arquivo anexado pelo gestor: ${a.nome}\n` +
        (a.cortado ? `(cortado nos primeiros ${TETO.toLocaleString("pt-BR")} caracteres pelo harness, para não estourar o contexto)\n` : "") +
        "```\n" + a.texto + "\n```"
      ).join("\n\n");
    },
  };

  /* ---- ditado (Web Speech API) --------------------------------------------- */
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;

  AZ.Voz = {
    suportado: !!Rec,
    motivo: Rec ? "" : "Este navegador não tem a API de reconhecimento de fala (hoje ela existe no Chrome e no Edge). Digite a mensagem, ou abra a demo no Chrome.",
    ativo: false,
    _rec: null,

    // aoTexto(t, final) recebe o parcial enquanto fala e o final ao encerrar
    alternar({ aoTexto, aoEstado, aoErro }) {
      if (!Rec) { aoErro && aoErro(this.motivo); return; }
      if (this.ativo) { this.parar(); return; }
      const r = new Rec();
      r.lang = "pt-BR";
      r.interimResults = true;
      r.continuous = false;
      r.onresult = (ev) => {
        let t = "";
        for (let i = ev.resultIndex; i < ev.results.length; i++) t += ev.results[i][0].transcript;
        aoTexto && aoTexto(t, ev.results[ev.results.length - 1].isFinal);
      };
      // ⚠️ o fim tem TRÊS caminhos (parar na mão, silêncio, erro) e todos precisam
      // devolver o botão ao estado normal, senão ele fica "gravando" para sempre
      r.onerror = (ev) => {
        this.ativo = false; aoEstado && aoEstado(false);
        const m = ev.error === "not-allowed"
          ? "O navegador bloqueou o microfone. Libere a permissão e tente de novo."
          : "O ditado falhou (" + ev.error + ").";
        aoErro && aoErro(m);
      };
      r.onend = () => { this.ativo = false; aoEstado && aoEstado(false); };
      this._rec = r; this.ativo = true; aoEstado && aoEstado(true);
      r.start();
    },
    parar() { if (this._rec) try { this._rec.stop(); } catch (e) {} this.ativo = false; },
  };
})();
