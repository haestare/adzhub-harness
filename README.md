# AdzHub · Desafio Harness Agêntico

Entrega do desafio: um **paper** defendendo uma arquitetura de harness para o chat agêntico
de marketing da AdzHub, mais um **protótipo web** de chat que ilustra a tese sobre um dataset
mock (cliente Housewhey).

O agente tem persona própria: **NEXO**, estrategista de performance. Ele não devolve relatório,
devolve decisão, na ordem *o que aconteceu → por que aconteceu → o que eu faria agora*, separando
**fato** de **hipótese** e de **recomendação**. A persona mora em `web/js/nexo.js`, fora do runtime:
o loop é mecanismo, a persona é dado, e trocar uma não mexe na outra.

**Tese (Harness Tri-Camada):** o erro comum é tratar tudo como *tool*. Este harness usa um
mecanismo por camada do domínio: a **memória** (supercérebro: grafo + linha do tempo) é
hidratada como **ambiente** antes do loop; as **APIs** (Meta, CRM) são **tools** num loop ReAct;
os **Apps** de metodologia são **skills** encapsuladas. É um híbrido de ReAct + contexto-como-ambiente
(RLM) + skills.

## Comece por aqui

| | |
|---|---|
| **Paper (a entrega)** | [`paper/paper.pdf`](paper/paper.pdf) · 6 páginas, PT-BR |
| **Demo no ar** | https://adzhub-harness-production.up.railway.app |
| **Rodar local** | abra `web/index.html` (roda de `file://`, sem servidor e sem chave) |
| **Gabarito do dataset** | [`data/README.md`](data/README.md) · os 5 problemas plantados |

## O que tem aqui

```
adzhub-harness/
├── paper/
│   ├── paper.pdf        ← ENTREGA PRINCIPAL (6 páginas, arXiv 2-col, PT-BR)
│   └── paper.html       ← fonte do PDF
├── web/                 ← protótipo de chat (estático, sem backend)
│   ├── index.html
│   ├── styles.css
│   ├── data.js          ← dataset embutido (roda de file:// sem servidor)
│   ├── data/            ← os 7 JSONs crus por cliente (mesmo dado)
│   └── js/  tools.js · usage.js · nexo.js · planner.js · openrouter.js · harness.js
│             modelos.js · dropdown.js · comandos.js · entrada.js · app.js
├── data/                ← dataset mock por cliente (housewhey/ e bravopet/) + gabarito
└── build/               ← scripts de geração (dataset, PDF, testes)
```

## Rodar o protótipo

**Jeito mais simples:** abra `web/index.html` no navegador (duplo clique). O dataset está embutido
em `data.js`, então funciona de `file://` sem servidor.

**Servindo por HTTP** (recomendado se o navegador reclamar de `file://`):
```bash
cd web && python3 -m http.server 8099
# abra http://localhost:8099
```

### Dois motores

- **Simulado (padrão, sem chave):** um planejador roteirizado executa as **tools reais** sobre o
  mock e compõe a resposta a partir dos números. Prova que o dado sustenta a conclusão. Basta abrir
  e clicar num atalho.
