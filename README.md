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

## O que tem aqui

```
adzhub-harness/
├── paper/
│   ├── paper.pdf        ← ENTREGA PRINCIPAL (4 páginas, arXiv 2-col, PT-BR)
│   └── paper.html       ← fonte do PDF
├── web/                 ← protótipo de chat (estático, sem backend)
│   ├── index.html
│   ├── styles.css
│   ├── data.js          ← dataset embutido (roda de file:// sem servidor)
│   ├── data/            ← os 7 JSONs crus (mesmo dado)
│   └── js/  tools.js · usage.js · nexo.js · planner.js · openrouter.js · harness.js · app.js
├── data/                ← dataset mock + README com o "gabarito" dos problemas plantados
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
- **LLM (OpenRouter):** abra **⚙ Configurar**, escolha "LLM", cole sua `OPENROUTER_API_KEY` e digite
  o id do modelo (ex.: `openai/gpt-4o-mini`). A chave fica **só em `sessionStorage`** do browser,
  nunca vai para um servidor. O loop ReAct de verdade decide as chamadas de tool.

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

Quatro atalhos prontos (relatório de criativos, diagnóstico da conta, origem dos leads, pauta da
call). Cada um força o harness a orquestrar **2+ tools**. O painel de trace à direita mostra a
hidratação de contexto (fase), as tool calls (badge por camada: memória/api/app) e a resposta
ancorada. Cada passo é clicável e mostra args + observação (JSON).

Os **5 problemas plantados** (não rotulados no dado) e o gabarito estão em [`data/README.md`](data/README.md).

## Deploy (Railway)

A demo é estática, mas o Railway roda um processo, então incluí um servidor mínimo
(`web/server.js`, zero dependência) que escuta em `$PORT`.

1. No Railway: **New Project → Deploy from GitHub repo**, escolha `haestare/Claude` e a
   branch `claude/adzhub-harness-challenge-ed1dge`.
2. Em **Settings → Root Directory**, defina `adzhub-harness/web`.
3. O Railway detecta Node (pelo `package.json`) e roda `npm start` (= `node server.js`).
   Nenhuma variável de ambiente é necessária: a key da OpenRouter é colada pelo avaliador
   no próprio browser (modo LLM), nunca no servidor.
4. A URL pública do serviço é a demo.

Alternativa sem servidor: qualquer host estático (GitHub Pages, Cloudflare Pages, Netlify
Drop) publicando a pasta `adzhub-harness/web`.

## Regenerar / rebuildar

```bash
# dataset determinístico (7 JSONs em data/) + embed em web/data.js
python3 build/gen_dataset.py adzhub-harness/data
python3 build/embed_data.py

# testar o harness simulado (sem browser, sem rede)
node build/test_sim.js

# testar a contabilidade de tokens (streaming SSE, loop ReAct, estimativa)
node build/test_uso.js

# rebuildar o PDF do paper (usa Chromium headless)
chromium --headless=new --no-pdf-header-footer \
  --print-to-pdf=paper/paper.pdf "file://$PWD/paper/paper.html"
```

## Escopo e recorte (resumo; detalhe no paper §6)

- **Só-leitura por escolha:** nenhuma tool escreve na conta. O agente propõe; o humano executa.
- **Um cliente, dados mock:** sem multi-tenant, sem auth. A memória real (grafo temporal com
  resolução de entidade) fica de fora do MVP, por design.
- **Modo LLM** é code-complete mas depende da chave do avaliador (não embarco chave).
