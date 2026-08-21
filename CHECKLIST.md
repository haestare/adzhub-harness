# Checklist da entrega vs. desafio AdzHub

Revisão do que o desafio pede (guia + página oficial) contra o que está entregue.

## Paper (peso 50%, obrigatório)

| Requisito | Status |
|---|---|
| PDF, máx. 3 MB, português | ✅ 323 KB |
| Curto, estilo arXiv/OpenHands, porém simples | ✅ 7 páginas, 2 colunas |
| Tese defendida (não só descrita) | ✅ Harness Tri-Camada; §2.3 mapeia as 5 famílias (Tabela 1) e §3.1 defende a composição |
| Anotações de estudo / decisões / trade-offs | ✅ §1, §2.3, §3.1, §3.3 |
| Considera supercérebro + Apps + APIs | ✅ §2.2 (por que grafo, por que tempo é camada, por que App ≠ tool, o que os canais mudam) + §3.2 |
| Pontos críticos por tarefa do gestor | ✅ §6 é seção própria: 7 tarefas na Tabela 3 + os dois casos graves em prosa |
| Achado próprio, medido | ✅ Quadro 1: entrada de 3,0k → 11,4k tokens contra ~434 de saída num turno de 5 passos |
| O que ficou de fora de propósito | ✅ §7 nomeia a camada de integrações (conectar contas, OAuth, cofre de credencial, estado de conexão, multi-conta) e a geração de criativo, com a razão honesta: escopo do harness desconhecido, não descuido. E mostra que a tese acomoda isso sem mexer no loop |
| As 11 perguntas do roteiro | ✅ mapa em `paper/GUIA-DO-PAPER.md` |
| Figura + tabela + referências | ✅ Figura 1, Quadro 1, Tabelas 1-3, 6 refs |
| Palavras-chave no formato do modelo | ✅ 8 termos: os 3 obrigatórios (`harness`, tipo escolhido, domínio AdzHub) mais 5 próprios, dentro da faixa de 3 a 6 |
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
| Simula tools/APIs/Supercérebro com dataset | ✅ 7 mocks cruzados × **2 clientes** (Housewhey + Bravo Pet como grupo de controle) |
| Deploy público (Railway recomendado) | ✅ https://adzhub-harness-production.up.railway.app |
| UI/UX | ✅ layout de três colunas seguindo o design de referência da AdzHub, **uma conversa por tarefa** (histórico e trace separados, e dá para sair de uma conversa com a resposta ainda sendo escrita: ela continua na conversa que a pediu, com indicador na lateral), tema claro/escuro em par com escada de contraste, balão azul do gestor à direita, tabelas estilo Ads Manager, resposta digitada ao vivo, trace agrupado (Nx) |
| Entrada do composer | ✅ **+** abre menu de tipo num clique e o explorador direto no duplo clique; anexo de CSV/TSV/JSON/TXT/MD lido no browser e cortado em 40 mil caracteres pelo harness; ditado contínuo pela API de fala do navegador, que entra no texto já escrito e só para no clique (sem segunda chave, ver §5 do paper). `build/test_voz.js` trava as duas regressões |
| Persona própria (não é chatbot genérico) | ✅ **NEXO**, estrategista de performance, em `web/js/nexo.js` (fora do runtime) |
| Consumo de tokens visível pro gestor | ✅ por chamada (trace), por turno (rodapé com tabela) e por sessão (medidor no topo), com custo em US$ quando o provedor devolve |
| Bônus: roda sem key (modo simulado) | ✅ avaliador testa sem colar chave |

## Formulário — ✅ ENTREGUE em 2026-08-21 (prazo era 28/08)

| Campo | Valor enviado |
|---|---|
| Nome completo | Rafael Yran Azevedo |
| WhatsApp | o mesmo da candidatura |
| Tipo de harness | Outra / híbrida / própria (Harness Tri-Camada) |
| Paper (PDF) | `paper/paper.pdf` (7 páginas, 323 KB) |
| Repositório GitHub (público) | https://github.com/haestare/adzhub-harness |
| URL da demo | https://adzhub-harness-production.up.railway.app |
| Notas | só-leitura por design, dados mock, 5 problemas plantados não rotulados, modo simulado + LLM/OpenRouter |

🔴 **O que muda agora que o formulário foi enviado: o repo e a demo continuam VIVOS, e o avaliador olha o estado do
momento em que ele abrir, não o do momento da entrega.** Os dois gatilhos de espelho (`.githooks/post-commit` e o
hook `Stop`) empurram todo commit que toque `adzhub-harness/` para o repo público, e o Railway redeploya a partir
dele. Ou seja **commit daqui pra frente é publicação na cara do avaliador**, com duas consequências práticas:
o `paper.pdf` do repo tem que continuar sendo exatamente o PDF que foi anexado no formulário (mexer no
`paper.html` sem regerar o PDF faz o repo contradizer a entrega), e mudança no `web/` durante uma leitura dele
troca a demo debaixo do pé. **Se for mexer, mexer em lote e regerar o PDF junto.**