- **LLM (OpenRouter):** abra **⚙ Configurar**, escolha "LLM" e cole sua `OPENROUTER_API_KEY`. A
  chave fica **só em `sessionStorage`** do browser, nunca vai para um servidor. O modelo sai de uma
  lista buscada ao vivo na API pública da OpenRouter, filtrada por quem suporta *tool-calling* e
  dividida em três grupos: recomendados (ranqueados, #1 = mais forte), grátis, e o catálogo inteiro
  com filtro por id. O loop ReAct de verdade decide as chamadas de tool.

### Medidor de tokens

O consumo aparece em três granularidades, porque cada uma responde uma pergunta diferente:
**por chamada** (no trace) mostra por que a entrada cresce a cada passo do loop; **por turno**
(rodapé da resposta, clicável) mostra o que aquela pergunta custou, com a tabela chamada a chamada;
**por sessão** (medidor no topo) mostra o acumulado.

⚠️ Número medido e número estimado nunca se misturam. No modo LLM vem o `usage` da própria API
(inclusive custo em US$ quando o provedor devolve). No modo simulado **não existe LLM**, então o
painel mostra o que aquele mesmo turno *custaria*, reconstruído passo a passo, sempre marcado
com **≈** e com a etiqueta `estimado`.

### O que testar no chat

Quatro conversas prontas na lateral (relatório de criativos, diagnóstico da conta, origem dos leads,
pauta da call): clicar em uma **abre o fio dela e já dispara a pergunta**. Cada conversa tem
histórico e trace próprios, e trocar de fio no meio de uma resposta é permitido, porque o turno
pertence à conversa e não à tela. Cada tarefa força o harness a orquestrar **2+ tools**.
No composer: **+** anexa CSV/TSV/JSON/TXT/MD (lido no browser, cortado em 40 mil caracteres pelo
harness, e o duplo clique abre o explorador direto), o **microfone** dita pela API de fala do
navegador, **/** abre os comandos de sessão (`/tools`, `/uso`, `/limpar`, …) e o **sol/lua** troca
o tema. O painel de trace à direita mostra a
hidratação de contexto (fase), as tool calls (badge por camada: memória/api/app) e a resposta
ancorada. Cada passo é clicável e mostra args + observação (JSON).

**Duas contas.** O seletor no topo da lateral troca de cliente: Housewhey (com os 5 problemas) e
Bravo Pet, que é um **grupo de controle** com a situação invertida (verba sobrando, criativo
saudável, origem batendo). Faça a mesma pergunta nas duas: se a resposta for parecida, o agente
não está lendo o dado. A conta é **estado do harness, nunca argumento de tool**, então o modelo
não alcança dado de outro cliente.

Os **5 problemas plantados** (não rotulados no dado) e o gabarito estão em [`data/README.md`](data/README.md).

## Deploy

A demo é 100% estática (o dataset vive embutido em `web/data.js`), então qualquer host serve. Como
o Railway roda um processo, incluí um servidor mínimo em `web/server.js`: zero dependência, escuta
em `$PORT` e carimba os assets com o mtime, para um deploy novo nunca ser servido do cache antigo.

No Railway: **Deploy from GitHub repo** apontando para este repositório, **Root Directory** `web`.
Ele detecta Node pelo `package.json` da raiz e roda `npm start`. **Nenhuma variável de ambiente é
necessária**, e isso é de propósito: a chave da OpenRouter é colada pelo avaliador no próprio
browser e nunca chega ao servidor.

Há também um caminho alternativo pronto em `.github/workflows/pages.yml`, que publica a pasta `web`
no GitHub Pages a cada push. ⚠️ Ele só age depois de o Pages ser ligado à mão em
**Settings → Pages → Source: GitHub Actions**: a Action não consegue se auto-habilitar, porque
criar o site exige permissão de admin que o `GITHUB_TOKEN` do workflow não tem. Enquanto estiver
desligado, o workflow termina **verde** avisando o clique que falta, em vez de falhar a cada commit.

## Regenerar / rebuildar

```bash
# dataset determinístico (7 JSONs em data/) + embed em web/data.js
python3 build/gen_dataset.py data
python3 build/embed_data.py

# testar o harness simulado (sem browser, sem rede)
node build/test_sim.js

# testar a contabilidade de tokens (streaming SSE, loop ReAct, estimativa)
node build/test_uso.js

# testar o renderizador de markdown (títulos, listas numeradas, tabelas)
node build/test_md.js

# testar o catálogo de modelos (filtro de tool-calling, ranking, grupos) - fetch falso
node build/test_modelos.js

# testar o ditado e o anexo (reconhecedor falso, sem browser)
node build/test_voz.js

# testar o isolamento entre contas (nenhuma tool expõe `cliente` ao modelo)
node build/test_contas.js

# rebuildar o PDF do paper (usa Chromium headless)
chromium --headless=new --no-pdf-header-footer \
  --print-to-pdf=paper/paper.pdf "file://$PWD/paper/paper.html"
```

## Escopo e recorte (resumo; detalhe no paper §6 e §7)

- **Só-leitura por escolha:** nenhuma tool escreve na conta. O agente propõe; o humano executa.
- **Duas contas, dados mock:** trocar de cliente reescopa memória, APIs e Apps de uma vez, e a
  conta é **estado do harness, nunca argumento de tool**. Mas é escopo *simulado*: sem
  autenticação, sem credencial por cliente, sem isolamento no banco. A memória real (grafo
  temporal com resolução de entidade) também fica de fora do MVP, por design.
- **Sem camada de integrações:** nenhuma tela de conectar conta, nenhum OAuth, nenhuma geração
  de criativo por imagem. O paper (§7) diz por quê, e a razão principal é não conhecer o escopo
  completo pretendido, não falta de tempo.
- **Modo LLM** é code-complete mas depende da chave do avaliador (não embarco chave).
