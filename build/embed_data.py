#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Le os 7 JSONs do dataset e escreve web/data.js (classic script global).
Assim o protótipo roda de file:// (duplo clique) e de qualquer host estatico,
sem depender de fetch() nem de servidor."""
import json, os
# ⚠️ Caminhos relativos ao PRÓPRIO script, nunca ao diretório de onde ele foi
# chamado: o projeto vive em dois lugares (workspace e repo público de entrega) e
# um caminho fixo como "adzhub-harness/data" só funciona em um deles. No outro o
# comando documentado no README quebra com FileNotFoundError.
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(RAIZ, "data")
OUT = os.path.join(RAIZ, "web", "data.js")
files = {
  "graph": "supercerebro_graph.json",
  "timeline": "supercerebro_timeline.json",
  "meta": "api_meta_ads.json",
  "crm": "api_crm_leads.json",
  "appCriativos": "app_analise_criativos.json",
  "mapa": "app_mapa_solucao.json",
  "conversas": "conversas.json",
}
def carregar(pasta):
    d = {k: json.load(open(os.path.join(SRC, pasta, v), encoding="utf-8")) for k, v in files.items()}
    # o nome de exibicao sai do proprio grafo (no hub do cliente), para nao haver
    # uma segunda lista de nomes divergindo do dado
    cid = d["graph"]["client_id"]
    no = next((n for n in d["graph"]["nodes"] if n["id"] == cid), None)
    d["nome"] = no["label"] if no else pasta
    return d

pastas = sorted(x for x in os.listdir(SRC) if os.path.isdir(os.path.join(SRC, x)))
data = {"padrao": "housewhey" if "housewhey" in pastas else pastas[0],
        "clientes": {p: carregar(p) for p in pastas}}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    f.write("// GERADO por build/embed_data.py - nao editar a mao. Fonte: data/<cliente>/*.json\n")
    f.write("window.ADZHUB_DATA = ")
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write(";\n")
print("wrote", OUT, os.path.getsize(OUT), "bytes")
