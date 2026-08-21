# Dataset mock AdzHub · Housewhey e Bravo Pet

Contrato **fictício** que simula as três camadas que o harness consultaria no mundo real
(Supercérebro, Apps e APIs). Não é o schema de produção da AdzHub. **Duas contas**, cada uma
numa subpasta (`housewhey/` e `bravopet/`) e cada uma coerente ponta a ponta: `ad_id` no Meta =
`utm_content` no CRM, pessoas do grafo aparecem na timeline e no WhatsApp, criativos do App
batem com os anúncios.

Cliente: **Housewhey** (e-commerce de suplementos), operação **SPOT**, time **Aline**
(tráfego), **Carolina** (gestão), **Luiza** (atendimento/WhatsApp). Janela: jun-ago/2026.

## Arquivos → tools

Cada arquivo vira uma tool do harness. Retorno sempre JSON; erro `{ "ok": false, "error": "..." }`.

🔴 **Nenhuma tool recebe o cliente como argumento.** A conta é **estado do harness**, não
parâmetro: o modelo não tem como pedir dado de outro cliente, porque o campo não existe na
assinatura. Quem troca de conta é o humano, e o harness reescopa as três camadas de uma vez.
`build/test_contas.js` falha se alguma tool voltar a expor esse campo.

| Tool | Camada simulada | Arquivo | Args (os de verdade) |
|---|---|---|---|
| `search_client_context` | Supercérebro · grafo | `supercerebro_graph.json` | `{ query? }` |
| `get_timeline` | Supercérebro · temporal | `supercerebro_timeline.json` | `{ since?, until? }` |
| `list_ads` | API Meta Ads | `api_meta_ads.json` | `{ since?, until? }` |
| `get_ad_insights` | API Meta Ads | `api_meta_ads.json` | `{ ad_id }` |
| `get_leads` | API CRM | `api_crm_leads.json` | `{ since?, until?, utm_content? }` |
| `run_app_analise_criativos` | App metodologia | `app_analise_criativos.json` | nenhum |
| `get_mapa_solucao` | App contexto de marca | `app_mapa_solucao.json` | nenhum |
| `search_conversations` | Memória de canal | `conversas.json` | `{ query? }` |

Distinção que a tese defende: **APIs são tools** (dado cru, o LLM chama quando precisa),
**Supercérebro é memória/ambiente** (contexto temporal hidratado, não consultado às cegas),
**Apps são skills** (metodologia encapsulada; o harness chama o app, não reimplementa no prompt).

## 3 prompts de teste (cada um força ≥ 2 tools)

1. **Relatório de criativos × resultado real.**
   *"Cruze o gasto por anúncio no Meta com as vendas no CRM por `utm_content` e me diga qual criativo está caro e qual está barato."*
   → `list_ads` + `get_leads`. O agente descobre sozinho o custo por venda real de cada anúncio.

2. **Diagnóstico de conta.**
   *"O CPA do Ômega 3 subiu. Investigue a causa e me diga o próximo passo."*
   → `get_ad_insights` + `get_leads` + `run_app_analise_criativos` (+ budget do `list_ads`).
   Um único achado costura vários sintomas.

3. **Origem inconsistente.**
   *"Vários leads dizem que vieram do Google, mas quase não rodamos Google. O que está acontecendo?"*
   → `get_leads` + `search_conversations`. Atribuição declarada vs UTM.

Bônus (pauta): *"Monte a pauta da próxima call com a Housewhey."* → `get_timeline` +
`search_conversations` + `list_ads`.

## O que o avaliador deve conseguir ver

O painel de trace do chat mostrando o harness **orquestrar 2+ tools**, hidratar contexto do
supercérebro antes do loop, chamar um App de metodologia, e devolver uma resposta **ancorada em
números do mock** (não um palpite do LLM). Os problemas abaixo estão plantados no dado e **não
rotulados**. Quem descobre é o agente.

## Problemas plantados (gabarito, não está no dado)

> Isto existe só para o avaliador conferir. Nenhum arquivo do dataset contém estas conclusões.

- **P1 · Criativo caro vs barato.** `ad_omega3_depoimento`: gasto R$4.200, **2 vendas → CPA R$2.100**.
  `ad_omega3_antesdepois`: gasto R$900, **9 vendas → CPA R$100**. O vencedor está subfinanciado e o
  perdedor consome o adset. Só aparece cruzando Meta × CRM.
- **P2 · Criativo saturado.** `ad_omega3_depoimento`: hook_rate **32% → 18%** em 4 semanas, frequência
  **1,8 → 4,8**. O App `analise_criativos` recomenda **pausar**.
- **P3 · Origem inconsistente.** **12 leads declaram "Google"**, mas só **4** têm UTM de Google; os
  outros 8 vieram do Instagram (`ad_whey_ugc`). Decidir verba pela origem declarada erraria o alvo.
- **P4 · Aprovação travada.** Campanha `camp_creatina` em `in_review`, gasto 0. Timeline + WhatsApp
  mostram o motivo: a peça diz "resultado garantido", que o `mapa_solucao` lista em **não pode falar**.
- **P5 · Spend vs budget.** `camp_omega3` gastou **R$6.200 contra orçamento de R$5.000 (124%)**, puxado
  pelo mesmo depoimento. Uma ação (pausar o depoimento) resolve P1, P2 e P5 de uma vez.

Regerar: `python3 build/gen_dataset.py adzhub-harness/data` (determinístico).


---

## Segundo cliente: Bravo Pet (`data/bravopet/`)

Existe para provar **isolamento entre contas**, não para ser um segundo quebra-cabeça.
É de propósito um **grupo de controle**: os mesmos 7 arquivos, com a situação invertida.

| Sinal | Housewhey | Bravo Pet |
|---|---|---|
| Verba | estoura o teto (R$ 6.200 vs R$ 5.000) | **sobra** (R$ 1.180 de R$ 100/dia) |
| Criativo | saturado (hook 32% → 18%, freq. 1,8 → 4,8) | estável (hook 31%, freq. 1,6) |
| CPA | R$ 2.100 no pior criativo | R$ 62, abaixo da meta de R$ 80 |
| Origem declarada × UTM | **mente** (12 dizem Google, 4 têm UTM Google) | bate |
| Peça bloqueada | sim (claim proibido) | nenhuma |

**Como usar na avaliação:** faça a mesma pergunta nas duas contas. Se as respostas forem
parecidas, o agente não está lendo o dado. `build/test_contas.js` trava isso sem browser,
inclusive a invariante de que **nenhuma tool expõe `cliente` ao modelo**.
