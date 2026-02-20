export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      atividades_cliente: {
        Row: {
          cliente_id: string
          created_at: string
          data_hora: string
          descricao: string
          id: string
          organization_id: string
          realizado_por: string | null
          realizado_por_email: string | null
          tipo: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data_hora?: string
          descricao: string
          id?: string
          organization_id: string
          realizado_por?: string | null
          realizado_por_email?: string | null
          tipo: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data_hora?: string
          descricao?: string
          id?: string
          organization_id?: string
          realizado_por?: string | null
          realizado_por_email?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividades_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          acao: string | null
          created_at: string | null
          detalhes: Json | null
          id: string
          organization_id: string | null
          user_id: string | null
        }
        Insert: {
          acao?: string | null
          created_at?: string | null
          detalhes?: Json | null
          id?: string
          organization_id?: string | null
          user_id?: string | null
        }
        Update: {
          acao?: string | null
          created_at?: string | null
          detalhes?: Json | null
          id?: string
          organization_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      caixas: {
        Row: {
          created_at: string
          data_abertura: string
          data_fechamento: string | null
          diferenca: number | null
          id: string
          observacoes: string | null
          organization_id: string | null
          saldo_final: number | null
          saldo_inicial: number
          saldo_sistema: number | null
          status: string
          usuario_abertura: string
          usuario_fechamento: string | null
        }
        Insert: {
          created_at?: string
          data_abertura?: string
          data_fechamento?: string | null
          diferenca?: number | null
          id?: string
          observacoes?: string | null
          organization_id?: string | null
          saldo_final?: number | null
          saldo_inicial?: number
          saldo_sistema?: number | null
          status?: string
          usuario_abertura: string
          usuario_fechamento?: string | null
        }
        Update: {
          created_at?: string
          data_abertura?: string
          data_fechamento?: string | null
          diferenca?: number | null
          id?: string
          observacoes?: string | null
          organization_id?: string | null
          saldo_final?: number | null
          saldo_inicial?: number
          saldo_sistema?: number | null
          status?: string
          usuario_abertura?: string
          usuario_fechamento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "caixas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_financeiras: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          organization_id: string | null
          tipo: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          organization_id?: string | null
          tipo?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          organization_id?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_financeiras_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      centros_custo: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          organization_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          organization_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "centros_custo_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          ativo: boolean
          cep: string | null
          cidade: string | null
          cnpj: string | null
          created_at: string
          email: string | null
          endereco: string | null
          frequencia_visita: string | null
          id: string
          nome: string
          observacoes: string | null
          organization_id: string
          proxima_visita: string | null
          rotina_visitas: boolean
          telefone: string | null
          uf: string | null
          ultima_visita: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          frequencia_visita?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          organization_id: string
          proxima_visita?: string | null
          rotina_visitas?: boolean
          telefone?: string | null
          uf?: string | null
          ultima_visita?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          frequencia_visita?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          organization_id?: string
          proxima_visita?: string | null
          rotina_visitas?: boolean
          telefone?: string | null
          uf?: string | null
          ultima_visita?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      colaboradores: {
        Row: {
          cargo: string | null
          cnh_tipos: string[] | null
          codigo_cadastro: string | null
          created_at: string | null
          data_admissao: string | null
          email_pessoal: string | null
          id: string
          nome: string
          organization_id: string | null
          pcd: boolean | null
          preferencia_turno: string | null
          status: string | null
          telefone: string | null
          tipo_carteira: string | null
          troca_turno: boolean | null
          turno: string | null
        }
        Insert: {
          cargo?: string | null
          cnh_tipos?: string[] | null
          codigo_cadastro?: string | null
          created_at?: string | null
          data_admissao?: string | null
          email_pessoal?: string | null
          id?: string
          nome: string
          organization_id?: string | null
          pcd?: boolean | null
          preferencia_turno?: string | null
          status?: string | null
          telefone?: string | null
          tipo_carteira?: string | null
          troca_turno?: boolean | null
          turno?: string | null
        }
        Update: {
          cargo?: string | null
          cnh_tipos?: string[] | null
          codigo_cadastro?: string | null
          created_at?: string | null
          data_admissao?: string | null
          email_pessoal?: string | null
          id?: string
          nome?: string
          organization_id?: string | null
          pcd?: boolean | null
          preferencia_turno?: string | null
          status?: string | null
          telefone?: string | null
          tipo_carteira?: string | null
          troca_turno?: boolean | null
          turno?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos_historico: {
        Row: {
          cliente_id: string
          contrato_anterior_id: string | null
          created_at: string
          data_fim: string | null
          data_inicio: string
          id: string
          organization_id: string
          recorrente: boolean
          servico_prestado: string
          status: string
          tipo_vinculo: string
          updated_at: string
          valor: number
        }
        Insert: {
          cliente_id: string
          contrato_anterior_id?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio: string
          id?: string
          organization_id: string
          recorrente?: boolean
          servico_prestado: string
          status?: string
          tipo_vinculo: string
          updated_at?: string
          valor?: number
        }
        Update: {
          cliente_id?: string
          contrato_anterior_id?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          id?: string
          organization_id?: string
          recorrente?: boolean
          servico_prestado?: string
          status?: string
          tipo_vinculo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contratos_historico_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_historico_contrato_anterior_id_fkey"
            columns: ["contrato_anterior_id"]
            isOneToOne: false
            referencedRelation: "contratos_historico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_historico_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fechamentos_caixa: {
        Row: {
          caixa_id: string
          created_at: string
          diferenca_cartao: number
          diferenca_dinheiro: number
          diferenca_outros: number
          diferenca_pix: number
          diferenca_total: number
          id: string
          observacoes: string | null
          organization_id: string | null
          realizado_por: string | null
          realizado_por_email: string | null
          total_contado: number
          total_sistema: number
          valor_cartao_contado: number
          valor_cartao_sistema: number
          valor_dinheiro_contado: number
          valor_dinheiro_sistema: number
          valor_outros_contado: number
          valor_outros_sistema: number
          valor_pix_contado: number
          valor_pix_sistema: number
        }
        Insert: {
          caixa_id: string
          created_at?: string
          diferenca_cartao?: number
          diferenca_dinheiro?: number
          diferenca_outros?: number
          diferenca_pix?: number
          diferenca_total?: number
          id?: string
          observacoes?: string | null
          organization_id?: string | null
          realizado_por?: string | null
          realizado_por_email?: string | null
          total_contado?: number
          total_sistema?: number
          valor_cartao_contado?: number
          valor_cartao_sistema?: number
          valor_dinheiro_contado?: number
          valor_dinheiro_sistema?: number
          valor_outros_contado?: number
          valor_outros_sistema?: number
          valor_pix_contado?: number
          valor_pix_sistema?: number
        }
        Update: {
          caixa_id?: string
          created_at?: string
          diferenca_cartao?: number
          diferenca_dinheiro?: number
          diferenca_outros?: number
          diferenca_pix?: number
          diferenca_total?: number
          id?: string
          observacoes?: string | null
          organization_id?: string | null
          realizado_por?: string | null
          realizado_por_email?: string | null
          total_contado?: number
          total_sistema?: number
          valor_cartao_contado?: number
          valor_cartao_sistema?: number
          valor_dinheiro_contado?: number
          valor_dinheiro_sistema?: number
          valor_outros_contado?: number
          valor_outros_sistema?: number
          valor_pix_contado?: number
          valor_pix_sistema?: number
        }
        Relationships: [
          {
            foreignKeyName: "fechamentos_caixa_caixa_id_fkey"
            columns: ["caixa_id"]
            isOneToOne: false
            referencedRelation: "caixas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fechamentos_caixa_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      futuros_leads: {
        Row: {
          cnpj: string | null
          created_at: string
          data_prevista_contato: string
          email: string | null
          empresa: string | null
          id: string
          nome_contato: string | null
          observacoes: string | null
          organization_id: string | null
          origem: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          data_prevista_contato?: string
          email?: string | null
          empresa?: string | null
          id?: string
          nome_contato?: string | null
          observacoes?: string | null
          organization_id?: string | null
          origem?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          data_prevista_contato?: string
          email?: string | null
          empresa?: string | null
          id?: string
          nome_contato?: string | null
          observacoes?: string | null
          organization_id?: string | null
          origem?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "futuros_leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      grupos_produtos: {
        Row: {
          created_at: string
          id: string
          nome: string
          numero_referencia: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          numero_referencia: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          numero_referencia?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grupos_produtos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_interacoes: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          lead_id: string
          organization_id: string | null
          status_anterior: string | null
          status_novo: string | null
          tipo: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          lead_id: string
          organization_id?: string | null
          status_anterior?: string | null
          status_novo?: string | null
          tipo: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          lead_id?: string
          organization_id?: string | null
          status_anterior?: string | null
          status_novo?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_interacoes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_interacoes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          created_at: string
          data_retorno: string | null
          email: string | null
          empresa: string | null
          id: string
          localizacao: string | null
          logradouro: string | null
          meio_contato: string | null
          mes_referencia: string | null
          motivo_perda: string | null
          motivo_perda_detalhe: string | null
          nome_contato: string | null
          numero: string | null
          organization_id: string | null
          origem: string | null
          prioridade: string | null
          proximo_passo: string | null
          status: string | null
          telefone: string | null
          tipo_atendimento: string | null
          tipo_servico: string | null
          uf: string | null
          vendedor: string | null
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          data_retorno?: string | null
          email?: string | null
          empresa?: string | null
          id?: string
          localizacao?: string | null
          logradouro?: string | null
          meio_contato?: string | null
          mes_referencia?: string | null
          motivo_perda?: string | null
          motivo_perda_detalhe?: string | null
          nome_contato?: string | null
          numero?: string | null
          organization_id?: string | null
          origem?: string | null
          prioridade?: string | null
          proximo_passo?: string | null
          status?: string | null
          telefone?: string | null
          tipo_atendimento?: string | null
          tipo_servico?: string | null
          uf?: string | null
          vendedor?: string | null
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          data_retorno?: string | null
          email?: string | null
          empresa?: string | null
          id?: string
          localizacao?: string | null
          logradouro?: string | null
          meio_contato?: string | null
          mes_referencia?: string | null
          motivo_perda?: string | null
          motivo_perda_detalhe?: string | null
          nome_contato?: string | null
          numero?: string | null
          organization_id?: string | null
          origem?: string | null
          prioridade?: string | null
          proximo_passo?: string | null
          status?: string | null
          telefone?: string | null
          tipo_atendimento?: string | null
          tipo_servico?: string | null
          uf?: string | null
          vendedor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_caixa: {
        Row: {
          autorizado_por: string | null
          autorizado_por_email: string | null
          caixa_id: string | null
          categoria_id: string | null
          categoria_nome: string | null
          centro_custo_id: string | null
          created_at: string
          data_hora: string
          descricao: string | null
          forma_pagamento: string
          id: string
          orcamento_id: string | null
          organization_id: string | null
          realizado_por: string | null
          tipo: string
          usuario_email: string | null
          valor: number
        }
        Insert: {
          autorizado_por?: string | null
          autorizado_por_email?: string | null
          caixa_id?: string | null
          categoria_id?: string | null
          categoria_nome?: string | null
          centro_custo_id?: string | null
          created_at?: string
          data_hora?: string
          descricao?: string | null
          forma_pagamento?: string
          id?: string
          orcamento_id?: string | null
          organization_id?: string | null
          realizado_por?: string | null
          tipo: string
          usuario_email?: string | null
          valor?: number
        }
        Update: {
          autorizado_por?: string | null
          autorizado_por_email?: string | null
          caixa_id?: string | null
          categoria_id?: string | null
          categoria_nome?: string | null
          centro_custo_id?: string | null
          created_at?: string
          data_hora?: string
          descricao?: string | null
          forma_pagamento?: string
          id?: string
          orcamento_id?: string | null
          organization_id?: string | null
          realizado_por?: string | null
          tipo?: string
          usuario_email?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_caixa_caixa_id_fkey"
            columns: ["caixa_id"]
            isOneToOne: false
            referencedRelation: "caixas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_caixa_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_caixa_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centros_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_caixa_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_caixa_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      nota_fiscal_itens: {
        Row: {
          aliquota_icms: number | null
          aliquota_ipi: number | null
          base_icms: number | null
          cfop: string | null
          codigo: string
          created_at: string
          descricao: string
          id: string
          ncm: string | null
          nota_fiscal_id: string
          organization_id: string | null
          produto_id: string
          quantidade: number
          unidade: string
          valor_icms: number | null
          valor_ipi: number | null
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          aliquota_icms?: number | null
          aliquota_ipi?: number | null
          base_icms?: number | null
          cfop?: string | null
          codigo: string
          created_at?: string
          descricao: string
          id?: string
          ncm?: string | null
          nota_fiscal_id: string
          organization_id?: string | null
          produto_id: string
          quantidade?: number
          unidade?: string
          valor_icms?: number | null
          valor_ipi?: number | null
          valor_total: number
          valor_unitario: number
        }
        Update: {
          aliquota_icms?: number | null
          aliquota_ipi?: number | null
          base_icms?: number | null
          cfop?: string | null
          codigo?: string
          created_at?: string
          descricao?: string
          id?: string
          ncm?: string | null
          nota_fiscal_id?: string
          organization_id?: string | null
          produto_id?: string
          quantidade?: number
          unidade?: string
          valor_icms?: number | null
          valor_ipi?: number | null
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "nota_fiscal_itens_nota_fiscal_id_fkey"
            columns: ["nota_fiscal_id"]
            isOneToOne: false
            referencedRelation: "notas_fiscais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nota_fiscal_itens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nota_fiscal_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_fiscais: {
        Row: {
          base_calculo_icms: number | null
          base_calculo_icms_st: number | null
          cfop_padrao: string | null
          chave_acesso: string | null
          created_at: string
          data_emissao: string | null
          data_saida: string | null
          destinatario_bairro: string | null
          destinatario_cep: string | null
          destinatario_cidade: string | null
          destinatario_cnpj: string | null
          destinatario_email: string | null
          destinatario_endereco: string | null
          destinatario_ie: string | null
          destinatario_logradouro: string | null
          destinatario_nome: string
          destinatario_numero: string | null
          destinatario_telefone: string | null
          destinatario_uf: string | null
          emitente_cep: string | null
          emitente_cidade: string | null
          emitente_cnpj: string | null
          emitente_endereco: string | null
          emitente_ie: string | null
          emitente_razao_social: string | null
          emitente_telefone: string | null
          emitente_uf: string | null
          id: string
          informacoes_adicionais: string | null
          natureza_operacao: string | null
          numero_nota: number
          observacoes_fisco: string | null
          orcamento_id: string | null
          organization_id: string | null
          serie_nota: string | null
          status: string
          updated_at: string
          valor_cofins: number | null
          valor_desconto: number | null
          valor_frete: number | null
          valor_icms: number | null
          valor_icms_st: number | null
          valor_ipi: number | null
          valor_outras_despesas: number | null
          valor_pis: number | null
          valor_produtos: number
          valor_seguro: number | null
          valor_total: number
          valor_total_tributos: number | null
        }
        Insert: {
          base_calculo_icms?: number | null
          base_calculo_icms_st?: number | null
          cfop_padrao?: string | null
          chave_acesso?: string | null
          created_at?: string
          data_emissao?: string | null
          data_saida?: string | null
          destinatario_bairro?: string | null
          destinatario_cep?: string | null
          destinatario_cidade?: string | null
          destinatario_cnpj?: string | null
          destinatario_email?: string | null
          destinatario_endereco?: string | null
          destinatario_ie?: string | null
          destinatario_logradouro?: string | null
          destinatario_nome: string
          destinatario_numero?: string | null
          destinatario_telefone?: string | null
          destinatario_uf?: string | null
          emitente_cep?: string | null
          emitente_cidade?: string | null
          emitente_cnpj?: string | null
          emitente_endereco?: string | null
          emitente_ie?: string | null
          emitente_razao_social?: string | null
          emitente_telefone?: string | null
          emitente_uf?: string | null
          id?: string
          informacoes_adicionais?: string | null
          natureza_operacao?: string | null
          numero_nota?: number
          observacoes_fisco?: string | null
          orcamento_id?: string | null
          organization_id?: string | null
          serie_nota?: string | null
          status?: string
          updated_at?: string
          valor_cofins?: number | null
          valor_desconto?: number | null
          valor_frete?: number | null
          valor_icms?: number | null
          valor_icms_st?: number | null
          valor_ipi?: number | null
          valor_outras_despesas?: number | null
          valor_pis?: number | null
          valor_produtos?: number
          valor_seguro?: number | null
          valor_total?: number
          valor_total_tributos?: number | null
        }
        Update: {
          base_calculo_icms?: number | null
          base_calculo_icms_st?: number | null
          cfop_padrao?: string | null
          chave_acesso?: string | null
          created_at?: string
          data_emissao?: string | null
          data_saida?: string | null
          destinatario_bairro?: string | null
          destinatario_cep?: string | null
          destinatario_cidade?: string | null
          destinatario_cnpj?: string | null
          destinatario_email?: string | null
          destinatario_endereco?: string | null
          destinatario_ie?: string | null
          destinatario_logradouro?: string | null
          destinatario_nome?: string
          destinatario_numero?: string | null
          destinatario_telefone?: string | null
          destinatario_uf?: string | null
          emitente_cep?: string | null
          emitente_cidade?: string | null
          emitente_cnpj?: string | null
          emitente_endereco?: string | null
          emitente_ie?: string | null
          emitente_razao_social?: string | null
          emitente_telefone?: string | null
          emitente_uf?: string | null
          id?: string
          informacoes_adicionais?: string | null
          natureza_operacao?: string | null
          numero_nota?: number
          observacoes_fisco?: string | null
          orcamento_id?: string | null
          organization_id?: string | null
          serie_nota?: string | null
          status?: string
          updated_at?: string
          valor_cofins?: number | null
          valor_desconto?: number | null
          valor_frete?: number | null
          valor_icms?: number | null
          valor_icms_st?: number | null
          valor_ipi?: number | null
          valor_outras_despesas?: number | null
          valor_pis?: number | null
          valor_produtos?: number
          valor_seguro?: number | null
          valor_total?: number
          valor_total_tributos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "notas_fiscais_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_fiscais_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_fiscais_logs: {
        Row: {
          created_at: string | null
          id: string
          mensagem_erro: string | null
          movimentacao_id: string | null
          organization_id: string | null
          pdf_url: string | null
          protocolo: string | null
          status: string | null
          xml_url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mensagem_erro?: string | null
          movimentacao_id?: string | null
          organization_id?: string | null
          pdf_url?: string | null
          protocolo?: string | null
          status?: string | null
          xml_url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mensagem_erro?: string | null
          movimentacao_id?: string | null
          organization_id?: string | null
          pdf_url?: string | null
          protocolo?: string | null
          status?: string | null
          xml_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notas_fiscais_logs_movimentacao_id_fkey"
            columns: ["movimentacao_id"]
            isOneToOne: false
            referencedRelation: "movimentacoes_caixa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_fiscais_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes_contratos: {
        Row: {
          admin_email: string
          cliente_id: string
          contrato_id: string
          created_at: string
          data_envio: string
          data_vencimento: string
          enviado_em: string
          id: string
          organization_id: string
          tipo_notificacao: string
        }
        Insert: {
          admin_email: string
          cliente_id: string
          contrato_id: string
          created_at?: string
          data_envio?: string
          data_vencimento: string
          enviado_em?: string
          id?: string
          organization_id: string
          tipo_notificacao?: string
        }
        Update: {
          admin_email?: string
          cliente_id?: string
          contrato_id?: string
          created_at?: string
          data_envio?: string
          data_vencimento?: string
          enviado_em?: string
          id?: string
          organization_id?: string
          tipo_notificacao?: string
        }
        Relationships: []
      }
      orcamento_itens: {
        Row: {
          created_at: string
          desconto_percentual: number | null
          desconto_valor: number | null
          id: string
          orcamento_id: string
          organization_id: string | null
          preco_unitario: number
          produto_id: string
          produto_nome: string
          produto_sku: string
          quantidade: number
          unidade_medida: string
          valor_total: number
        }
        Insert: {
          created_at?: string
          desconto_percentual?: number | null
          desconto_valor?: number | null
          id?: string
          orcamento_id: string
          organization_id?: string | null
          preco_unitario: number
          produto_id: string
          produto_nome: string
          produto_sku: string
          quantidade?: number
          unidade_medida?: string
          valor_total: number
        }
        Update: {
          created_at?: string
          desconto_percentual?: number | null
          desconto_valor?: number | null
          id?: string
          orcamento_id?: string
          organization_id?: string | null
          preco_unitario?: number
          produto_id?: string
          produto_nome?: string
          produto_sku?: string
          quantidade?: number
          unidade_medida?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_itens_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamento_itens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamento_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          cliente_cnpj: string | null
          cliente_email: string | null
          cliente_endereco: string | null
          cliente_nome: string | null
          cliente_telefone: string | null
          created_at: string
          data_validade: string | null
          desconto_total: number
          id: string
          lead_id: string | null
          motivo_cancelamento: string | null
          numero_orcamento: number
          observacoes: string | null
          organization_id: string | null
          status: string
          status_financeiro: string | null
          subtotal: number
          updated_at: string
          validade_dias: number | null
          valor_total: number
        }
        Insert: {
          cliente_cnpj?: string | null
          cliente_email?: string | null
          cliente_endereco?: string | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          created_at?: string
          data_validade?: string | null
          desconto_total?: number
          id?: string
          lead_id?: string | null
          motivo_cancelamento?: string | null
          numero_orcamento?: number
          observacoes?: string | null
          organization_id?: string | null
          status?: string
          status_financeiro?: string | null
          subtotal?: number
          updated_at?: string
          validade_dias?: number | null
          valor_total?: number
        }
        Update: {
          cliente_cnpj?: string | null
          cliente_email?: string | null
          cliente_endereco?: string | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          created_at?: string
          data_validade?: string | null
          desconto_total?: number
          id?: string
          lead_id?: string | null
          motivo_cancelamento?: string | null
          numero_orcamento?: number
          observacoes?: string | null
          organization_id?: string | null
          status?: string
          status_financeiro?: string | null
          subtotal?: number
          updated_at?: string
          validade_dias?: number | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          ambiente_nfe: string | null
          ativo: boolean
          cabecalho_orcamento: string | null
          certificado_arquivo_path: string | null
          certificado_status: string | null
          cnpj: string | null
          created_at: string
          dias_acesso: string[] | null
          focus_nfe_token: string | null
          hora_fim_acesso: string | null
          hora_inicio_acesso: string | null
          id: string
          idioma: string | null
          inscricao_municipal: string | null
          logo_url: string | null
          modules_enabled: string[] | null
          nome: string
          orcamento_cabecalho: string | null
          orcamento_logo_url: string | null
          orcamento_rodape: string | null
          plano: Database["public"]["Enums"]["plano_organizacao"]
          regime_tributario: string | null
          rodape_orcamento: string | null
          tema: string | null
          updated_at: string
        }
        Insert: {
          ambiente_nfe?: string | null
          ativo?: boolean
          cabecalho_orcamento?: string | null
          certificado_arquivo_path?: string | null
          certificado_status?: string | null
          cnpj?: string | null
          created_at?: string
          dias_acesso?: string[] | null
          focus_nfe_token?: string | null
          hora_fim_acesso?: string | null
          hora_inicio_acesso?: string | null
          id?: string
          idioma?: string | null
          inscricao_municipal?: string | null
          logo_url?: string | null
          modules_enabled?: string[] | null
          nome: string
          orcamento_cabecalho?: string | null
          orcamento_logo_url?: string | null
          orcamento_rodape?: string | null
          plano?: Database["public"]["Enums"]["plano_organizacao"]
          regime_tributario?: string | null
          rodape_orcamento?: string | null
          tema?: string | null
          updated_at?: string
        }
        Update: {
          ambiente_nfe?: string | null
          ativo?: boolean
          cabecalho_orcamento?: string | null
          certificado_arquivo_path?: string | null
          certificado_status?: string | null
          cnpj?: string | null
          created_at?: string
          dias_acesso?: string[] | null
          focus_nfe_token?: string | null
          hora_fim_acesso?: string | null
          hora_inicio_acesso?: string | null
          id?: string
          idioma?: string | null
          inscricao_municipal?: string | null
          logo_url?: string | null
          modules_enabled?: string[] | null
          nome?: string
          orcamento_cabecalho?: string | null
          orcamento_logo_url?: string | null
          orcamento_rodape?: string | null
          plano?: Database["public"]["Enums"]["plano_organizacao"]
          regime_tributario?: string | null
          rodape_orcamento?: string | null
          tema?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      origens: {
        Row: {
          ativo: boolean
          cor: string | null
          created_at: string
          id: string
          nome: string
          organization_id: string | null
        }
        Insert: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          id?: string
          nome: string
          organization_id?: string | null
        }
        Update: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          id?: string
          nome?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "origens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean
          cest: string | null
          cfop: string | null
          codigo_servico_municipal: string | null
          created_at: string
          cst_csosn: string | null
          grupo_id: string | null
          id: string
          marca: string | null
          ncm: string | null
          nome: string
          organization_id: string | null
          origem_mercadoria: number | null
          preco_custo: number
          preco_venda: number
          quantidade_estoque: number
          sku: string
          unidade_medida: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cest?: string | null
          cfop?: string | null
          codigo_servico_municipal?: string | null
          created_at?: string
          cst_csosn?: string | null
          grupo_id?: string | null
          id?: string
          marca?: string | null
          ncm?: string | null
          nome: string
          organization_id?: string | null
          origem_mercadoria?: number | null
          preco_custo?: number
          preco_venda?: number
          quantidade_estoque?: number
          sku: string
          unidade_medida?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cest?: string | null
          cfop?: string | null
          codigo_servico_municipal?: string | null
          created_at?: string
          cst_csosn?: string | null
          grupo_id?: string | null
          id?: string
          marca?: string | null
          ncm?: string | null
          nome?: string
          organization_id?: string | null
          origem_mercadoria?: number | null
          preco_custo?: number
          preco_venda?: number
          quantidade_estoque?: number
          sku?: string
          unidade_medida?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos_produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          dias_acesso: Json | null
          email: string
          horario_fim: string | null
          horario_inicio: string | null
          id: string
          is_super_admin: boolean | null
          nome: string
          organization_id: string
          simulation_mode: boolean | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          dias_acesso?: Json | null
          email: string
          horario_fim?: string | null
          horario_inicio?: string | null
          id: string
          is_super_admin?: boolean | null
          nome: string
          organization_id: string
          simulation_mode?: boolean | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          dias_acesso?: Json | null
          email?: string
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          is_super_admin?: boolean | null
          nome?: string
          organization_id?: string
          simulation_mode?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_servico: {
        Row: {
          ativo: boolean
          cor: string | null
          created_at: string
          id: string
          nome: string
          organization_id: string | null
        }
        Insert: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          id?: string
          nome: string
          organization_id?: string | null
        }
        Update: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          id?: string
          nome?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tipos_servico_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendedores: {
        Row: {
          ativo: boolean
          cor: string | null
          created_at: string
          id: string
          nome: string
          organization_id: string | null
        }
        Insert: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          id?: string
          nome: string
          organization_id?: string | null
        }
        Update: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          id?: string
          nome?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendedores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      view_pendencias_faturamento: {
        Row: {
          total: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_organization_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_admin: { Args: never; Returns: boolean }
      renovar_contrato: {
        Args: {
          p_contrato_id: string
          p_nova_data_fim: string
          p_nova_data_inicio: string
          p_novo_valor?: number
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "gerente" | "vendedor"
      plano_organizacao: "Basico" | "Pro" | "Enterprise"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "gerente", "vendedor"],
      plano_organizacao: ["Basico", "Pro", "Enterprise"],
    },
  },
} as const
