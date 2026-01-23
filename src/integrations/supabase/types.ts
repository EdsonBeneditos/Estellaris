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
      caixas: {
        Row: {
          created_at: string
          data_abertura: string
          data_fechamento: string | null
          diferenca: number | null
          id: string
          observacoes: string | null
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
          saldo_final?: number | null
          saldo_inicial?: number
          saldo_sistema?: number | null
          status?: string
          usuario_abertura?: string
          usuario_fechamento?: string | null
        }
        Relationships: []
      }
      categorias_financeiras: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          tipo: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          tipo?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          tipo?: string
        }
        Relationships: []
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
          origem?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      grupos_produtos: {
        Row: {
          created_at: string
          id: string
          nome: string
          numero_referencia: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          numero_referencia: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          numero_referencia?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_interacoes: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          lead_id: string
          status_anterior: string | null
          status_novo: string | null
          tipo: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          lead_id: string
          status_anterior?: string | null
          status_novo?: string | null
          tipo: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          lead_id?: string
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
        ]
      }
      leads: {
        Row: {
          cnpj: string | null
          created_at: string
          data_retorno: string | null
          email: string | null
          empresa: string | null
          id: string
          localizacao: string | null
          meio_contato: string | null
          mes_referencia: string | null
          motivo_perda: string | null
          motivo_perda_detalhe: string | null
          nome_contato: string | null
          origem: string | null
          prioridade: string | null
          proximo_passo: string | null
          status: string | null
          telefone: string | null
          tipo_atendimento: string | null
          tipo_servico: string | null
          vendedor: string | null
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          data_retorno?: string | null
          email?: string | null
          empresa?: string | null
          id?: string
          localizacao?: string | null
          meio_contato?: string | null
          mes_referencia?: string | null
          motivo_perda?: string | null
          motivo_perda_detalhe?: string | null
          nome_contato?: string | null
          origem?: string | null
          prioridade?: string | null
          proximo_passo?: string | null
          status?: string | null
          telefone?: string | null
          tipo_atendimento?: string | null
          tipo_servico?: string | null
          vendedor?: string | null
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          data_retorno?: string | null
          email?: string | null
          empresa?: string | null
          id?: string
          localizacao?: string | null
          meio_contato?: string | null
          mes_referencia?: string | null
          motivo_perda?: string | null
          motivo_perda_detalhe?: string | null
          nome_contato?: string | null
          origem?: string | null
          prioridade?: string | null
          proximo_passo?: string | null
          status?: string | null
          telefone?: string | null
          tipo_atendimento?: string | null
          tipo_servico?: string | null
          vendedor?: string | null
        }
        Relationships: []
      }
      movimentacoes_caixa: {
        Row: {
          caixa_id: string | null
          categoria_id: string | null
          categoria_nome: string | null
          created_at: string
          data_hora: string
          descricao: string | null
          forma_pagamento: string
          id: string
          orcamento_id: string | null
          tipo: string
          usuario_email: string | null
          valor: number
        }
        Insert: {
          caixa_id?: string | null
          categoria_id?: string | null
          categoria_nome?: string | null
          created_at?: string
          data_hora?: string
          descricao?: string | null
          forma_pagamento?: string
          id?: string
          orcamento_id?: string | null
          tipo: string
          usuario_email?: string | null
          valor?: number
        }
        Update: {
          caixa_id?: string | null
          categoria_id?: string | null
          categoria_nome?: string | null
          created_at?: string
          data_hora?: string
          descricao?: string | null
          forma_pagamento?: string
          id?: string
          orcamento_id?: string | null
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
            foreignKeyName: "movimentacoes_caixa_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
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
          destinatario_cep: string | null
          destinatario_cidade: string | null
          destinatario_cnpj: string | null
          destinatario_email: string | null
          destinatario_endereco: string | null
          destinatario_ie: string | null
          destinatario_nome: string
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
          destinatario_cep?: string | null
          destinatario_cidade?: string | null
          destinatario_cnpj?: string | null
          destinatario_email?: string | null
          destinatario_endereco?: string | null
          destinatario_ie?: string | null
          destinatario_nome: string
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
          destinatario_cep?: string | null
          destinatario_cidade?: string | null
          destinatario_cnpj?: string | null
          destinatario_email?: string | null
          destinatario_endereco?: string | null
          destinatario_ie?: string | null
          destinatario_nome?: string
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
        ]
      }
      orcamento_itens: {
        Row: {
          created_at: string
          desconto_percentual: number | null
          desconto_valor: number | null
          id: string
          orcamento_id: string
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
          numero_orcamento: number
          observacoes: string | null
          status: string
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
          numero_orcamento?: number
          observacoes?: string | null
          status?: string
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
          numero_orcamento?: number
          observacoes?: string | null
          status?: string
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
        ]
      }
      origens: {
        Row: {
          ativo: boolean
          cor: string | null
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      produtos: {
        Row: {
          ativo: boolean
          cest: string | null
          created_at: string
          cst_csosn: string | null
          grupo_id: string | null
          id: string
          ncm: string | null
          nome: string
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
          created_at?: string
          cst_csosn?: string | null
          grupo_id?: string | null
          id?: string
          ncm?: string | null
          nome: string
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
          created_at?: string
          cst_csosn?: string | null
          grupo_id?: string | null
          id?: string
          ncm?: string | null
          nome?: string
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
        ]
      }
      tipos_servico: {
        Row: {
          ativo: boolean
          cor: string | null
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          id?: string
          nome?: string
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
        }
        Insert: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
