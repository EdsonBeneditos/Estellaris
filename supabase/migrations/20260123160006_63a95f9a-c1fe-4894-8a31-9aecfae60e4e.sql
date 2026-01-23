-- Tabela de Orçamentos/Vendas
CREATE TABLE public.orcamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_orcamento SERIAL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  
  -- Dados do cliente (para venda de balcão ou quando não há lead)
  cliente_nome TEXT,
  cliente_cnpj TEXT,
  cliente_telefone TEXT,
  cliente_email TEXT,
  cliente_endereco TEXT,
  
  -- Status e valores
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Aprovado', 'Cancelado')),
  subtotal NUMERIC NOT NULL DEFAULT 0,
  desconto_total NUMERIC NOT NULL DEFAULT 0,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  
  -- Observações e validade
  observacoes TEXT,
  validade_dias INTEGER DEFAULT 30,
  data_validade DATE,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Itens do Orçamento
CREATE TABLE public.orcamento_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE RESTRICT,
  
  -- Dados do produto no momento da venda (snapshot)
  produto_nome TEXT NOT NULL,
  produto_sku TEXT NOT NULL,
  unidade_medida TEXT NOT NULL DEFAULT 'UN',
  
  -- Valores e quantidades
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario NUMERIC NOT NULL,
  desconto_percentual NUMERIC DEFAULT 0,
  desconto_valor NUMERIC DEFAULT 0,
  valor_total NUMERIC NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamento_itens ENABLE ROW LEVEL SECURITY;

-- Políticas para orcamentos
CREATE POLICY "Authenticated users can read orcamentos" 
  ON public.orcamentos FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert orcamentos" 
  ON public.orcamentos FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update orcamentos" 
  ON public.orcamentos FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete orcamentos" 
  ON public.orcamentos FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Políticas para orcamento_itens
CREATE POLICY "Authenticated users can read orcamento_itens" 
  ON public.orcamento_itens FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert orcamento_itens" 
  ON public.orcamento_itens FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update orcamento_itens" 
  ON public.orcamento_itens FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete orcamento_itens" 
  ON public.orcamento_itens FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Trigger para atualizar updated_at
CREATE TRIGGER update_orcamentos_updated_at
  BEFORE UPDATE ON public.orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para gerenciar estoque automaticamente
CREATE OR REPLACE FUNCTION public.manage_stock_on_orcamento_status()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
BEGIN
  -- Se mudou para Aprovado (venda concluída)
  IF NEW.status = 'Aprovado' AND (OLD.status IS NULL OR OLD.status != 'Aprovado') THEN
    -- Subtrair do estoque
    FOR item IN SELECT produto_id, quantidade FROM public.orcamento_itens WHERE orcamento_id = NEW.id
    LOOP
      UPDATE public.produtos 
      SET quantidade_estoque = quantidade_estoque - item.quantidade
      WHERE id = item.produto_id;
    END LOOP;
  
  -- Se mudou de Aprovado para Cancelado (estorno)
  ELSIF NEW.status = 'Cancelado' AND OLD.status = 'Aprovado' THEN
    -- Devolver ao estoque
    FOR item IN SELECT produto_id, quantidade FROM public.orcamento_itens WHERE orcamento_id = NEW.id
    LOOP
      UPDATE public.produtos 
      SET quantidade_estoque = quantidade_estoque + item.quantidade
      WHERE id = item.produto_id;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para automação de estoque
CREATE TRIGGER manage_stock_trigger
  AFTER UPDATE ON public.orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.manage_stock_on_orcamento_status();

-- Índices para performance
CREATE INDEX idx_orcamentos_status ON public.orcamentos(status);
CREATE INDEX idx_orcamentos_lead_id ON public.orcamentos(lead_id);
CREATE INDEX idx_orcamento_itens_orcamento_id ON public.orcamento_itens(orcamento_id);
CREATE INDEX idx_orcamento_itens_produto_id ON public.orcamento_itens(produto_id);