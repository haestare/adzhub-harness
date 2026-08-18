#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gerador do dataset mock AdzHub (cliente Housewhey).
Determinístico (sem random/now): datas derivadas de uma base fixa.
Emite 7 JSONs cruzados + README em <outdir>.
Problemas plantados (NAO rotulados no dado):
  P1  criativo caro vs barato + verba no criativo errado  (Meta x CRM + budget)
  P2  criativo saturado (hook_rate caindo, freq subindo)  (get_ad_insights series + App)
  P3  origem inconsistente: origem_declarada mente vs UTM  (get_leads)
  P4  aprovacao travada (peca em review, spend 0)          (timeline + conversas + mapa)
  P5  spend vs budget (adset estourando verba diaria)      (Meta budget vs spend)
"""
import json, os, sys, datetime

OUT = sys.argv[1] if len(sys.argv) > 1 else "adzhub-harness/data"
os.makedirs(OUT, exist_ok=True)
BASE = datetime.date(2026, 6, 1)          # base fixa
def d(offset_days):                        # data ISO a partir da base
    return (BASE + datetime.timedelta(days=offset_days)).isoformat()
def dt(offset_days, hh, mm):
    day = BASE + datetime.timedelta(days=offset_days)
    return f"{day.isoformat()}T{hh:02d}:{mm:02d}:00-03:00"

CLIENT = "cli_housewhey"

def dump(name, obj):
    p = os.path.join(OUT, name)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
    print("wrote", p, os.path.getsize(p), "bytes")

# ------------------------------------------------------------------ 1. GRAFO
graph = {
  "client_id": CLIENT,
  "generated_note": "Recorte de memoria da operacao. Use search_client_context para trazer so o relevante.",
  "nodes": [
    {"id":"hub_spot","type":"hub","label":"SPOT","props":{"kind":"agencia"}},
    {"id":"cli_housewhey","type":"hub","label":"Housewhey","props":{"segmento":"e-commerce de suplementos","ticket_medio_brl":179,"entrou_em":d(3)}},
    {"id":"p_aline","type":"person","label":"Aline","props":{"role":"tráfego","canais":["Meta Ads","Google Ads"]}},
    {"id":"p_carolina","type":"person","label":"Carolina","props":{"role":"gestão de conta","responsavel_por":"KPIs e relação com cliente"}},
    {"id":"p_luiza","type":"person","label":"Luiza","props":{"role":"atendimento/WhatsApp","responsavel_por":"qualificação de leads"}},
    {"id":"p_rodrigo","type":"person","label":"Rodrigo","props":{"role":"cliente (dono da Housewhey)"}},
    {"id":"ch_meta","type":"channel","label":"Meta Ads","props":{}},
    {"id":"ch_google","type":"channel","label":"Google Ads","props":{"observacao":"verba baixa, quase parado"}},
    {"id":"ch_crm","type":"channel","label":"CRM","props":{"ferramenta":"RD Station"}},
    {"id":"ch_whatsapp","type":"channel","label":"WhatsApp","props":{}},
    {"id":"camp_namorados","type":"campaign","label":"Dia dos Namorados","props":{"status":"encerrada","janela":"mai-jun/2026","aprendizado":"kits de presente performaram melhor que produto avulso"}},
    {"id":"camp_omega3","type":"campaign","label":"Ômega 3 - Saúde em Dia","props":{"status":"ativa","foco_atual":True,"monthly_budget_brl":5000}},
    {"id":"camp_whey","type":"campaign","label":"Whey Sempre","props":{"status":"ativa","tipo":"evergreen"}},
    {"id":"camp_creatina","type":"campaign","label":"Creatina - Foco Total","props":{"status":"em aprovação","observacao":"pecas aguardando cliente desde "+d(66)}},
    {"id":"asset_creatina_foco","type":"asset","label":"Vídeo Creatina 'Foco Total'","props":{"formato":"video","status":"aguardando aprovação"}},
    {"id":"asset_creatina_benef","type":"asset","label":"Imagem Creatina 'Benefícios'","props":{"formato":"imagem","status":"aguardando aprovação"}},
    {"id":"asset_omega3_depo","type":"asset","label":"Vídeo Depoimento Ana","props":{"formato":"video","no_ar_desde":d(35)}},
    {"id":"task_aprovar_creatina","type":"task","label":"Aprovar peças de Creatina","props":{"status":"aberta","dono":"p_rodrigo","aberta_em":d(66)}},
    {"id":"meet_semanal","type":"meeting","label":"Call semanal Housewhey","props":{"recorrencia":"quinzenal","ultima":d(68)}}
  ],
  "edges": [
    {"from":"p_aline","to":"hub_spot","rel":"MEMBER_OF"},
    {"from":"p_carolina","to":"hub_spot","rel":"MEMBER_OF"},
    {"from":"p_luiza","to":"hub_spot","rel":"MEMBER_OF"},
    {"from":"hub_spot","to":"cli_housewhey","rel":"OPERATES"},
    {"from":"p_aline","to":"ch_meta","rel":"OPERATES"},
    {"from":"p_aline","to":"ch_google","rel":"OPERATES"},
    {"from":"p_luiza","to":"ch_whatsapp","rel":"OPERATES"},
    {"from":"p_carolina","to":"camp_omega3","rel":"TRACKS"},
    {"from":"p_carolina","to":"camp_whey","rel":"TRACKS"},
    {"from":"camp_namorados","to":"cli_housewhey","rel":"MEMBER_OF"},
    {"from":"camp_omega3","to":"cli_housewhey","rel":"MEMBER_OF"},
    {"from":"camp_whey","to":"cli_housewhey","rel":"MEMBER_OF"},
    {"from":"camp_creatina","to":"cli_housewhey","rel":"MEMBER_OF"},
    {"from":"camp_omega3","to":"ch_meta","rel":"TRACKS"},
    {"from":"camp_whey","to":"ch_meta","rel":"TRACKS"},
    {"from":"asset_omega3_depo","to":"camp_omega3","rel":"MEMBER_OF"},
    {"from":"asset_creatina_foco","to":"camp_creatina","rel":"MEMBER_OF"},
    {"from":"asset_creatina_benef","to":"camp_creatina","rel":"MEMBER_OF"},
    {"from":"p_rodrigo","to":"asset_creatina_foco","rel":"APPROVES"},
    {"from":"p_rodrigo","to":"asset_creatina_benef","rel":"APPROVES"},
    {"from":"task_aprovar_creatina","to":"camp_creatina","rel":"MENTIONS"},
    {"from":"meet_semanal","to":"camp_omega3","rel":"MENTIONS"},
    {"from":"meet_semanal","to":"camp_creatina","rel":"MENTIONS"}
  ]
}
dump("supercerebro_graph.json", graph)

# --------------------------------------------------------------- 2. TIMELINE
timeline = {
  "client_id": CLIENT,
  "events": [
    {"id":"ev_onboard","occurred_at":dt(3,10,0),"title":"Housewhey entra na operação SPOT",
     "summary":"Rodrigo fecha com a SPOT. Aline assume tráfego, Carolina a gestão da conta e Luiza o atendimento no WhatsApp.",
     "actor_ids":["p_carolina","p_rodrigo"],"related_node_ids":["cli_housewhey","hub_spot"]},
    {"id":"ev_namorados_brief","occurred_at":dt(8,15,30),"title":"Briefing da campanha de Namorados",
     "summary":"Reunião + WhatsApp para alinhar criativos de Dia dos Namorados. Decisão: focar em kits de presente.",
     "actor_ids":["p_aline","p_carolina","p_rodrigo"],"related_node_ids":["camp_namorados"]},
    {"id":"ev_namorados_fim","occurred_at":dt(28,18,0),"title":"Namorados encerra com kits acima da meta",
     "summary":"Campanha de Namorados encerrada. Aprendizado registrado: kit de presente converte melhor que produto avulso.",
     "actor_ids":["p_carolina"],"related_node_ids":["camp_namorados"]},
    {"id":"ev_omega3_sobe","occurred_at":dt(35,9,0),"title":"Ômega 3 sobe no Meta Ads",
     "summary":"Campanha de Ômega 3 entra no ar. Vídeo de depoimento da Ana é escalado para público frio. Carolina passa a acompanhar o CPA.",
     "actor_ids":["p_aline","p_carolina"],"related_node_ids":["camp_omega3","asset_omega3_depo","ch_meta"]},
    {"id":"ev_whey_evergreen","occurred_at":dt(40,11,0),"title":"Whey evergreen reforçado",
     "summary":"Aline reforça a campanha evergreen de Whey com um novo UGC. Volume de leads sobe no WhatsApp.",
     "actor_ids":["p_aline","p_luiza"],"related_node_ids":["camp_whey"]},
    {"id":"ev_luiza_origem","occurred_at":dt(63,14,20),"title":"Luiza estranha origem dos leads",
     "summary":"No atendimento, vários leads dizem que acharam a Housewhey 'no Google', mas o investimento em Google está quase parado. Luiza registra a dúvida para a call.",
     "actor_ids":["p_luiza"],"related_node_ids":["ch_whatsapp","ch_google"]},
    {"id":"ev_creatina_envio","occurred_at":dt(66,16,0),"title":"Peças de Creatina enviadas para aprovação",
     "summary":"Aline finaliza as peças da nova campanha de Creatina e envia para o Rodrigo aprovar. Lançamento depende do aceite dele.",
     "actor_ids":["p_aline","p_carolina"],"related_node_ids":["camp_creatina","asset_creatina_foco","asset_creatina_benef","task_aprovar_creatina"]},
    {"id":"ev_call_semanal","occurred_at":dt(68,10,0),"title":"Call semanal: CPA do Ômega 3 preocupa",
     "summary":"Carolina levanta que o custo por venda do Ômega 3 subiu. Rodrigo pede clareza sobre qual anúncio está puxando o custo. Aprovação da Creatina fica pendente.",
     "actor_ids":["p_carolina","p_aline","p_rodrigo"],"related_node_ids":["camp_omega3","camp_creatina","meet_semanal"]},
    {"id":"ev_agora","occurred_at":dt(75,9,0),"title":"Hoje: decidir realocação e destravar Creatina",
     "summary":"Pendências abertas: revisar os criativos de Ômega 3, decidir realocação de verba e destravar a aprovação da Creatina com o cliente.",
     "actor_ids":["p_carolina","p_aline"],"related_node_ids":["camp_omega3","camp_creatina"]}
  ]
}
dump("supercerebro_timeline.json", timeline)

# --------------------------------------------------------------- 3. META ADS
def week(o): return d(o)
def ad(ad_id, name, ctype, audience, status, spend, imp, clicks, hook, freq, meta_conv, series):
    ctr = round(clicks/imp*100, 2) if imp else 0.0
    cpc = round(spend/clicks, 2) if clicks else 0.0
    return {
      "ad_id": ad_id, "ad_name": name, "creative_type": ctype, "audience": audience,
      "status": status, "spend_brl": spend, "impressions": imp, "clicks": clicks,
      "ctr_pct": ctr, "cpc_brl": cpc, "hook_rate_pct": hook, "frequency": freq,
      "meta_reported_conversions": meta_conv, "utm_content": ad_id,
      "insights": {"series_weekly": series}
    }

meta = {
  "client_id": CLIENT, "currency": "BRL",
  "period": {"since": d(30), "until": d(75)},
  "note": "meta_reported_conversions e o que o Gerenciador atribui (inclui view-through). A verdade de venda esta no CRM.",
  "campaigns": [
    {"campaign_id":"camp_omega3","name":"Ômega 3 - Saúde em Dia","objective":"conversions","status":"active",
     "monthly_budget_brl":5000,
     "adsets":[
       {"adset_id":"as_omega3_frio","name":"Ômega 3 · Público Frio","status":"active","daily_budget_brl":150,"optimization":"leads",
        "ads":[
          ad("ad_omega3_depoimento","Depoimento Ana - Ômega 3","video","frio","active",4200.00,210000,2100,18.0,4.8,14,
             [{"week":week(35),"spend":760,"impressions":48000,"clicks":610,"hook_rate_pct":32.0,"frequency":1.8},
              {"week":week(42),"spend":980,"impressions":52000,"clicks":540,"hook_rate_pct":27.0,"frequency":2.6},
              {"week":week(49),"spend":1150,"impressions":55000,"clicks":470,"hook_rate_pct":21.0,"frequency":3.7},
              {"week":week(56),"spend":1310,"impressions":55000,"clicks":480,"hook_rate_pct":18.0,"frequency":4.8}]),
          ad("ad_omega3_antesdepois","Antes e Depois - Ômega 3","imagem","frio","active",900.00,60000,1200,41.0,1.6,11,
             [{"week":week(35),"spend":210,"impressions":14000,"clicks":270,"hook_rate_pct":39.0,"frequency":1.2},
              {"week":week(42),"spend":225,"impressions":15000,"clicks":300,"hook_rate_pct":41.0,"frequency":1.4},
              {"week":week(49),"spend":230,"impressions":15500,"clicks":315,"hook_rate_pct":42.0,"frequency":1.5},
              {"week":week(56),"spend":235,"impressions":15500,"clicks":315,"hook_rate_pct":41.0,"frequency":1.6}])
        ]},
       {"adset_id":"as_omega3_remkt","name":"Ômega 3 · Remarketing","status":"active","daily_budget_brl":40,"optimization":"leads",
        "ads":[
          ad("ad_omega3_oferta","Oferta 3 potes - Ômega 3","carrossel","remarketing","active",1100.00,30000,900,26.0,3.1,9,
             [{"week":week(35),"spend":250,"impressions":7000,"clicks":210,"hook_rate_pct":27.0,"frequency":2.4},
              {"week":week(56),"spend":300,"impressions":8000,"clicks":230,"hook_rate_pct":25.0,"frequency":3.1}])
        ]}
     ]},
    {"campaign_id":"camp_whey","name":"Whey Sempre","objective":"leads","status":"active","monthly_budget_brl":4000,
     "adsets":[
       {"adset_id":"as_whey_frio","name":"Whey · Público Frio","status":"active","daily_budget_brl":120,"optimization":"leads",
        "ads":[
          ad("ad_whey_sacola","Sacola cheia - Whey","imagem","frio","active",1600.00,90000,1400,22.0,2.2,10,
             [{"week":week(40),"spend":520,"impressions":30000,"clicks":470,"hook_rate_pct":23.0,"frequency":1.9},
              {"week":week(56),"spend":540,"impressions":30000,"clicks":460,"hook_rate_pct":21.0,"frequency":2.2}]),
          ad("ad_whey_ugc","UGC 'minha rotina' - Whey","video","frio","active",2000.00,120000,2600,35.0,2.0,22,
             [{"week":week(40),"spend":640,"impressions":39000,"clicks":860,"hook_rate_pct":36.0,"frequency":1.6},
              {"week":week(56),"spend":690,"impressions":41000,"clicks":870,"hook_rate_pct":34.0,"frequency":2.0}])
        ]}
     ]},
    {"campaign_id":"camp_creatina","name":"Creatina - Foco Total","objective":"conversions","status":"in_review","monthly_budget_brl":0,
     "adsets":[
       {"adset_id":"as_creatina_lanc","name":"Creatina · Lançamento","status":"paused","daily_budget_brl":0,"optimization":"leads",
        "ads":[
          ad("ad_creatina_foco","Vídeo Foco Total - Creatina","video","frio","in_review",0.0,0,0,0.0,0.0,0,[]),
          ad("ad_creatina_benef","Benefícios - Creatina","imagem","frio","in_review",0.0,0,0,0.0,0.0,0,[])
        ]}
     ]}
  ]
}
dump("api_meta_ads.json", meta)

# --------------------------------------------------------------- 4. CRM LEADS
NAMES = ["Bruna Alves","Carlos Nunes","Daniela Rocha","Eduardo Lima","Fernanda Souza","Gabriel Pinto",
"Helena Castro","Igor Ramos","Juliana Dias","Kleber Antunes","Larissa Mota","Marcos Vinícius",
"Natália Prado","Otávio Correia","Patrícia Gomes","Rafael Teixeira","Sabrina Melo","Thiago Barros",
"Vanessa Cardoso","William Freitas","Amanda Rios","Bruno Sales","Camila Duarte","Diego Farias",
"Elaine Moura","Felipe Aragão","Giovana Reis","Hugo Peixoto","Isabela Nogueira","João Vitor",
"Karina Lopes","Leandro Cunha","Mariana Assis","Nelson Braga","Olívia Sampaio","Pedro Henrique",
"Queila Matos","Ricardo Vasco","Simone Tavares","Tatiane Brito","Ulisses Prado","Vera Lúcia",
"Wagner Diniz","Yasmin Costa","Zeca Andrade","Alice Bonfim","Breno Galvão","Cíntia Rabelo",
"Davi Queiroz","Erika Solano","Fábio Menezes","Gisele Amaral","Heitor Vale","Iara Bittencourt"]
_ni = [0]
def nm():
    n = NAMES[_ni[0] % len(NAMES)]; _ni[0]+=1; return n

leads = []
_lc = [0]
def add_leads(ad_id, product_value, counts, day0, source="facebook", medium="paid_social",
              origem_true_label="Instagram", mislabel=None):
    """counts = dict(status->n). mislabel: list of origem_declarada usados p/ mentir (P3)."""
    order = []
    for st in ("venda","agendamento","perdido","lead"):
        order += [st]*counts.get(st,0)
    n = len(order)
    for i, st in enumerate(order):
        _lc[0]+=1
        day = day0 + (i % 20)
        # origem declarada: normalmente bate; para whey_ugc, a maioria mente (lista com peso p/ Google)
        if mislabel and st != "venda" and (i % 4 != 3):
            origem = mislabel[i % len(mislabel)]
        else:
            origem = origem_true_label
        rec = {
          "lead_id": f"ld_{_lc[0]:04d}",
          "nome": nm(),
          "created_at": dt(day, 9 + (i % 9), (i*7) % 60),
          "status": st,
          "value_brl": product_value if st == "venda" else 0,
          "utm_source": source,
          "utm_medium": medium,
          "utm_content": ad_id,
          "origem_declarada": origem
        }
        leads.append(rec)

# P1/P2 Ômega 3 depoimento: muito lead, poucas vendas -> CPA 4200/2 = 2100
add_leads("ad_omega3_depoimento", 180, {"venda":2,"agendamento":5,"perdido":7,"lead":10}, 36,
          source="instagram", origem_true_label="Instagram")
# Ômega 3 antes/depois: barato e converte -> CPA 900/9 = 100
add_leads("ad_omega3_antesdepois", 180, {"venda":9,"agendamento":4,"perdido":3,"lead":4}, 37,
          source="facebook", origem_true_label="Facebook")
# Ômega 3 oferta remkt: CPA 1100/6 = 183
add_leads("ad_omega3_oferta", 180, {"venda":6,"agendamento":2,"perdido":1,"lead":3}, 38,
          source="instagram", origem_true_label="Instagram")
# Whey sacola: CPA 1600/7 = 228
add_leads("ad_whey_sacola", 150, {"venda":7,"agendamento":3,"perdido":3,"lead":3}, 41,
          source="facebook", origem_true_label="Facebook")
# P3 Whey UGC: CPA 2000/8 = 250; metade mente a origem (diz Google/Indicacao)
add_leads("ad_whey_ugc", 150, {"venda":8,"agendamento":6,"perdido":7,"lead":5}, 42,
          source="instagram", origem_true_label="Instagram",
          mislabel=["Google","Google","Indicação de amigo","Google","Não lembro"])
# Base nao-paga real: Google organico (poucos) + direto
add_leads("_organic_google", 180, {"venda":2,"lead":2}, 45, source="google", medium="organic",
          origem_true_label="Google")
add_leads("_direct", 150, {"venda":1,"lead":1}, 50, source="(direct)", medium="none",
          origem_true_label="Indicação de amigo")

crm = {
  "client_id": CLIENT,
  "note": "utm_content casa com ad_id do Meta. origem_declarada e o que o lead responde no atendimento e pode divergir do UTM.",
  "leads": leads
}
dump("api_crm_leads.json", crm)

# --------------------------------------------------- 5. APP analise criativos
app_criativos = {
  "client_id": CLIENT, "app": "analise_criativos", "gerado_em": d(75),
  "metodologia": "Nota de gancho (hook) + clareza de CTA + adequação ao palco (público). Recomendação: seguir | pausar | variar.",
  "ranking": [
    {"ad_id":"ad_omega3_antesdepois","posicao":1,"nota_hook":9.0,"nota_cta":8.5,"palco":"frio",
     "recomendacao":"variar","racional":"Melhor eficiência da conta. Gancho visual forte e estável. Vale escalar verba e testar variações antes de saturar.",
     "brief_sugerido":{"publico":"frio - interessados em saúde/longevidade","hook":"Comparativo visual em 3 segundos","mensagem":"Constância traz resultado; prova social real","cta":"Quero começar hoje","metrica_sucesso":"manter CPA de venda < R$150 ao dobrar verba"}},
    {"ad_id":"ad_whey_ugc","posicao":2,"nota_hook":8.0,"nota_cta":6.5,"palco":"frio",
     "recomendacao":"variar","racional":"Volume alto de cliques, mas CTA fraco e qualificação irregular no atendimento. Testar CTA mais específico.",
     "brief_sugerido":{"publico":"frio - fitness/rotina","hook":"Rotina real do cliente (UGC)","mensagem":"Praticidade no dia a dia","cta":"Ver sabores e preço","metrica_sucesso":"subir taxa lead→venda acima de 20%"}},
    {"ad_id":"ad_omega3_oferta","posicao":3,"nota_hook":6.5,"nota_cta":7.5,"palco":"remarketing",
     "recomendacao":"seguir","racional":"Cumpre o papel de fundo de funil. Sem urgência de mexer.","brief_sugerido":None},
    {"ad_id":"ad_whey_sacola","posicao":4,"nota_hook":5.5,"nota_cta":6.0,"palco":"frio",
     "recomendacao":"seguir","racional":"Mediano. Segura enquanto houver criativo melhor para escalar.","brief_sugerido":None},
    {"ad_id":"ad_omega3_depoimento","posicao":5,"nota_hook":3.5,"nota_cta":6.0,"palco":"frio",
     "recomendacao":"pausar","racional":"Gancho despencou e frequência alta: sinais de fadiga/saturação no mesmo público. Custo por resultado real subiu muito. Pausar e substituir por variação nova.",
     "brief_sugerido":{"publico":"frio - saúde 35+","hook":"Nova abertura em 3s (evitar rosto já batido)","mensagem":"Benefício concreto sem promessa de cura","cta":"Quero saber mais","metrica_sucesso":"hook_rate > 30% na 1a semana"}}
  ],
  "pecas_bloqueadas": [
    {"ad_id":"ad_creatina_foco","status":"aguardando aprovação do cliente","desde":d(66)},
    {"ad_id":"ad_creatina_benef","status":"aguardando aprovação do cliente","desde":d(66)}
  ]
}
dump("app_analise_criativos.json", app_criativos)

# --------------------------------------------------- 6. APP mapa de solucao
mapa = {
  "client_id": CLIENT, "app": "mapa_solucao", "atualizado_em": d(60),
  "marca": "Housewhey",
  "oferta": "Suplementos para o dia a dia: Whey Protein, Ômega 3, Creatina e multivitamínicos. Venda direta pelo site com atendimento no WhatsApp.",
  "promessa": "Constância simples: suplemento de qualidade, entrega rápida e acompanhamento humano.",
  "prova": ["+40 mil pedidos entregues","Selo de qualidade e laudo dos lotes","Avaliações reais de clientes no site"],
  "objeções": ["'Será que funciona pra mim?'","Preço vs concorrente de marketplace","Prazo e custo de entrega","Medo de sabor ruim"],
  "tom_de_voz": "Próximo, direto e sem hype. Fala de rotina, não de milagre.",
  "nao_pode_falar": [
    "Não prometer cura ou tratamento de doença (restrição sanitária/ANVISA).",
    "Não garantir emagrecimento ou ganho de massa em prazo determinado.",
    "Evitar 'antes e depois' que sugira resultado garantido; usar prova social com ressalva."
  ],
  "observacao_operacional": "As peças de Creatina em aprovação usam a palavra 'resultado garantido' e por isso estão em revisão com o cliente."
}
dump("app_mapa_solucao.json", mapa)

# --------------------------------------------------------------- 7. CONVERSAS
conversas = {
  "client_id": CLIENT,
  "threads": [
    {"id":"conv_call_68","tipo":"reuniao","canal":"Google Meet","occurred_at":dt(68,10,0),
     "participantes":["p_carolina","p_aline","p_rodrigo"],"titulo":"Ata - Call semanal Housewhey",
     "bullets":[
       "Carolina: custo por venda do Ômega 3 subiu nas últimas 2 semanas; Rodrigo quer saber QUAL anúncio está puxando o custo.",
       "Aline: o vídeo de depoimento roda há semanas no mesmo público; suspeita de desgaste, mas falta cruzar com venda real do CRM.",
       "Rodrigo: 'no Gerenciador aparece bastante resultado, mas minha venda não acompanhou'.",
       "Creatina: peças ainda não aprovadas. Rodrigo pediu revisão de uma frase antes de liberar.",
       "Combinado: SPOT traz na próxima call o relatório de criativo x venda e uma proposta de realocação de verba."
     ]},
    {"id":"conv_wpp_rodrigo","tipo":"whatsapp","canal":"WhatsApp","occurred_at":dt(69,19,12),
     "participantes":["p_carolina","p_rodrigo"],"titulo":"WhatsApp - Carolina e Rodrigo (aprovação Creatina)",
     "mensagens":[
       {"de":"p_carolina","texto":"Rodrigo, seguem as duas peças de Creatina pra aprovar. Assim que liberar eu subo ainda essa semana."},
       {"de":"p_rodrigo","texto":"Vi aqui. Só não curti o 'resultado garantido' no vídeo, acho que a gente não pode falar isso né?"},
       {"de":"p_carolina","texto":"Isso, melhor ajustar essa frase mesmo. Te devolvo a versão corrigida pra liberar."},
       {"de":"p_rodrigo","texto":"Fechou, me manda que aprovo rápido."}
     ]},
    {"id":"conv_wpp_luiza","tipo":"whatsapp","canal":"WhatsApp","occurred_at":dt(63,14,20),
     "participantes":["p_luiza","p_carolina"],"titulo":"WhatsApp - Luiza e Carolina (origem dos leads)",
     "mensagens":[
       {"de":"p_luiza","texto":"Caro, tá vindo bastante lead falando que achou a gente no Google. Mas a gente quase não roda Google, né?"},
       {"de":"p_carolina","texto":"Quase nada. O grosso é Meta. Deixa eu ver se o pessoal tá confundindo por causa do vídeo do Whey que tá bombando."},
       {"de":"p_luiza","texto":"Pode ser. Quando pergunto de novo, muita gente lembra de um vídeo no Instagram."}
     ]}
  ]
}
dump("conversas.json", conversas)

print("\nOK - dataset gerado em", OUT)
