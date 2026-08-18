/* comandos.js · slash commands do chat (o que o gestor digita com "/").
 *
 * Por que fora do app.js: comando é DADO (nome, descrição, o que faz), não
 * mecanismo de UI. Assim dá para acrescentar um comando sem abrir o loop nem o
 * renderizador, que é a mesma separação que a persona (nexo.js) já faz.
 *
 * ⚠️ Comando NÃO passa pelo harness: é ação local de sessão (limpar, trocar
 * modo, exportar). Nada aqui gasta token nem chama LLM, e é por isso que o
 * medidor não mexe quando você digita "/limpar".
 */
(function () {
  const AZ = (window.AZ = window.AZ || {});

  // cada comando: run(ctx, arg) devolve texto markdown (vira resposta do sistema)
  // ou null quando a própria ação já é a resposta (ex.: limpar a tela).
  const LISTA = [
    {
      nome: "/limpar", alias: ["/clear", "/cls"], desc: "Limpa a conversa e o trace",
      run(ctx) { ctx.limparConversa(); return null; },
    },
    {
      nome: "/ajuda", alias: ["/help", "/?"], desc: "Lista os comandos disponíveis",
      run() {
        const linhas = LISTA.map((c) => {
          const nomes = [c.nome].concat(c.alias || []).map((n) => "`" + n + "`").join(" · ");
          return `| ${nomes} | ${c.arg ? "`" + c.arg + "`" : ""} | ${c.desc} |`;
        });
        return ["**Comandos do chat.** Digite `/` para ver a lista com autocomplete.", "",
          "| Comando | Argumento | O que faz |", "| --- | --- | --- |", ...linhas, "",
          "Comandos rodam **local**, sem passar pelo harness: não gastam token nem chamam LLM."].join("\n");
      },
    },
    {
      nome: "/modo", alias: ["/mode"], arg: "simulado|llm", desc: "Alterna entre o motor simulado e o LLM",
      run(ctx, arg) {
        const q = (arg || "").toLowerCase();
        const novo = q.startsWith("l") ? "llm" : q.startsWith("s") ? "sim" : (ctx.S.mode === "llm" ? "sim" : "llm");
        if (novo === "llm" && !ctx.S.key) {
          ctx.openModal();
          return "Modo **LLM** precisa da `OPENROUTER_API_KEY`. Abri a configuração para você colar (ela fica só na sessão do browser).";
        }
        ctx.setModo(novo);
        return novo === "llm"
          ? `Motor agora é **LLM** (\`${ctx.S.model}\`): o loop ReAct decide as tools de verdade e a resposta vem em streaming.`
          : "Motor agora é **simulado**: rodo as mesmas tools sobre o mock, sem LLM e sem chave.";
      },
    },
    {
      nome: "/modelo", alias: ["/model"], arg: "id do modelo", desc: "Mostra ou troca o modelo da OpenRouter",
      run(ctx, arg) {
        if (!arg) {
          return ["**Modelo atual:** `" + ctx.S.model + "`", "",
            "Trocar: `/modelo <id>`. Sugestões com tool-calling confiável:", "",
            ...AZ.MODELS.map((m) => "- `" + m + "`")].join("\n");
        }
        ctx.setModelo(arg.trim());
        return `Modelo agora é \`${arg.trim()}\`. Vale para as próximas chamadas no modo LLM.`;
      },
    },
    {
      nome: "/chave", alias: ["/key"], desc: "Abre a configuração para colar a OPENROUTER_API_KEY",
      run(ctx) {
        ctx.openModal();
        return "Abri a configuração. A chave fica **só no `sessionStorage` do browser** e nunca vai para um servidor nosso: sai daqui direto para a OpenRouter.";
      },
    },
    {
      nome: "/tema", alias: ["/theme"], arg: "claro|escuro", desc: "Alterna o tema claro e escuro",
      run(ctx, arg) {
        const q = (arg || "").toLowerCase();
        const novo = q.startsWith("c") || q.startsWith("l") ? "light" : q.startsWith("e") || q.startsWith("d") ? "dark" : null;
        const t = ctx.trocarTema(novo);
        return `Tema **${t === "light" ? "claro" : "escuro"}** aplicado.`;
      },
    },
    {
      nome: "/tools", alias: ["/ferramentas"], desc: "Lista as tools do harness por camada",
      run() {
        const meta = AZ.toolMeta || {};
        const nomes = { memoria: "Memória (supercérebro, hidratada como ambiente)", api: "API (tools do loop ReAct)", app: "App (skill de metodologia)" };
        const por = { memoria: [], api: [], app: [] };
        for (const [n, m] of Object.entries(meta)) (por[m.layer] || por.api).push(`\`${n}\` · ${m.label}`);
        const bloco = (k) => por[k].length ? [`**${nomes[k]}**`, ...por[k].map((x) => "- " + x), ""] : [];
        return ["O harness expõe **" + Object.keys(meta).length + " tools**, uma allowlist fechada (nada fora dela é chamável):", "",
          ...bloco("memoria"), ...bloco("api"), ...bloco("app"),
          `Teto de passos por turno: **${AZ.HARNESS_CONFIG.maxSteps}**. Nenhuma tool escreve na conta: o MVP é só-leitura.`].join("\n");
      },
    },
    {
      nome: "/uso", alias: ["/usage", "/tokens"], desc: "Resumo do consumo de tokens da sessão",
      run() {
        const s = AZ.tokens.sessao(), f = AZ.tokens.fmt;
        if (!s.chamadas) return "Nenhuma chamada ainda nesta sessão. Peça uma tarefa e o medidor começa a contar.";
        const est = s.estimado ? " *(inclui estimativa do modo simulado, marcada com ≈)*" : "";
        return ["**Consumo desta sessão**" + est, "", "| Métrica | Valor |", "| --- | --- |",
          `| Chamadas de LLM | ${s.chamadas} |`, `| Entrada | ${f(s.entrada)} |`, `| Saída | ${f(s.saida)} |`,
          `| Total | ${f(s.total)} |`, s.custo ? `| Custo | ${AZ.tokens.fmtCusto(s.custo)} |` : "", "",
          "A entrada domina porque o loop **reenvia a observação** de cada tool no passo seguinte: é o custo real de um harness ReAct.",
          "", "Zerar: `/uso zerar`."].filter(Boolean).join("\n");
      },
    },
    {
      nome: "/exportar", alias: ["/export"], desc: "Baixa a conversa em Markdown",
      run(ctx) {
        const linhas = [];
        ctx.messages.querySelectorAll(".msg").forEach((m) => {
          const quem = m.classList.contains("user") ? "Você" : "NEXO";
          const b = m.querySelector(".bubble");
          if (b) linhas.push(`## ${quem}`, "", b.innerText.trim(), "");
        });
        const md = ["# Conversa · AdzHub Harness (demo)", "", ...linhas].join("\n");
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
        a.download = "conversa-adzhub.md"; a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        return "Conversa exportada em Markdown.";
      },
    },
    {
      nome: "/refazer", alias: ["/retry"], desc: "Repete a última pergunta",
      run(ctx) {
        const ultima = ctx.ultimaPergunta();
        if (!ultima) return "Não há pergunta anterior nesta sessão.";
        setTimeout(() => ctx.send(ultima), 0);
        return null;
      },
    },
  ];

  const norma = (s) => s.trim().toLowerCase();
  function achar(nome) {
    const n = norma(nome);
    return LISTA.find((c) => c.nome === n || (c.alias || []).includes(n));
  }

  AZ.Comandos = {
    LISTA,
    eComando: (texto) => texto.trim().startsWith("/"),

    // executa e devolve { ok, resposta } — resposta null = a ação já respondeu
    executar(texto, ctx) {
      const t = texto.trim();
      const esp = t.indexOf(" ");
      const nome = esp < 0 ? t : t.slice(0, esp);
      const arg = esp < 0 ? "" : t.slice(esp + 1).trim();
      const cmd = achar(nome);
      if (!cmd) {
        const perto = LISTA.filter((c) => c.nome.startsWith(norma(nome).slice(0, 3))).map((c) => "`" + c.nome + "`");
        return { ok: false, resposta: `Não conheço \`${nome}\`.` + (perto.length ? ` Você quis dizer ${perto.join(" ou ")}?` : " Veja `/ajuda`.") };
      }
      // caso especial: /uso zerar
      if ((cmd.nome === "/uso") && norma(arg) === "zerar") {
        AZ.tokens.zerarSessao(); ctx.repintarMedidor();
        return { ok: true, resposta: "Medidor da sessão zerado." };
      }
      try { return { ok: true, resposta: cmd.run(ctx, arg) }; }
      catch (e) { return { ok: false, resposta: "O comando falhou: " + (e && e.message || e) }; }
    },

    // paleta de autocomplete: aparece quando o texto começa com "/"
    instalarPaleta({ input, palette, onEscolher }) {
      let sel = 0, itens = [];
      const fechar = () => { palette.classList.remove("on"); palette.innerHTML = ""; itens = []; };
      const desenhar = () => {
        palette.innerHTML = "";
        itens.forEach((c, i) => {
          const linha = document.createElement("div");
          linha.className = "cmd" + (i === sel ? " sel" : "");
          linha.innerHTML = `<span class="cmd-n">${c.nome}</span>` +
            (c.arg ? `<span class="cmd-a">${c.arg}</span>` : "") +
            `<span class="cmd-d">${c.desc}</span>`;
          linha.onmousedown = (e) => { e.preventDefault(); escolher(c, true); };
          palette.append(linha);
        });
        palette.classList.toggle("on", itens.length > 0);
      };
      // Tab COMPLETA (para você digitar o argumento), Enter/clique EXECUTA.
      // Todo argumento aqui é opcional, então executar direto é o previsível.
      const escolher = (c, executar) => {
        input.value = c.nome + (c.arg && !executar ? " " : "");
        fechar();
        input.focus();
        if (executar && onEscolher) onEscolher(c.nome);
      };
      const atualizar = () => {
        const v = input.value;
        if (!v.startsWith("/") || v.includes(" ")) return fechar();
        const q = norma(v);
        itens = LISTA.filter((c) => c.nome.startsWith(q) || (c.alias || []).some((a) => a.startsWith(q)));
        sel = 0; desenhar();
      };
      input.addEventListener("input", atualizar);
      input.addEventListener("blur", () => setTimeout(fechar, 120));
      input.addEventListener("keydown", (e) => {
        if (!itens.length) return;
        if (e.key === "ArrowDown") { e.preventDefault(); sel = (sel + 1) % itens.length; desenhar(); }
        else if (e.key === "ArrowUp") { e.preventDefault(); sel = (sel - 1 + itens.length) % itens.length; desenhar(); }
        else if (e.key === "Tab") { e.preventDefault(); escolher(itens[sel], false); }
        else if (e.key === "Enter") { e.preventDefault(); escolher(itens[sel], true); }
        else if (e.key === "Escape") { e.preventDefault(); fechar(); }
      });
    },
  };
})();
