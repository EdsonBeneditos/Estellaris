-- Create notas_fiscais table
CREATE TABLE public.notas_fiscais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_nota SERIAL,
  orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE SET NULL,
  
  -- Dados do Emitente (empresa)
  emitente_razao_social TEXT DEFAULT 'Acqua Nobilis Ltda',
  emitente_cnpj TEXT DEFAULT '00.000.000/0001-00',
  emitente_endereco TEXT DEFAULT 'Endereço da Empresa',
  emitente_cidade TEXT DEFAULT 'São Paulo',
  emitente_uf TEXT DEFAULT 'SP',
  emitente_cep TEXT DEFAULT '00000-000',
  emitente_telefone TEXT,
  emitente_ie TEXT DEFAULT 'ISENTO',
  
  -- Dados do Destinatário (cliente)
  destinatario_nome TEXT NOT NULL,
  destinatario_cnpj TEXT,
  destinatario_endereco TEXT,
  destinatario_cidade TEXT,
  destinatario_uf TEXT,
  destinatario_cep TEXT,
  destinatario_telefone TEXT,
  destinatario_email TEXT,
  destinatario_ie TEXT,
  
  -- Dados da Nota
  chave_acesso TEXT,
  natureza_operacao TEXT DEFAULT 'Venda de Mercadoria',
  data_emissao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_saida TIMESTAMP WITH TIME ZONE,
  
  -- Valores Totais
  valor_produtos NUMERIC NOT NULL DEFAULT 0,
  valor_frete NUMERIC DEFAULT 0,
  valor_seguro NUMERIC DEFAULT 0,
  valor_desconto NUMERIC DEFAULT 0,
  valor_outras_despesas NUMERIC DEFAULT 0,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  
  -- Tributos (placeholders)
  base_calculo_icms NUMERIC DEFAULT 0,
  valor_icms NUMERIC DEFAULT 0,
  base_calculo_icms_st NUMERIC DEFAULT 0,
  valor_icms_st NUMERIC DEFAULT 0,
  valor_ipi NUMERIC DEFAULT 0,
  valor_pis NUMERIC DEFAULT 0,
  valor_cofins NUMERIC DEFAULT 0,
  valor_total_tributos NUMERIC DEFAULT 0,
  
  -- Informações Adicionais
  informacoes_adicionais TEXT,
  observacoes_fisco TEXT,
  
  -- Status e Controle
  status TEXT NOT NULL DEFAULT 'Rascunho',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create nota_fiscal_itens table
CREATE TABLE public.nota_fiscal_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nota_fiscal_id UUID NOT NULL REFERENCES public.notas_fiscais(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.produtos(id),
  
  -- Dados do Produto
  codigo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  ncm TEXT DEFAULT '00000000',
  cfop TEXT DEFAULT '5102',
  unidade TEXT NOT NULL DEFAULT 'UN',
  quantidade NUMERIC NOT NULL DEFAULT 1,
  valor_unitario NUMERIC NOT NULL,
  valor_total NUMERIC NOT NULL,
  
  -- Tributos do Item
  base_icms NUMERIC DEFAULT 0,
  aliquota_icms NUMERIC DEFAULT 0,
  valor_icms NUMERIC DEFAULT 0,
  aliquota_ipi NUMERIC DEFAULT 0,
  valor_ipi NUMERIC DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nota_fiscal_itens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notas_fiscais
CREATE POLICY "Authenticated users can read notas_fiscais" 
  ON public.notas_fiscais FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert notas_fiscais" 
  ON public.notas_fiscais FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update notas_fiscais" 
  ON public.notas_fiscais FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete notas_fiscais" 
  ON public.notas_fiscais FOR DELETE 
  USING (auth.role() = 'authenticated');

-- RLS Policies for nota_fiscal_itens
CREATE POLICY "Authenticated users can read nota_fiscal_itens" 
  ON public.nota_fiscal_itens FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert nota_fiscal_itens" 
  ON public.nota_fiscal_itens FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update nota_fiscal_itens" 
  ON public.nota_fiscal_itens FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete nota_fiscal_itens" 
  ON public.nota_fiscal_itens FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Trigger for updated_at
CREATE TRIGGER update_notas_fiscais_updated_at
  BEFORE UPDATE ON public.notas_fiscais
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();