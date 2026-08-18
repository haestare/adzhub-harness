# Checklist da entrega vs. desafio AdzHub

Revisão do que o desafio pede (guia + página oficial) contra o que está entregue.

## Paper (peso 50%, obrigatório)

| Requisito | Status |
|---|---|
| PDF, máx. 3 MB, português | ✅ 318 KB |
| Curto, estilo arXiv/OpenHands, porém simples | ✅ 4 páginas, 2 colunas |
| Tese defendida (não só descrita) | ✅ Harness Tri-Camada, justificada contra as 5 |
| Anotações de estudo / decisões / trade-offs | ✅ §1, §3.1, §3.3 |
| Considera supercérebro + Apps + APIs | ✅ §2.2 e §3.2 (o que é tool/memória/app) |
| Pontos críticos por tarefa do gestor | ✅ §6 (relatório, diagnóstico, pauta, criativos) |
| As 11 perguntas do roteiro | ✅ mapa em `paper/GUIA-DO-PAPER.md` |
| Figura + tabela + referências | ✅ Figura 1, Tabela 1, 6 refs |
| Fontes de estudo registradas | ✅ OpenHands, ReAct, CodeAct, **RLM (2512.24601)**, Zep/Graphiti, Anthropic |

## Protótipo (peso 25%, recomendado)

| Requisito | Status |
|---|---|
| Chat web estilo Cursor que ilustra a tese | ✅ |
| Trace visível do harness (intent → tools → resposta) | ✅ hidratação (fase) + tools por camada + resposta |
| OpenRouter como motor de LLM | ✅ `web/js/openrouter.js` |
| Campo na UI para colar `OPENROUTER_API_KEY` | ✅ modal Configurar |
| Key só na sessão do browser, não persiste no servidor | ✅ `sessionStorage`, nunca vai ao backend |
| Trocar de modelo | ✅ dropdown clicável |
| Simula tools/APIs/Supercérebro com dataset | ✅ 7 mocks cruzados (Housewhey) |
| Deploy público (Railway recomendado) | ✅ https://adzhub-harness-production.up.railway.app |
| UI/UX | ✅ tema claro/escuro, tabelas estilo Ads Manager, resposta digitada ao vivo, animações, trace agrupado (Nx) |
| Bônus: roda sem key (modo simulado) | ✅ avaliador testa sem colar chave |

## Formulário

| Campo | Valor |
|---|---|
| Nome completo | Rafael Yran Azevedo |
| WhatsApp | o mesmo da candidatura |
| Tipo de harness | Outra / híbrida / própria (Harness Tri-Camada) |
| Paper (PDF) | `paper/paper.pdf` |
| Repositório GitHub (público) | https://github.com/haestare/adzhub-harness |
| URL da demo | https://adzhub-harness-production.up.railway.app |
| Notas | só-leitura por design, dados mock, 5 problemas plantados não rotulados, modo simulado + LLM/OpenRouter |

## Melhorias já aplicadas nesta revisão
- Paper: citação do RLM (arXiv:2512.24601) e nod ao GraphRAG, que a página lista.
- Protótipo: o agente agora é instruído a usar **tabela** para dados comparativos (não lista aninhada).
- Protótipo: **tema claro/escuro** com toggle (persistente, sem flash ao abrir).
- Protótipo: dropdown de modelo, tabelas estilo Ads Manager, trace agrupado (`N×`).
- Protótipo: **streaming SSE real** no modo LLM. O texto aparece token a token enquanto o modelo
  gera; os `tool_calls` chegam fatiados e são remontados no transporte, então o loop inteiro é
  streamado sem chamada extra. No modo simulado continua o typewriter (não há LLM para streamar).
- Docs: `paper/GUIA-DO-PAPER.pdf` e `CHECKLIST.pdf` (versões em PDF, mais fáceis de ler).

## Opcionais que ficam de fora (não bloqueiam a entrega)
- Ouvir o **podcast AdzHub · Harness** e o **How I AI** e citar uma frase no §1 (reforça o critério
  "aprofundamento no estudo"). Deixei de fora do paper para não afirmar o que você ainda não ouviu.
- Um segundo cliente no mock, para mostrar multi-conta (o paper já assume um cliente por escolha de MVP).
