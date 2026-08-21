// GERADO por build/embed_data.py — nao editar a mao. Fonte: adzhub-harness/data/*.json
window.ADZHUB_DATA = {
  "graph": {
    "client_id": "cli_housewhey",
    "generated_note": "Recorte de memoria da operacao. Use search_client_context para trazer so o relevante.",
    "nodes": [
      {
        "id": "hub_spot",
        "type": "hub",
        "label": "SPOT",
        "props": {
          "kind": "agencia"
        }
      },
      {
        "id": "cli_housewhey",
        "type": "hub",
        "label": "Housewhey",
        "props": {
          "segmento": "e-commerce de suplementos",
          "ticket_medio_brl": 179,
          "entrou_em": "2026-06-04"
        }
      },
      {
        "id": "p_aline",
        "type": "person",
        "label": "Aline",
        "props": {
          "role": "tráfego",
          "canais": [
            "Meta Ads",
            "Google Ads"
          ]
        }
      },
      {
        "id": "p_carolina",
        "type": "person",
        "label": "Carolina",
        "props": {
          "role": "gestão de conta",
          "responsavel_por": "KPIs e relação com cliente"
        }
      },
      {
        "id": "p_luiza",
        "type": "person",
        "label": "Luiza",
        "props": {
          "role": "atendimento/WhatsApp",
          "responsavel_por": "qualificação de leads"
        }
      },
      {
        "id": "p_rodrigo",
        "type": "person",
        "label": "Rodrigo",
        "props": {
          "role": "cliente (dono da Housewhey)"
        }
      },
      {
        "id": "ch_meta",
        "type": "channel",
        "label": "Meta Ads",
        "props": {}
      },
      {
        "id": "ch_google",
        "type": "channel",
        "label": "Google Ads",
        "props": {
          "observacao": "verba baixa, quase parado"
        }
      },
      {
        "id": "ch_crm",
        "type": "channel",
        "label": "CRM",
        "props": {
          "ferramenta": "RD Station"
        }
      },
      {
        "id": "ch_whatsapp",
        "type": "channel",
        "label": "WhatsApp",
        "props": {}
      },
      {
        "id": "camp_namorados",
        "type": "campaign",
        "label": "Dia dos Namorados",
        "props": {
          "status": "encerrada",
          "janela": "mai-jun/2026",
          "aprendizado": "kits de presente performaram melhor que produto avulso"
        }
      },
      {
        "id": "camp_omega3",
        "type": "campaign",
        "label": "Ômega 3 - Saúde em Dia",
        "props": {
          "status": "ativa",
          "foco_atual": true,
          "monthly_budget_brl": 5000
        }
      },
      {
        "id": "camp_whey",
        "type": "campaign",
        "label": "Whey Sempre",
        "props": {
          "status": "ativa",
          "tipo": "evergreen"
        }
      },
      {
        "id": "camp_creatina",
        "type": "campaign",
        "label": "Creatina - Foco Total",
        "props": {
          "status": "em aprovação",
          "observacao": "pecas aguardando cliente desde 2026-08-06"
        }
      },
      {
        "id": "asset_creatina_foco",
        "type": "asset",
        "label": "Vídeo Creatina 'Foco Total'",
        "props": {
          "formato": "video",
          "status": "aguardando aprovação"
        }
      },
      {
        "id": "asset_creatina_benef",
        "type": "asset",
        "label": "Imagem Creatina 'Benefícios'",
        "props": {
          "formato": "imagem",
          "status": "aguardando aprovação"
        }
      },
      {
        "id": "asset_omega3_depo",
        "type": "asset",
        "label": "Vídeo Depoimento Ana",
        "props": {
          "formato": "video",
          "no_ar_desde": "2026-07-06"
        }
      },
      {
        "id": "task_aprovar_creatina",
        "type": "task",
        "label": "Aprovar peças de Creatina",
        "props": {
          "status": "aberta",
          "dono": "p_rodrigo",
          "aberta_em": "2026-08-06"
        }
      },
      {
        "id": "meet_semanal",
        "type": "meeting",
        "label": "Call semanal Housewhey",
        "props": {
          "recorrencia": "quinzenal",
          "ultima": "2026-08-08"
        }
      }
    ],
    "edges": [
      {
        "from": "p_aline",
        "to": "hub_spot",
        "rel": "MEMBER_OF"
      },
      {
        "from": "p_carolina",
        "to": "hub_spot",
        "rel": "MEMBER_OF"
      },
      {
        "from": "p_luiza",
        "to": "hub_spot",
        "rel": "MEMBER_OF"
      },
      {
        "from": "hub_spot",
        "to": "cli_housewhey",
        "rel": "OPERATES"
      },
      {
        "from": "p_aline",
        "to": "ch_meta",
        "rel": "OPERATES"
      },
      {
        "from": "p_aline",
        "to": "ch_google",
        "rel": "OPERATES"
      },
      {
        "from": "p_luiza",
        "to": "ch_whatsapp",
        "rel": "OPERATES"
      },
      {
        "from": "p_carolina",
        "to": "camp_omega3",
        "rel": "TRACKS"
      },
      {
        "from": "p_carolina",
        "to": "camp_whey",
        "rel": "TRACKS"
      },
      {
        "from": "camp_namorados",
        "to": "cli_housewhey",
        "rel": "MEMBER_OF"
      },
      {
        "from": "camp_omega3",
        "to": "cli_housewhey",
        "rel": "MEMBER_OF"
      },
      {
        "from": "camp_whey",
        "to": "cli_housewhey",
        "rel": "MEMBER_OF"
      },
      {
        "from": "camp_creatina",
        "to": "cli_housewhey",
        "rel": "MEMBER_OF"
      },
      {
        "from": "camp_omega3",
        "to": "ch_meta",
        "rel": "TRACKS"
      },
      {
        "from": "camp_whey",
        "to": "ch_meta",
        "rel": "TRACKS"
      },
      {
        "from": "asset_omega3_depo",
        "to": "camp_omega3",
        "rel": "MEMBER_OF"
      },
      {
        "from": "asset_creatina_foco",
        "to": "camp_creatina",
        "rel": "MEMBER_OF"
      },
      {
        "from": "asset_creatina_benef",
        "to": "camp_creatina",
        "rel": "MEMBER_OF"
      },
      {
        "from": "p_rodrigo",
        "to": "asset_creatina_foco",
        "rel": "APPROVES"
      },
      {
        "from": "p_rodrigo",
        "to": "asset_creatina_benef",
        "rel": "APPROVES"
      },
      {
        "from": "task_aprovar_creatina",
        "to": "camp_creatina",
        "rel": "MENTIONS"
      },
      {
        "from": "meet_semanal",
        "to": "camp_omega3",
        "rel": "MENTIONS"
      },
      {
        "from": "meet_semanal",
        "to": "camp_creatina",
        "rel": "MENTIONS"
      }
    ]
  },
  "timeline": {
    "client_id": "cli_housewhey",
    "events": [
      {
        "id": "ev_onboard",
        "occurred_at": "2026-06-04T10:00:00-03:00",
        "title": "Housewhey entra na operação SPOT",
        "summary": "Rodrigo fecha com a SPOT. Aline assume tráfego, Carolina a gestão da conta e Luiza o atendimento no WhatsApp.",
        "actor_ids": [
          "p_carolina",
          "p_rodrigo"
        ],
        "related_node_ids": [
          "cli_housewhey",
          "hub_spot"
        ]
      },
      {
        "id": "ev_namorados_brief",
        "occurred_at": "2026-06-09T15:30:00-03:00",
        "title": "Briefing da campanha de Namorados",
        "summary": "Reunião + WhatsApp para alinhar criativos de Dia dos Namorados. Decisão: focar em kits de presente.",
        "actor_ids": [
          "p_aline",
          "p_carolina",
          "p_rodrigo"
        ],
        "related_node_ids": [
          "camp_namorados"
        ]
      },
      {
        "id": "ev_namorados_fim",
        "occurred_at": "2026-06-29T18:00:00-03:00",
        "title": "Namorados encerra com kits acima da meta",
        "summary": "Campanha de Namorados encerrada. Aprendizado registrado: kit de presente converte melhor que produto avulso.",
        "actor_ids": [
          "p_carolina"
        ],
        "related_node_ids": [
          "camp_namorados"
        ]
      },
      {
        "id": "ev_omega3_sobe",
        "occurred_at": "2026-07-06T09:00:00-03:00",
        "title": "Ômega 3 sobe no Meta Ads",
        "summary": "Campanha de Ômega 3 entra no ar. Vídeo de depoimento da Ana é escalado para público frio. Carolina passa a acompanhar o CPA.",
        "actor_ids": [
          "p_aline",
          "p_carolina"
        ],
        "related_node_ids": [
          "camp_omega3",
          "asset_omega3_depo",
          "ch_meta"
        ]
      },
      {
        "id": "ev_whey_evergreen",
        "occurred_at": "2026-07-11T11:00:00-03:00",
        "title": "Whey evergreen reforçado",
        "summary": "Aline reforça a campanha evergreen de Whey com um novo UGC. Volume de leads sobe no WhatsApp.",
        "actor_ids": [
          "p_aline",
          "p_luiza"
        ],
        "related_node_ids": [
          "camp_whey"
        ]
      },
      {
        "id": "ev_luiza_origem",
        "occurred_at": "2026-08-03T14:20:00-03:00",
        "title": "Luiza estranha origem dos leads",
        "summary": "No atendimento, vários leads dizem que acharam a Housewhey 'no Google', mas o investimento em Google está quase parado. Luiza registra a dúvida para a call.",
        "actor_ids": [
          "p_luiza"
        ],
        "related_node_ids": [
          "ch_whatsapp",
          "ch_google"
        ]
      },
      {
        "id": "ev_creatina_envio",
        "occurred_at": "2026-08-06T16:00:00-03:00",
        "title": "Peças de Creatina enviadas para aprovação",
        "summary": "Aline finaliza as peças da nova campanha de Creatina e envia para o Rodrigo aprovar. Lançamento depende do aceite dele.",
        "actor_ids": [
          "p_aline",
          "p_carolina"
        ],
        "related_node_ids": [
          "camp_creatina",
          "asset_creatina_foco",
          "asset_creatina_benef",
          "task_aprovar_creatina"
        ]
      },
      {
        "id": "ev_call_semanal",
        "occurred_at": "2026-08-08T10:00:00-03:00",
        "title": "Call semanal: CPA do Ômega 3 preocupa",
        "summary": "Carolina levanta que o custo por venda do Ômega 3 subiu. Rodrigo pede clareza sobre qual anúncio está puxando o custo. Aprovação da Creatina fica pendente.",
        "actor_ids": [
          "p_carolina",
          "p_aline",
          "p_rodrigo"
        ],
        "related_node_ids": [
          "camp_omega3",
          "camp_creatina",
          "meet_semanal"
        ]
      },
      {
        "id": "ev_agora",
        "occurred_at": "2026-08-15T09:00:00-03:00",
        "title": "Hoje: decidir realocação e destravar Creatina",
        "summary": "Pendências abertas: revisar os criativos de Ômega 3, decidir realocação de verba e destravar a aprovação da Creatina com o cliente.",
        "actor_ids": [
          "p_carolina",
          "p_aline"
        ],
        "related_node_ids": [
          "camp_omega3",
          "camp_creatina"
        ]
      }
    ]
  },
  "meta": {
    "client_id": "cli_housewhey",
    "currency": "BRL",
    "period": {
      "since": "2026-07-01",
      "until": "2026-08-15"
    },
    "note": "meta_reported_conversions e o que o Gerenciador atribui (inclui view-through). A verdade de venda esta no CRM.",
    "campaigns": [
      {
        "campaign_id": "camp_omega3",
        "name": "Ômega 3 - Saúde em Dia",
        "objective": "conversions",
        "status": "active",
        "monthly_budget_brl": 5000,
        "adsets": [
          {
            "adset_id": "as_omega3_frio",
            "name": "Ômega 3 · Público Frio",
            "status": "active",
            "daily_budget_brl": 150,
            "optimization": "leads",
            "ads": [
              {
                "ad_id": "ad_omega3_depoimento",
                "ad_name": "Depoimento Ana - Ômega 3",
                "creative_type": "video",
                "audience": "frio",
                "status": "active",
                "spend_brl": 4200.0,
                "impressions": 210000,
                "clicks": 2100,
                "ctr_pct": 1.0,
                "cpc_brl": 2.0,
                "hook_rate_pct": 18.0,
                "frequency": 4.8,
                "meta_reported_conversions": 14,
                "utm_content": "ad_omega3_depoimento",
                "insights": {
                  "series_weekly": [
                    {
                      "week": "2026-07-06",
                      "spend": 760,
                      "impressions": 48000,
                      "clicks": 610,
                      "hook_rate_pct": 32.0,
                      "frequency": 1.8
                    },
                    {
                      "week": "2026-07-13",
                      "spend": 980,
                      "impressions": 52000,
                      "clicks": 540,
                      "hook_rate_pct": 27.0,
                      "frequency": 2.6
                    },
                    {
                      "week": "2026-07-20",
                      "spend": 1150,
                      "impressions": 55000,
                      "clicks": 470,
                      "hook_rate_pct": 21.0,
                      "frequency": 3.7
                    },
                    {
                      "week": "2026-07-27",
                      "spend": 1310,
                      "impressions": 55000,
                      "clicks": 480,
                      "hook_rate_pct": 18.0,
                      "frequency": 4.8
                    }
                  ]
                }
              },
              {
                "ad_id": "ad_omega3_antesdepois",
                "ad_name": "Antes e Depois - Ômega 3",
                "creative_type": "imagem",
                "audience": "frio",
                "status": "active",
                "spend_brl": 900.0,
                "impressions": 60000,
                "clicks": 1200,
                "ctr_pct": 2.0,
                "cpc_brl": 0.75,
                "hook_rate_pct": 41.0,
                "frequency": 1.6,
                "meta_reported_conversions": 11,
                "utm_content": "ad_omega3_antesdepois",
                "insights": {
                  "series_weekly": [
                    {
                      "week": "2026-07-06",
                      "spend": 210,
                      "impressions": 14000,
                      "clicks": 270,
                      "hook_rate_pct": 39.0,
                      "frequency": 1.2
                    },
                    {
                      "week": "2026-07-13",
                      "spend": 225,
                      "impressions": 15000,
                      "clicks": 300,
                      "hook_rate_pct": 41.0,
                      "frequency": 1.4
                    },
                    {
                      "week": "2026-07-20",
                      "spend": 230,
                      "impressions": 15500,
                      "clicks": 315,
                      "hook_rate_pct": 42.0,
                      "frequency": 1.5
                    },
                    {
                      "week": "2026-07-27",
                      "spend": 235,
                      "impressions": 15500,
                      "clicks": 315,
                      "hook_rate_pct": 41.0,
                      "frequency": 1.6
                    }
                  ]
                }
              }
            ]
          },
          {
            "adset_id": "as_omega3_remkt",
            "name": "Ômega 3 · Remarketing",
            "status": "active",
            "daily_budget_brl": 40,
            "optimization": "leads",
            "ads": [
              {
                "ad_id": "ad_omega3_oferta",
                "ad_name": "Oferta 3 potes - Ômega 3",
                "creative_type": "carrossel",
                "audience": "remarketing",
                "status": "active",
                "spend_brl": 1100.0,
                "impressions": 30000,
                "clicks": 900,
                "ctr_pct": 3.0,
                "cpc_brl": 1.22,
                "hook_rate_pct": 26.0,
                "frequency": 3.1,
                "meta_reported_conversions": 9,
                "utm_content": "ad_omega3_oferta",
                "insights": {
                  "series_weekly": [
                    {
                      "week": "2026-07-06",
                      "spend": 250,
                      "impressions": 7000,
                      "clicks": 210,
                      "hook_rate_pct": 27.0,
                      "frequency": 2.4
                    },
                    {
                      "week": "2026-07-27",
                      "spend": 300,
                      "impressions": 8000,
                      "clicks": 230,
                      "hook_rate_pct": 25.0,
                      "frequency": 3.1
                    }
                  ]
                }
              }
            ]
          }
        ]
      },
      {
        "campaign_id": "camp_whey",
        "name": "Whey Sempre",
        "objective": "leads",
        "status": "active",
        "monthly_budget_brl": 4000,
        "adsets": [
          {
            "adset_id": "as_whey_frio",
            "name": "Whey · Público Frio",
            "status": "active",
            "daily_budget_brl": 120,
            "optimization": "leads",
            "ads": [
              {
                "ad_id": "ad_whey_sacola",
                "ad_name": "Sacola cheia - Whey",
                "creative_type": "imagem",
                "audience": "frio",
                "status": "active",
                "spend_brl": 1600.0,
                "impressions": 90000,
                "clicks": 1400,
                "ctr_pct": 1.56,
                "cpc_brl": 1.14,
                "hook_rate_pct": 22.0,
                "frequency": 2.2,
                "meta_reported_conversions": 10,
                "utm_content": "ad_whey_sacola",
                "insights": {
                  "series_weekly": [
                    {
                      "week": "2026-07-11",
                      "spend": 520,
                      "impressions": 30000,
                      "clicks": 470,
                      "hook_rate_pct": 23.0,
                      "frequency": 1.9
                    },
                    {
                      "week": "2026-07-27",
                      "spend": 540,
                      "impressions": 30000,
                      "clicks": 460,
                      "hook_rate_pct": 21.0,
                      "frequency": 2.2
                    }
                  ]
                }
              },
              {
                "ad_id": "ad_whey_ugc",
                "ad_name": "UGC 'minha rotina' - Whey",
                "creative_type": "video",
                "audience": "frio",
                "status": "active",
                "spend_brl": 2000.0,
                "impressions": 120000,
                "clicks": 2600,
                "ctr_pct": 2.17,
                "cpc_brl": 0.77,
                "hook_rate_pct": 35.0,
                "frequency": 2.0,
                "meta_reported_conversions": 22,
                "utm_content": "ad_whey_ugc",
                "insights": {
                  "series_weekly": [
                    {
                      "week": "2026-07-11",
                      "spend": 640,
                      "impressions": 39000,
                      "clicks": 860,
                      "hook_rate_pct": 36.0,
                      "frequency": 1.6
                    },
                    {
                      "week": "2026-07-27",
                      "spend": 690,
                      "impressions": 41000,
                      "clicks": 870,
                      "hook_rate_pct": 34.0,
                      "frequency": 2.0
                    }
                  ]
                }
              }
            ]
          }
        ]
      },
      {
        "campaign_id": "camp_creatina",
        "name": "Creatina - Foco Total",
        "objective": "conversions",
        "status": "in_review",
        "monthly_budget_brl": 0,
        "adsets": [
          {
            "adset_id": "as_creatina_lanc",
            "name": "Creatina · Lançamento",
            "status": "paused",
            "daily_budget_brl": 0,
            "optimization": "leads",
            "ads": [
              {
                "ad_id": "ad_creatina_foco",
                "ad_name": "Vídeo Foco Total - Creatina",
                "creative_type": "video",
                "audience": "frio",
                "status": "in_review",
                "spend_brl": 0.0,
                "impressions": 0,
                "clicks": 0,
                "ctr_pct": 0.0,
                "cpc_brl": 0.0,
                "hook_rate_pct": 0.0,
                "frequency": 0.0,
                "meta_reported_conversions": 0,
                "utm_content": "ad_creatina_foco",
                "insights": {
                  "series_weekly": []
                }
              },
              {
                "ad_id": "ad_creatina_benef",
                "ad_name": "Benefícios - Creatina",
                "creative_type": "imagem",
                "audience": "frio",
                "status": "in_review",
                "spend_brl": 0.0,
                "impressions": 0,
                "clicks": 0,
                "ctr_pct": 0.0,
                "cpc_brl": 0.0,
                "hook_rate_pct": 0.0,
                "frequency": 0.0,
                "meta_reported_conversions": 0,
                "utm_content": "ad_creatina_benef",
                "insights": {
                  "series_weekly": []
                }
              }
            ]
          }
        ]
      }
    ]
  },
  "crm": {
    "client_id": "cli_housewhey",
    "note": "utm_content casa com ad_id do Meta. origem_declarada e o que o lead responde no atendimento e pode divergir do UTM.",
    "leads": [
      {
        "lead_id": "ld_0001",
        "nome": "Bruna Alves",
        "created_at": "2026-07-07T09:00:00-03:00",
        "status": "venda",
        "value_brl": 180,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_depoimento",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0002",
        "nome": "Carlos Nunes",
        "created_at": "2026-07-08T10:07:00-03:00",
        "status": "venda",
        "value_brl": 180,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_depoimento",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0003",
        "nome": "Daniela Rocha",
        "created_at": "2026-07-09T11:14:00-03:00",
        "status": "agendamento",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_depoimento",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0004",
        "nome": "Eduardo Lima",
        "created_at": "2026-07-10T12:21:00-03:00",
        "status": "agendamento",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_depoimento",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0005",
        "nome": "Fernanda Souza",
        "created_at": "2026-07-11T13:28:00-03:00",
        "status": "agendamento",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_depoimento",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0006",
        "nome": "Gabriel Pinto",
        "created_at": "2026-07-12T14:35:00-03:00",
        "status": "agendamento",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_depoimento",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0007",
        "nome": "Helena Castro",
        "created_at": "2026-07-13T15:42:00-03:00",
        "status": "agendamento",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_depoimento",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0008",
        "nome": "Igor Ramos",
        "created_at": "2026-07-14T16:49:00-03:00",
        "status": "perdido",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_depoimento",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0009",
        "nome": "Juliana Dias",
        "created_at": "2026-07-15T17:56:00-03:00",
        "status": "perdido",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_depoimento",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0010",
        "nome": "Kleber Antunes",
        "created_at": "2026-07-16T09:03:00-03:00",
        "status": "perdido",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_depoimento",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0011",
        "nome": "Larissa Mota",
        "created_at": "2026-07-17T10:10:00-03:00",
        "status": "perdido",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_depoimento",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0012",
        "nome": "Marcos Vinícius",
        "created_at": "2026-07-18T11:17:00-03:00",
        "status": "perdido",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_depoimento",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0013",
        "nome": "Natália Prado",
        "created_at": "2026-07-19T12:24:00-03:00",
        "status": "perdido",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_depoimento",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0014",
        "nome": "Otávio Correia",
        "created_at": "2026-07-20T13:31:00-03:00",
        "status": "perdido",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_depoimento",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0015",
        "nome": "Patrícia Gomes",
        "created_at": "2026-07-21T14:38:00-03:00",
        "status": "lead",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_depoimento",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0016",
        "nome": "Rafael Teixeira",
        "created_at": "2026-07-22T15:45:00-03:00",
        "status": "lead",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_depoimento",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0017",
        "nome": "Sabrina Melo",
        "created_at": "2026-07-23T16:52:00-03:00",
        "status": "lead",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_depoimento",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0018",
        "nome": "Thiago Barros",
        "created_at": "2026-07-24T17:59:00-03:00",
        "status": "lead",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_depoimento",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0019",
        "nome": "Vanessa Cardoso",
        "created_at": "2026-07-25T09:06:00-03:00",
        "status": "lead",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_depoimento",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0020",
        "nome": "William Freitas",
        "created_at": "2026-07-26T10:13:00-03:00",
        "status": "lead",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_depoimento",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0021",
        "nome": "Amanda Rios",
        "created_at": "2026-07-07T11:20:00-03:00",
        "status": "lead",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_depoimento",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0022",
        "nome": "Bruno Sales",
        "created_at": "2026-07-08T12:27:00-03:00",
        "status": "lead",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_depoimento",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0023",
        "nome": "Camila Duarte",
        "created_at": "2026-07-09T13:34:00-03:00",
        "status": "lead",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_depoimento",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0024",
        "nome": "Diego Farias",
        "created_at": "2026-07-10T14:41:00-03:00",
        "status": "lead",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_depoimento",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0025",
        "nome": "Elaine Moura",
        "created_at": "2026-07-08T09:00:00-03:00",
        "status": "venda",
        "value_brl": 180,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_antesdepois",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0026",
        "nome": "Felipe Aragão",
        "created_at": "2026-07-09T10:07:00-03:00",
        "status": "venda",
        "value_brl": 180,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_antesdepois",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0027",
        "nome": "Giovana Reis",
        "created_at": "2026-07-10T11:14:00-03:00",
        "status": "venda",
        "value_brl": 180,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_antesdepois",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0028",
        "nome": "Hugo Peixoto",
        "created_at": "2026-07-11T12:21:00-03:00",
        "status": "venda",
        "value_brl": 180,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_antesdepois",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0029",
        "nome": "Isabela Nogueira",
        "created_at": "2026-07-12T13:28:00-03:00",
        "status": "venda",
        "value_brl": 180,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_antesdepois",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0030",
        "nome": "João Vitor",
        "created_at": "2026-07-13T14:35:00-03:00",
        "status": "venda",
        "value_brl": 180,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_antesdepois",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0031",
        "nome": "Karina Lopes",
        "created_at": "2026-07-14T15:42:00-03:00",
        "status": "venda",
        "value_brl": 180,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_antesdepois",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0032",
        "nome": "Leandro Cunha",
        "created_at": "2026-07-15T16:49:00-03:00",
        "status": "venda",
        "value_brl": 180,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_antesdepois",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0033",
        "nome": "Mariana Assis",
        "created_at": "2026-07-16T17:56:00-03:00",
        "status": "venda",
        "value_brl": 180,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_antesdepois",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0034",
        "nome": "Nelson Braga",
        "created_at": "2026-07-17T09:03:00-03:00",
        "status": "agendamento",
        "value_brl": 0,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_antesdepois",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0035",
        "nome": "Olívia Sampaio",
        "created_at": "2026-07-18T10:10:00-03:00",
        "status": "agendamento",
        "value_brl": 0,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_antesdepois",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0036",
        "nome": "Pedro Henrique",
        "created_at": "2026-07-19T11:17:00-03:00",
        "status": "agendamento",
        "value_brl": 0,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_antesdepois",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0037",
        "nome": "Queila Matos",
        "created_at": "2026-07-20T12:24:00-03:00",
        "status": "agendamento",
        "value_brl": 0,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_antesdepois",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0038",
        "nome": "Ricardo Vasco",
        "created_at": "2026-07-21T13:31:00-03:00",
        "status": "perdido",
        "value_brl": 0,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_antesdepois",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0039",
        "nome": "Simone Tavares",
        "created_at": "2026-07-22T14:38:00-03:00",
        "status": "perdido",
        "value_brl": 0,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_antesdepois",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0040",
        "nome": "Tatiane Brito",
        "created_at": "2026-07-23T15:45:00-03:00",
        "status": "perdido",
        "value_brl": 0,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_antesdepois",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0041",
        "nome": "Ulisses Prado",
        "created_at": "2026-07-24T16:52:00-03:00",
        "status": "lead",
        "value_brl": 0,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_antesdepois",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0042",
        "nome": "Vera Lúcia",
        "created_at": "2026-07-25T17:59:00-03:00",
        "status": "lead",
        "value_brl": 0,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_antesdepois",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0043",
        "nome": "Wagner Diniz",
        "created_at": "2026-07-26T09:06:00-03:00",
        "status": "lead",
        "value_brl": 0,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_antesdepois",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0044",
        "nome": "Yasmin Costa",
        "created_at": "2026-07-27T10:13:00-03:00",
        "status": "lead",
        "value_brl": 0,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_antesdepois",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0045",
        "nome": "Zeca Andrade",
        "created_at": "2026-07-09T09:00:00-03:00",
        "status": "venda",
        "value_brl": 180,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_oferta",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0046",
        "nome": "Alice Bonfim",
        "created_at": "2026-07-10T10:07:00-03:00",
        "status": "venda",
        "value_brl": 180,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_oferta",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0047",
        "nome": "Breno Galvão",
        "created_at": "2026-07-11T11:14:00-03:00",
        "status": "venda",
        "value_brl": 180,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_oferta",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0048",
        "nome": "Cíntia Rabelo",
        "created_at": "2026-07-12T12:21:00-03:00",
        "status": "venda",
        "value_brl": 180,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_oferta",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0049",
        "nome": "Davi Queiroz",
        "created_at": "2026-07-13T13:28:00-03:00",
        "status": "venda",
        "value_brl": 180,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_oferta",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0050",
        "nome": "Erika Solano",
        "created_at": "2026-07-14T14:35:00-03:00",
        "status": "venda",
        "value_brl": 180,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_oferta",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0051",
        "nome": "Fábio Menezes",
        "created_at": "2026-07-15T15:42:00-03:00",
        "status": "agendamento",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_oferta",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0052",
        "nome": "Gisele Amaral",
        "created_at": "2026-07-16T16:49:00-03:00",
        "status": "agendamento",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_oferta",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0053",
        "nome": "Heitor Vale",
        "created_at": "2026-07-17T17:56:00-03:00",
        "status": "perdido",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_oferta",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0054",
        "nome": "Iara Bittencourt",
        "created_at": "2026-07-18T09:03:00-03:00",
        "status": "lead",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_oferta",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0055",
        "nome": "Bruna Alves",
        "created_at": "2026-07-19T10:10:00-03:00",
        "status": "lead",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_oferta",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0056",
        "nome": "Carlos Nunes",
        "created_at": "2026-07-20T11:17:00-03:00",
        "status": "lead",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_omega3_oferta",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0057",
        "nome": "Daniela Rocha",
        "created_at": "2026-07-12T09:00:00-03:00",
        "status": "venda",
        "value_brl": 150,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_sacola",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0058",
        "nome": "Eduardo Lima",
        "created_at": "2026-07-13T10:07:00-03:00",
        "status": "venda",
        "value_brl": 150,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_sacola",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0059",
        "nome": "Fernanda Souza",
        "created_at": "2026-07-14T11:14:00-03:00",
        "status": "venda",
        "value_brl": 150,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_sacola",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0060",
        "nome": "Gabriel Pinto",
        "created_at": "2026-07-15T12:21:00-03:00",
        "status": "venda",
        "value_brl": 150,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_sacola",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0061",
        "nome": "Helena Castro",
        "created_at": "2026-07-16T13:28:00-03:00",
        "status": "venda",
        "value_brl": 150,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_sacola",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0062",
        "nome": "Igor Ramos",
        "created_at": "2026-07-17T14:35:00-03:00",
        "status": "venda",
        "value_brl": 150,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_sacola",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0063",
        "nome": "Juliana Dias",
        "created_at": "2026-07-18T15:42:00-03:00",
        "status": "venda",
        "value_brl": 150,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_sacola",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0064",
        "nome": "Kleber Antunes",
        "created_at": "2026-07-19T16:49:00-03:00",
        "status": "agendamento",
        "value_brl": 0,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_sacola",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0065",
        "nome": "Larissa Mota",
        "created_at": "2026-07-20T17:56:00-03:00",
        "status": "agendamento",
        "value_brl": 0,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_sacola",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0066",
        "nome": "Marcos Vinícius",
        "created_at": "2026-07-21T09:03:00-03:00",
        "status": "agendamento",
        "value_brl": 0,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_sacola",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0067",
        "nome": "Natália Prado",
        "created_at": "2026-07-22T10:10:00-03:00",
        "status": "perdido",
        "value_brl": 0,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_sacola",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0068",
        "nome": "Otávio Correia",
        "created_at": "2026-07-23T11:17:00-03:00",
        "status": "perdido",
        "value_brl": 0,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_sacola",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0069",
        "nome": "Patrícia Gomes",
        "created_at": "2026-07-24T12:24:00-03:00",
        "status": "perdido",
        "value_brl": 0,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_sacola",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0070",
        "nome": "Rafael Teixeira",
        "created_at": "2026-07-25T13:31:00-03:00",
        "status": "lead",
        "value_brl": 0,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_sacola",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0071",
        "nome": "Sabrina Melo",
        "created_at": "2026-07-26T14:38:00-03:00",
        "status": "lead",
        "value_brl": 0,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_sacola",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0072",
        "nome": "Thiago Barros",
        "created_at": "2026-07-27T15:45:00-03:00",
        "status": "lead",
        "value_brl": 0,
        "utm_source": "facebook",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_sacola",
        "origem_declarada": "Facebook"
      },
      {
        "lead_id": "ld_0073",
        "nome": "Vanessa Cardoso",
        "created_at": "2026-07-13T09:00:00-03:00",
        "status": "venda",
        "value_brl": 150,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_ugc",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0074",
        "nome": "William Freitas",
        "created_at": "2026-07-14T10:07:00-03:00",
        "status": "venda",
        "value_brl": 150,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_ugc",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0075",
        "nome": "Amanda Rios",
        "created_at": "2026-07-15T11:14:00-03:00",
        "status": "venda",
        "value_brl": 150,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_ugc",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0076",
        "nome": "Bruno Sales",
        "created_at": "2026-07-16T12:21:00-03:00",
        "status": "venda",
        "value_brl": 150,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_ugc",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0077",
        "nome": "Camila Duarte",
        "created_at": "2026-07-17T13:28:00-03:00",
        "status": "venda",
        "value_brl": 150,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_ugc",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0078",
        "nome": "Diego Farias",
        "created_at": "2026-07-18T14:35:00-03:00",
        "status": "venda",
        "value_brl": 150,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_ugc",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0079",
        "nome": "Elaine Moura",
        "created_at": "2026-07-19T15:42:00-03:00",
        "status": "venda",
        "value_brl": 150,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_ugc",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0080",
        "nome": "Felipe Aragão",
        "created_at": "2026-07-20T16:49:00-03:00",
        "status": "venda",
        "value_brl": 150,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_ugc",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0081",
        "nome": "Giovana Reis",
        "created_at": "2026-07-21T17:56:00-03:00",
        "status": "agendamento",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_ugc",
        "origem_declarada": "Google"
      },
      {
        "lead_id": "ld_0082",
        "nome": "Hugo Peixoto",
        "created_at": "2026-07-22T09:03:00-03:00",
        "status": "agendamento",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_ugc",
        "origem_declarada": "Não lembro"
      },
      {
        "lead_id": "ld_0083",
        "nome": "Isabela Nogueira",
        "created_at": "2026-07-23T10:10:00-03:00",
        "status": "agendamento",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_ugc",
        "origem_declarada": "Google"
      },
      {
        "lead_id": "ld_0084",
        "nome": "João Vitor",
        "created_at": "2026-07-24T11:17:00-03:00",
        "status": "agendamento",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_ugc",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0085",
        "nome": "Karina Lopes",
        "created_at": "2026-07-25T12:24:00-03:00",
        "status": "agendamento",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_ugc",
        "origem_declarada": "Indicação de amigo"
      },
      {
        "lead_id": "ld_0086",
        "nome": "Leandro Cunha",
        "created_at": "2026-07-26T13:31:00-03:00",
        "status": "agendamento",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_ugc",
        "origem_declarada": "Google"
      },
      {
        "lead_id": "ld_0087",
        "nome": "Mariana Assis",
        "created_at": "2026-07-27T14:38:00-03:00",
        "status": "perdido",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_ugc",
        "origem_declarada": "Não lembro"
      },
      {
        "lead_id": "ld_0088",
        "nome": "Nelson Braga",
        "created_at": "2026-07-28T15:45:00-03:00",
        "status": "perdido",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_ugc",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0089",
        "nome": "Olívia Sampaio",
        "created_at": "2026-07-29T16:52:00-03:00",
        "status": "perdido",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_ugc",
        "origem_declarada": "Google"
      },
      {
        "lead_id": "ld_0090",
        "nome": "Pedro Henrique",
        "created_at": "2026-07-30T17:59:00-03:00",
        "status": "perdido",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_ugc",
        "origem_declarada": "Indicação de amigo"
      },
      {
        "lead_id": "ld_0091",
        "nome": "Queila Matos",
        "created_at": "2026-07-31T09:06:00-03:00",
        "status": "perdido",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_ugc",
        "origem_declarada": "Google"
      },
      {
        "lead_id": "ld_0092",
        "nome": "Ricardo Vasco",
        "created_at": "2026-08-01T10:13:00-03:00",
        "status": "perdido",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_ugc",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0093",
        "nome": "Simone Tavares",
        "created_at": "2026-07-13T11:20:00-03:00",
        "status": "perdido",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_ugc",
        "origem_declarada": "Google"
      },
      {
        "lead_id": "ld_0094",
        "nome": "Tatiane Brito",
        "created_at": "2026-07-14T12:27:00-03:00",
        "status": "lead",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_ugc",
        "origem_declarada": "Google"
      },
      {
        "lead_id": "ld_0095",
        "nome": "Ulisses Prado",
        "created_at": "2026-07-15T13:34:00-03:00",
        "status": "lead",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_ugc",
        "origem_declarada": "Indicação de amigo"
      },
      {
        "lead_id": "ld_0096",
        "nome": "Vera Lúcia",
        "created_at": "2026-07-16T14:41:00-03:00",
        "status": "lead",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_ugc",
        "origem_declarada": "Instagram"
      },
      {
        "lead_id": "ld_0097",
        "nome": "Wagner Diniz",
        "created_at": "2026-07-17T15:48:00-03:00",
        "status": "lead",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_ugc",
        "origem_declarada": "Não lembro"
      },
      {
        "lead_id": "ld_0098",
        "nome": "Yasmin Costa",
        "created_at": "2026-07-18T16:55:00-03:00",
        "status": "lead",
        "value_brl": 0,
        "utm_source": "instagram",
        "utm_medium": "paid_social",
        "utm_content": "ad_whey_ugc",
        "origem_declarada": "Google"
      },
      {
        "lead_id": "ld_0099",
        "nome": "Zeca Andrade",
        "created_at": "2026-07-16T09:00:00-03:00",
        "status": "venda",
        "value_brl": 180,
        "utm_source": "google",
        "utm_medium": "organic",
        "utm_content": "_organic_google",
        "origem_declarada": "Google"
      },
      {
        "lead_id": "ld_0100",
        "nome": "Alice Bonfim",
        "created_at": "2026-07-17T10:07:00-03:00",
        "status": "venda",
        "value_brl": 180,
        "utm_source": "google",
        "utm_medium": "organic",
        "utm_content": "_organic_google",
        "origem_declarada": "Google"
      },
      {
        "lead_id": "ld_0101",
        "nome": "Breno Galvão",
        "created_at": "2026-07-18T11:14:00-03:00",
        "status": "lead",
        "value_brl": 0,
        "utm_source": "google",
        "utm_medium": "organic",
        "utm_content": "_organic_google",
        "origem_declarada": "Google"
      },
      {
        "lead_id": "ld_0102",
        "nome": "Cíntia Rabelo",
        "created_at": "2026-07-19T12:21:00-03:00",
        "status": "lead",
        "value_brl": 0,
        "utm_source": "google",
        "utm_medium": "organic",
        "utm_content": "_organic_google",
        "origem_declarada": "Google"
      },
      {
        "lead_id": "ld_0103",
        "nome": "Davi Queiroz",
        "created_at": "2026-07-21T09:00:00-03:00",
        "status": "venda",
        "value_brl": 150,
        "utm_source": "(direct)",
        "utm_medium": "none",
        "utm_content": "_direct",
        "origem_declarada": "Indicação de amigo"
      },
      {
        "lead_id": "ld_0104",
        "nome": "Erika Solano",
        "created_at": "2026-07-22T10:07:00-03:00",
        "status": "lead",
        "value_brl": 0,
        "utm_source": "(direct)",
        "utm_medium": "none",
        "utm_content": "_direct",
        "origem_declarada": "Indicação de amigo"
      }
    ]
  },
  "appCriativos": {
    "client_id": "cli_housewhey",
    "app": "analise_criativos",
    "gerado_em": "2026-08-15",
    "metodologia": "Nota de gancho (hook) + clareza de CTA + adequação ao palco (público). Recomendação: seguir | pausar | variar.",
    "ranking": [
      {
        "ad_id": "ad_omega3_antesdepois",
        "posicao": 1,
        "nota_hook": 9.0,
        "nota_cta": 8.5,
        "palco": "frio",
        "recomendacao": "variar",
        "racional": "Melhor eficiência da conta. Gancho visual forte e estável. Vale escalar verba e testar variações antes de saturar.",
        "brief_sugerido": {
          "publico": "frio - interessados em saúde/longevidade",
          "hook": "Comparativo visual em 3 segundos",
          "mensagem": "Constância traz resultado; prova social real",
          "cta": "Quero começar hoje",
          "metrica_sucesso": "manter CPA de venda < R$150 ao dobrar verba"
        }
      },
      {
        "ad_id": "ad_whey_ugc",
        "posicao": 2,
        "nota_hook": 8.0,
        "nota_cta": 6.5,
        "palco": "frio",
        "recomendacao": "variar",
        "racional": "Volume alto de cliques, mas CTA fraco e qualificação irregular no atendimento. Testar CTA mais específico.",
        "brief_sugerido": {
          "publico": "frio - fitness/rotina",
          "hook": "Rotina real do cliente (UGC)",
          "mensagem": "Praticidade no dia a dia",
          "cta": "Ver sabores e preço",
          "metrica_sucesso": "subir taxa lead→venda acima de 20%"
        }
      },
      {
        "ad_id": "ad_omega3_oferta",
        "posicao": 3,
        "nota_hook": 6.5,
        "nota_cta": 7.5,
        "palco": "remarketing",
        "recomendacao": "seguir",
        "racional": "Cumpre o papel de fundo de funil. Sem urgência de mexer.",
        "brief_sugerido": null
      },
      {
        "ad_id": "ad_whey_sacola",
        "posicao": 4,
        "nota_hook": 5.5,
        "nota_cta": 6.0,
        "palco": "frio",
        "recomendacao": "seguir",
        "racional": "Mediano. Segura enquanto houver criativo melhor para escalar.",
        "brief_sugerido": null
      },
      {
        "ad_id": "ad_omega3_depoimento",
        "posicao": 5,
        "nota_hook": 3.5,
        "nota_cta": 6.0,
        "palco": "frio",
        "recomendacao": "pausar",
        "racional": "Gancho despencou e frequência alta: sinais de fadiga/saturação no mesmo público. Custo por resultado real subiu muito. Pausar e substituir por variação nova.",
        "brief_sugerido": {
          "publico": "frio - saúde 35+",
          "hook": "Nova abertura em 3s (evitar rosto já batido)",
          "mensagem": "Benefício concreto sem promessa de cura",
          "cta": "Quero saber mais",
          "metrica_sucesso": "hook_rate > 30% na 1a semana"
        }
      }
    ],
    "pecas_bloqueadas": [
      {
        "ad_id": "ad_creatina_foco",
        "status": "aguardando aprovação do cliente",
        "desde": "2026-08-06"
      },
      {
        "ad_id": "ad_creatina_benef",
        "status": "aguardando aprovação do cliente",
        "desde": "2026-08-06"
      }
    ]
  },
  "mapa": {
    "client_id": "cli_housewhey",
    "app": "mapa_solucao",
    "atualizado_em": "2026-07-31",
    "marca": "Housewhey",
    "oferta": "Suplementos para o dia a dia: Whey Protein, Ômega 3, Creatina e multivitamínicos. Venda direta pelo site com atendimento no WhatsApp.",
    "promessa": "Constância simples: suplemento de qualidade, entrega rápida e acompanhamento humano.",
    "prova": [
      "+40 mil pedidos entregues",
      "Selo de qualidade e laudo dos lotes",
      "Avaliações reais de clientes no site"
    ],
    "objeções": [
      "'Será que funciona pra mim?'",
      "Preço vs concorrente de marketplace",
      "Prazo e custo de entrega",
      "Medo de sabor ruim"
    ],
    "tom_de_voz": "Próximo, direto e sem hype. Fala de rotina, não de milagre.",
    "nao_pode_falar": [
      "Não prometer cura ou tratamento de doença (restrição sanitária/ANVISA).",
      "Não garantir emagrecimento ou ganho de massa em prazo determinado.",
      "Evitar 'antes e depois' que sugira resultado garantido; usar prova social com ressalva."
    ],
    "observacao_operacional": "As peças de Creatina em aprovação usam a palavra 'resultado garantido' e por isso estão em revisão com o cliente."
  },
  "conversas": {
    "client_id": "cli_housewhey",
    "threads": [
      {
        "id": "conv_call_68",
        "tipo": "reuniao",
        "canal": "Google Meet",
        "occurred_at": "2026-08-08T10:00:00-03:00",
        "participantes": [
          "p_carolina",
          "p_aline",
          "p_rodrigo"
        ],
        "titulo": "Ata - Call semanal Housewhey",
        "bullets": [
          "Carolina: custo por venda do Ômega 3 subiu nas últimas 2 semanas; Rodrigo quer saber QUAL anúncio está puxando o custo.",
          "Aline: o vídeo de depoimento roda há semanas no mesmo público; suspeita de desgaste, mas falta cruzar com venda real do CRM.",
          "Rodrigo: 'no Gerenciador aparece bastante resultado, mas minha venda não acompanhou'.",
          "Creatina: peças ainda não aprovadas. Rodrigo pediu revisão de uma frase antes de liberar.",
          "Combinado: SPOT traz na próxima call o relatório de criativo x venda e uma proposta de realocação de verba."
        ]
      },
      {
        "id": "conv_wpp_rodrigo",
        "tipo": "whatsapp",
        "canal": "WhatsApp",
        "occurred_at": "2026-08-09T19:12:00-03:00",
        "participantes": [
          "p_carolina",
          "p_rodrigo"
        ],
        "titulo": "WhatsApp - Carolina e Rodrigo (aprovação Creatina)",
        "mensagens": [
          {
            "de": "p_carolina",
            "texto": "Rodrigo, seguem as duas peças de Creatina pra aprovar. Assim que liberar eu subo ainda essa semana."
          },
          {
            "de": "p_rodrigo",
            "texto": "Vi aqui. Só não curti o 'resultado garantido' no vídeo, acho que a gente não pode falar isso né?"
          },
          {
            "de": "p_carolina",
            "texto": "Isso, melhor ajustar essa frase mesmo. Te devolvo a versão corrigida pra liberar."
          },
          {
            "de": "p_rodrigo",
            "texto": "Fechou, me manda que aprovo rápido."
          }
        ]
      },
      {
        "id": "conv_wpp_luiza",
        "tipo": "whatsapp",
        "canal": "WhatsApp",
        "occurred_at": "2026-08-03T14:20:00-03:00",
        "participantes": [
          "p_luiza",
          "p_carolina"
        ],
        "titulo": "WhatsApp - Luiza e Carolina (origem dos leads)",
        "mensagens": [
          {
            "de": "p_luiza",
            "texto": "Caro, tá vindo bastante lead falando que achou a gente no Google. Mas a gente quase não roda Google, né?"
          },
          {
            "de": "p_carolina",
            "texto": "Quase nada. O grosso é Meta. Deixa eu ver se o pessoal tá confundindo por causa do vídeo do Whey que tá bombando."
          },
          {
            "de": "p_luiza",
            "texto": "Pode ser. Quando pergunto de novo, muita gente lembra de um vídeo no Instagram."
          }
        ]
      }
    ]
  }
};
