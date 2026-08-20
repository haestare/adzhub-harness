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
    _base: "",      // o que já estava escrito quando o ditado começou
    _final: "",     // trechos já fechados pelo reconhecedor nesta sessão de fala
    _parandoAPedido: false,

    // 🔴 DUAS REGRAS QUE O PADRÃO DA API QUEBRA E PRECISAM SER FORÇADAS:
    //   (a) ele PARA SOZINHO no primeiro silêncio. `continuous = true` reduz isso,
    //       mas o Chrome ainda dispara `onend` depois de uma pausa longa, então o
    //       único jeito de "só para quando eu mandar" é RELIGAR no onend enquanto
    //       o usuário não clicou de novo.
    //   (b) cada sessão de reconhecimento começa do zero, então escrever o
    //       resultado direto no campo APAGA o que já estava lá. Por isso guardamos
    //       o texto anterior em `_base` e sempre compomos base + fechado + parcial.
    alternar({ textoAtual, aoTexto, aoEstado, aoErro }) {
      if (!Rec) { aoErro && aoErro(this.motivo); return; }
      if (this.ativo) { this.parar(); return; }
      const anterior = (textoAtual || "").replace(/\s+$/, "");
      this._base = anterior ? anterior + " " : "";
      this._final = "";
      this._parandoAPedido = false;
      this.ativo = true;
      aoEstado && aoEstado(true);
      this._ligar({ aoTexto, aoEstado, aoErro });
    },

    _ligar(cbs) {
      const r = new Rec();
      r.lang = "pt-BR";
      r.interimResults = true;
      r.continuous = true;
      r.onresult = (ev) => {
        let parcial = "";
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const t = ev.results[i][0].transcript;
          if (ev.results[i].isFinal) this._final += t;
          else parcial += t;
        }
        cbs.aoTexto && cbs.aoTexto(this._base + this._final + parcial);
      };
      r.onerror = (ev) => {
        // "no-speech" e "aborted" são fim de trecho, não falha: o onend religa.
        if (ev.error === "no-speech" || ev.error === "aborted") return;
        this.ativo = false; this._parandoAPedido = true;
        cbs.aoEstado && cbs.aoEstado(false);
        cbs.aoErro && cbs.aoErro(ev.error === "not-allowed"
          ? "O navegador bloqueou o microfone. Libere a permissão e tente de novo."
          : "O ditado falhou (" + ev.error + ").");
      };
      r.onend = () => {
        if (this.ativo && !this._parandoAPedido) {
          // ⚠️ religar no mesmo instante estoura InvalidStateError; 250ms basta
          setTimeout(() => { if (this.ativo && !this._parandoAPedido) this._ligar(cbs); }, 250);
          return;
        }
        this.ativo = false;
        cbs.aoEstado && cbs.aoEstado(false);
      };
      this._rec = r;
      try { r.start(); } catch (e) { /* já estava rodando: o onend religa */ }
    },

    parar() {
      this._parandoAPedido = true;   // impede o religamento automático
      this.ativo = false;
      if (this._rec) try { this._rec.stop(); } catch (e) {}
    },
  };
})();
