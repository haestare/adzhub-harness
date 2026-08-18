const fs = require('fs'), vm = require('vm');
const ROOT = '/home/user/Claude/adzhub-harness';
const ctx = { console, location:{origin:''}, setTimeout, JSON, Math, Date };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['web/data.js','web/js/tools.js','web/js/usage.js','web/js/nexo.js','web/js/planner.js','web/js/openrouter.js','web/js/harness.js']) {
  vm.runInContext(fs.readFileSync(ROOT+'/'+f,'utf8'), ctx, {filename:f});
}
const AZ = ctx.AZ;
const prompts = [
  ["report","Cruze o gasto por anúncio no Meta com as vendas no CRM por utm_content e diga qual criativo está caro e barato."],
  ["diagnosis","O CPA do Ômega 3 subiu. Investigue a causa e me diga o próximo passo."],
  ["origin","Vários leads dizem que vieram do Google, mas quase não rodamos Google. O que está acontecendo?"],
  ["agenda","Monte a pauta da próxima call com a Housewhey."],
  ["creative","Analise os criativos e me sugira o que pausar e um brief novo."],
];
(async () => {
  for (const [tag, p] of prompts) {
    const tools = [];
    const emit = (s) => { if (s.type==='tool') tools.push(s.name); };
    const out = await AZ.Harness.run({ message:p, mode:'sim', emit });
    const u = out.uso || {};
    console.log("\n########## ["+tag+"] tools=["+tools.join(", ")+"]");
    console.log("# custo estimado do turno: "+u.chamadas+" chamada(s) de LLM · "+
      AZ.tokens.fmt(u.entrada)+" entrada + "+AZ.tokens.fmt(u.saida)+" saida = "+AZ.tokens.fmt(u.total)+" tokens");
    console.log(out.answer);
  }
})();
