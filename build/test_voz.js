/* test_voz.js · trava o ditado e o anexo (web/js/entrada.js), sem browser.
 *
 * Os dois defeitos que este teste existe para não deixar voltar, os dois relatados
 * em uso real: (a) o ditado APAGAVA o texto já escrito, porque cada sessão de
 * reconhecimento começa do zero e o resultado era escrito direto no campo; e
 * (b) ele PARAVA sozinho no primeiro silêncio, porque a API encerra e ninguém
 * religava. Nenhum dos dois quebra nada visível: o campo simplesmente fica errado.
 */
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// reconhecedor falso: guarda os callbacks e deixa o teste disparar os eventos
function montar() {
  const criados = [];
  class RecFalso {
    constructor() { this.iniciado = 0; criados.push(this); }
    start() { this.iniciado++; }
    stop() { this.onend && this.onend(); }
    // ajudinhas do teste
    fala(trechos) { this.onresult({ resultIndex: 0, results: Object.assign(trechos.map((t) => Object.assign([{ transcript: t[0] }], { isFinal: t[1] })), { length: trechos.length }) }); }
  }
  const janela = { SpeechRecognition: RecFalso };
  const ctx = { window: janela, setTimeout, clearTimeout, console };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "web", "js", "entrada.js"), "utf8"), ctx);
  return { AZ: janela.AZ, criados };
}
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  // ---- (a) não apaga o que já estava escrito -------------------------------
  {
    const { AZ, criados } = montar();
    assert.ok(AZ.Voz.suportado, "deveria detectar o reconhecedor");
    let campo = "vou perguntar sobre o CPA";
    AZ.Voz.alternar({ textoAtual: campo, aoTexto: (t) => { campo = t; }, aoEstado: () => {}, aoErro: () => {} });
    criados[0].fala([["do Ômega 3", true]]);
    assert.equal(campo, "vou perguntar sobre o CPA do Ômega 3", "o ditado apagou o texto anterior");
  }

  // ---- parcial não duplica o trecho já fechado ------------------------------
  {
    const { AZ, criados } = montar();
    let campo = "";
    AZ.Voz.alternar({ textoAtual: "", aoTexto: (t) => { campo = t; }, aoEstado: () => {}, aoErro: () => {} });
    criados[0].fala([["o CPA subiu", true]]);
    criados[0].fala([[" e eu quero", false]]);      // parcial, ainda mudando
    assert.equal(campo, "o CPA subiu e eu quero", "o parcial deveria vir DEPOIS do fechado");
    criados[0].fala([[" e eu quero saber por quê", true]]);
    assert.equal(campo, "o CPA subiu e eu quero saber por quê", "o parcial não podia ficar duplicado");
  }

  // ---- (b) silêncio não encerra: religa sozinho -----------------------------
  {
    const { AZ, criados } = montar();
    let ligado = null, campo = "";
    AZ.Voz.alternar({ textoAtual: "", aoTexto: (t) => { campo = t; }, aoEstado: (v) => { ligado = v; }, aoErro: () => {} });
    criados[0].fala([["primeira parte", true]]);
    criados[0].onend();                       // a API desistiu no silêncio
    await espera(400);
    assert.equal(criados.length, 2, "deveria ter religado o reconhecedor");
    assert.equal(ligado, true, "o botão não podia ter voltado ao normal sozinho");
    // e o que já foi falado continua lá depois do religamento
    criados[1].fala([[" segunda parte", true]]);
    assert.equal(campo, "primeira parte segunda parte", "o religamento perdeu o que já tinha sido dito");
  }

  // ---- só o clique encerra --------------------------------------------------
  {
    const { AZ, criados } = montar();
    let ligado = null;
    AZ.Voz.alternar({ textoAtual: "", aoTexto: () => {}, aoEstado: (v) => { ligado = v; }, aoErro: () => {} });
    AZ.Voz.parar();
    await espera(400);
    assert.equal(criados.length, 1, "depois de parar a pedido, NÃO pode religar");
    assert.equal(ligado, false, "o botão deveria ter voltado ao normal");
    assert.equal(AZ.Voz.ativo, false);
  }

  // ---- erro de silêncio não derruba a sessão --------------------------------
  {
    const { AZ, criados } = montar();
    let ligado = null, erro = null;
    AZ.Voz.alternar({ textoAtual: "", aoTexto: () => {}, aoEstado: (v) => { ligado = v; }, aoErro: (m) => { erro = m; } });
    criados[0].onerror({ error: "no-speech" });
    assert.equal(erro, null, "no-speech é pausa, não falha");
    assert.equal(ligado, true, "no-speech não podia desligar o botão");
    criados[0].onerror({ error: "not-allowed" });
    assert.ok(erro && /permiss|bloque/i.test(erro), "permissão negada precisa avisar");
    assert.equal(ligado, false, "permissão negada tem que desligar o botão");
  }

  // ---- anexo: corta pelo teto e diz que cortou ------------------------------
  {
    const { AZ } = montar();
    const grande = { name: "export.csv", size: 999999, text: async () => "x".repeat(50000) };
    const r = await AZ.Anexos.adicionar(grande);
    assert.ok(r.ok && r.cortado, "arquivo acima do teto deveria ser cortado");
    assert.equal(AZ.Anexos.lista[0].texto.length, 40000, "teto de 40 mil caracteres");
    assert.ok(/cortado nos primeiros/.test(AZ.Anexos.paraContexto()), "o corte precisa aparecer no contexto");
    const ruim = await AZ.Anexos.adicionar({ name: "print.png", size: 10, text: async () => "" });
    assert.ok(ruim.erro && /OCR|visão/.test(ruim.erro), "imagem deveria ser recusada com explicação");
    AZ.Anexos.limpar();
    assert.equal(AZ.Anexos.paraContexto(), "", "limpar deveria zerar o contexto");
  }

  console.log("tudo passou");
})();
