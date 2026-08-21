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
data = {k: json.load(open(os.path.join(SRC, v), encoding="utf-8")) for k, v in files.items()}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    f.write("// GERADO por build/embed_data.py — nao editar a mao. Fonte: adzhub-harness/data/*.json\n")
    f.write("window.ADZHUB_DATA = ")
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write(";\n")
print("wrote", OUT, os.path.getsize(OUT), "bytes")
