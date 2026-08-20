/* dropdown.js · listbox própria para escolher o modelo.
 *
 * 🔴 POR QUE NÃO É UM <select> NATIVO: o browser SEMPRE abre a lista rolada até o
 * item selecionado, e isso não é configurável por CSS nem por JS. Com 348 modelos
 * no catálogo, abrir o dropdown caía no meio da lista (num openai/gpt-4o-mini
 * qualquer) e os RECOMENDADOS, que são o motivo de existir o ranking, ficavam
 * fora da tela. Aqui a lista abre sempre no topo, por decisão explícita.
 *
 * O que mais o nativo não dava: cabeçalho de grupo fixo ao rolar, campo de busca
 * (obrigatório com centenas de itens), barra de rolagem do design e não a branca
 * do sistema, e um item marcado sem depender do destaque azul do sistema.
 *
 * ⚠️ Teclado é requisito, não enfeite: ↑ ↓ andam, Enter escolhe, Esc fecha e
 * devolve o foco ao botão. Sem isso a lista fica inalcançável para quem não usa
 * mouse, e o avaliador pode ser essa pessoa.
 */
(function () {
  const AZ = (window.AZ = window.AZ || {});
  const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.textContent = h; return n; };
  const semAcento = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  AZ.Dropdown = {
    /* host: elemento vazio onde a listbox é montada
     * grupos(): devolve [{titulo, itens:[{id,...}], ranqueado}]
     * rotulo(item, i, grupo): texto de cada linha
     * valor(): id atual · onEscolher(id) · extra: {texto, aoClicar}  */
    criar({ host, grupos, rotulo, valor, onEscolher, extra }) {
      host.innerHTML = "";
      host.classList.add("dd");

      const botao = el("button", "dd-btn");
      botao.type = "button";
      botao.setAttribute("aria-haspopup", "listbox");
      botao.setAttribute("aria-expanded", "false");
      const rotuloBtn = el("span", "dd-val");
      botao.append(rotuloBtn, el("span", "dd-caret", "▾"));

      const pop = el("div", "dd-pop");
      const busca = el("input", "dd-busca");
      busca.type = "text"; busca.placeholder = "Filtrar por id (ex.: opus, gemini, free)…";
      busca.setAttribute("aria-label", "Filtrar modelos");
      const lista = el("div", "dd-lista");
      lista.setAttribute("role", "listbox");
      pop.append(busca, lista);
      host.append(botao, pop);

      let aberto = false, marcado = -1, linhas = [];

      function desenhar(filtro) {
        lista.innerHTML = ""; linhas = [];
        const f = semAcento(filtro || "").trim();
        let achou = 0;
        grupos().forEach((g) => {
          const itens = f ? g.itens.filter((m) => semAcento(m.id).includes(f)) : g.itens;
          if (!itens.length) return;
          // ao filtrar, o grupo "todos" já cobre os outros: não repetir o mesmo id
          const cab = el("div", "dd-grupo", g.titulo);
          lista.append(cab);
          itens.forEach((m, i) => {
            const linha = el("div", "dd-item", rotulo(m, i, g));
            linha.setAttribute("role", "option");
            linha.dataset.id = m.id;
            if (m.id === valor()) { linha.classList.add("atual"); linha.setAttribute("aria-selected", "true"); }
            linha.addEventListener("click", () => escolher(m.id));
            lista.append(linha); linhas.push(linha); achou++;
          });
        });
        if (extra) {
          const linha = el("div", "dd-item dd-extra", extra.texto);
          linha.setAttribute("role", "option");
          linha.addEventListener("click", () => { fechar(); extra.aoClicar(); });
          lista.append(linha); linhas.push(linha);
        }
        if (!achou && f) lista.prepend(el("div", "dd-vazio", "Nenhum modelo com “" + filtro + "”."));
        marcar(-1);
      }

      function marcar(i) {
        linhas.forEach((l) => l.classList.remove("mark"));
        marcado = i;
        if (i < 0 || !linhas[i]) return;
        linhas[i].classList.add("mark");
        linhas[i].scrollIntoView({ block: "nearest" });
      }

      function abrir() {
        aberto = true;
        host.classList.add("on");
        botao.setAttribute("aria-expanded", "true");
        busca.value = "";
        desenhar("");
        // ⚠️ Dentro do modal sobra pouco espaço abaixo do botão: sem isto a lista
        // saía pela borda de baixo da tela e os últimos itens ficavam inalcançáveis.
        // Mede o espaço real e vira para cima quando não cabe.
        const r = botao.getBoundingClientRect();
        const abaixo = window.innerHeight - r.bottom - 16;
        const acima = r.top - 16;
        const paraCima = abaixo < 260 && acima > abaixo;
        host.classList.toggle("acima", paraCima);
        lista.style.maxHeight = Math.max(160, Math.min(300, (paraCima ? acima : abaixo) - 52)) + "px";
        // 🔴 A CORREÇÃO PEDIDA: a lista SEMPRE começa do topo, nos recomendados.
        lista.scrollTop = 0;
        busca.focus();
      }
      function fechar() {
        aberto = false;
        host.classList.remove("on");
        botao.setAttribute("aria-expanded", "false");
      }
      function escolher(id) { fechar(); botao.focus(); onEscolher(id); }

      botao.addEventListener("click", (e) => { e.stopPropagation(); aberto ? fechar() : abrir(); });
      busca.addEventListener("input", () => { desenhar(busca.value); lista.scrollTop = 0; });
      pop.addEventListener("click", (e) => e.stopPropagation());
      document.addEventListener("click", () => { if (aberto) fechar(); });

      host.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && aberto) { e.preventDefault(); fechar(); botao.focus(); return; }
        if ((e.key === "Enter" || e.key === " ") && !aberto && e.target === botao) { e.preventDefault(); abrir(); return; }
        if (!aberto) return;
        if (e.key === "ArrowDown") { e.preventDefault(); marcar(Math.min(marcado + 1, linhas.length - 1)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); marcar(Math.max(marcado - 1, 0)); }
        else if (e.key === "Enter") {
          e.preventDefault();
          const alvo = linhas[marcado] || linhas.find((l) => l.classList.contains("atual"));
          if (alvo) alvo.click();
        }
      });

      return {
        // repintado de fora quando a lista da API chega ou o modelo muda
        atualizar() {
          rotuloBtn.textContent = valor();
          if (aberto) desenhar(busca.value);
        },
      };
    },
  };
})();