## Estado do protótipo (o que o avaliador encontra)

| Recurso | Situação |
|---|---|
| Persona própria (NEXO), fora do runtime | ✅ `web/js/nexo.js` |
| Trace do harness com badge por camada e agrupamento `N×` | ✅ |
| Medidor de tokens (por chamada, por turno, por sessão) | ✅ medido no LLM, estimado com ≈ no simulado |
| Streaming SSE real, com `tool_calls` remontados | ✅ |
| Tabelas estilo Ads Manager + títulos h1-h3 | ✅ `build/test_md.js` trava a regressão |
| Tema claro/escuro persistente | ✅ |
| Comandos de barra (10, com paleta) | ✅ `/tools` e `/uso` deixam o harness inspecionável |
| Dropdown de modelos | ✅ lista viva da API em 3 grupos: recomendados ranqueados (#1 = mais forte, um por família), grátis (custo zero) e o catálogo inteiro com tool-calling, mais "Outro (digitar id)". Fallback local sem rede, que não anuncia nada como grátis. `build/test_modelos.js` trava a regressão |
| Deploy automático a cada commit | ✅ `.githooks/post-commit` + hook `Stop` (espelham e empurram o repo de deploy) |
| Publicação no host | ⚠️ o Railway **enfileira**: um build slot por vez, então uma rajada de commits deixa a demo alguns commits atrás enquanto a fila drena. Diagnóstico é a aba **Deployments**, e a linha embaixo do deployment diz o motivo: `Waiting for build slot` é fila normal, `Deployment queued due to upstream GitHub issues` é a integração do Railway travada (problema do host, não nosso), `Failed` é problema nosso. **Redeploy durante a fila piora**; o que acelera é cancelar os enfileirados intermediários. Todo commit no repo vira um build, mesmo fora de `web/`, então commitar em lote é operacional. Caminho alternativo pronto: `.github/workflows/pages.yml`, faltando só ligar em **Settings → Pages → Source: GitHub Actions** (clique humano, a Action não liga sozinha). |
| Como saber, em 5s, qual versão está no ar | ✅ chip `build=<data>` no painel do harness, e `GET /js/modelos.js` (404 = host num commit antigo) |

## Melhorias já aplicadas nesta revisão
- Paper: citação do RLM (arXiv:2512.24601) e nod ao GraphRAG, que a página lista.
- Protótipo: o agente agora é instruído a usar **tabela** para dados comparativos (não lista aninhada).
- Protótipo: **tema claro/escuro** com toggle (persistente, sem flash ao abrir).
- Protótipo: dropdown de modelo, tabelas estilo Ads Manager, trace agrupado (`N×`).
- Protótipo: **streaming SSE real** no modo LLM. O texto aparece token a token enquanto o modelo
  gera; os `tool_calls` chegam fatiados e são remontados no transporte, então o loop inteiro é
  streamado sem chamada extra. No modo simulado continua o typewriter (não há LLM para streamar).
- Protótipo: **persona NEXO**. O agente deixou de ser "assistente" e virou estrategista: conclusão
  primeiro, fato separado de hipótese e de recomendação, opinião amarrada ao número, e discrepância
  entre Meta e CRM exposta em vez de resolvida em silêncio. A persona vive em `web/js/nexo.js`,
  separada do runtime, e o modo simulado segue a mesma régua (senão trocar de motor trocaria de agente).
- Protótipo: **medidor de tokens**, por chamada, por turno e por sessão, com custo em US$ quando o
  provedor devolve. ⚠️ O `usage` do streaming chega num chunk com `choices: []`, então o transporte
  captura antes de descartar o chunk por falta de delta; sem isso o número sumiria sem erro nenhum.
  `build/test_uso.js` cobre isso e mais 19 asserções, sem rede e sem chave.
- Docs: `paper/GUIA-DO-PAPER.pdf` e `CHECKLIST.pdf` (versões em PDF, mais fáceis de ler).

## Pendente no paper

Nada. Os três assuntos que estavam abertos foram escritos em 20-21/08:

| Assunto | Onde ficou |
|---|---|
| Gestão de contexto em sessão longa | §3.4, com a proposta de resumo entre sessões analisada em 6 riscos e as regras que a tornam adotável |
| Falha de tool e paralelismo | §3.5: falha vira observação e não exceção; paralelismo só em leitura sem dependência |
| Multi-conta | construído: 2º cliente no mock, seletor na UI, §4.2 no paper e `build/test_contas.js` |

## Opcionais que ficam de fora (não bloqueiam a entrega)
- Ouvir o **podcast AdzHub · Harness** e o **How I AI** e citar uma frase no §1 (reforça o critério
  "aprofundamento no estudo"). Deixei de fora do paper para não afirmar o que você ainda não ouviu.
- Um segundo cliente no mock, para mostrar multi-conta (o paper já assume um cliente por escolha de MVP).
