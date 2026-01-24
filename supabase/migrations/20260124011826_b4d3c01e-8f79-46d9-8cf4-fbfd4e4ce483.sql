-- Adicionar campo autorizado_por para auditoria dupla
ALTER TABLE public.movimentacoes_caixa 
ADD COLUMN IF NOT EXISTS autorizado_por UUID REFERENCES auth.users(id);

-- Adicionar campo para email do autorizador (para exibição)
ALTER TABLE public.movimentacoes_caixa 
ADD COLUMN IF NOT EXISTS autorizado_por_email TEXT;

-- Criar tabela para registrar fechamentos de caixa detalhados
CREATE TABLE IF NOT EXISTS public.fechamentos_caixa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caixa_id UUID NOT NULL REFERENCES public.caixas(id) ON DELETE CASCADE,
  
  -- Valores contados manualmente
  valor_dinheiro_contado NUMERIC NOT NULL DEFAULT 0,
  valor_pix_contado NUMERIC NOT NULL DEFAULT 0,
  valor_cartao_contado NUMERIC NOT NULL DEFAULT 0,
  valor_outros_contado NUMERIC NOT NULL DEFAULT 0,
  total_contado NUMERIC NOT NULL DEFAULT 0,
  
  -- Valores do sistema
  valor_dinheiro_sistema NUMERIC NOT NULL DEFAULT 0,
  valor_pix_sistema NUMERIC NOT NULL DEFAULT 0,
  valor_cartao_sistema NUMERIC NOT NULL DEFAULT 0,
  valor_outros_sistema NUMERIC NOT NULL DEFAULT 0,
  total_sistema NUMERIC NOT NULL DEFAULT 0,
  
  -- Diferenças
  diferenca_dinheiro NUMERIC NOT NULL DEFAULT 0,
  diferenca_pix NUMERIC NOT NULL DEFAULT 0,
  diferenca_cartao NUMERIC NOT NULL DEFAULT 0,
  diferenca_outros NUMERIC NOT NULL DEFAULT 0,
  diferenca_total NUMERIC NOT NULL DEFAULT 0,
  
  -- Auditoria
  realizado_por UUID REFERENCES auth.users(id),
  realizado_por_email TEXT,
  observacoes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fechamentos_caixa ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can read fechamentos_caixa" 
ON public.fechamentos_caixa FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert fechamentos_caixa" 
ON public.fechamentos_caixa FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Atualizar trigger para incluir autorizado_por quando orçamento é aprovado
CREATE OR REPLACE FUNCTION public.create_movimentacao_on_orcamento_aprovado()
RETURNS TRIGGER AS $$
DECLARE
  venda_categoria_id UUID;
  caixa_aberto_id UUID;
BEGIN
  IF NEW.status = 'Aprovado' AND (OLD.status IS NULL OR OLD.status != 'Aprovado') THEN
    SELECT id INTO venda_categoria_id FROM public.categorias_financeiras WHERE nome = 'Venda de Produtos' LIMIT 1;
    SELECT id INTO caixa_aberto_id FROM public.caixas WHERE status = 'Aberto' ORDER BY data_abertura DESC LIMIT 1;
    
    INSERT INTO public.movimentacoes_caixa (
      tipo, 
      valor, 
      categoria_id,
      categoria_nome,
      forma_pagamento, 
      descricao, 
      orcamento_id,
      caixa_id,
      realizado_por,
      usuario_email,
      autorizado_por,
      autorizado_por_email
    ) VALUES (
      'Entrada',
      NEW.valor_total,
      venda_categoria_id,
      'Venda de Produtos',
      'Dinheiro',
      'Venda - Orçamento #' || NEW.numero_orcamento || ' - ' || COALESCE(NEW.cliente_nome, 'Cliente não informado'),
      NEW.id,
      caixa_aberto_id,
      auth.uid(),
      (SELECT email FROM auth.users WHERE id = auth.uid()),
      auth.uid(),
      (SELECT email FROM auth.users WHERE id = auth.uid())
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;