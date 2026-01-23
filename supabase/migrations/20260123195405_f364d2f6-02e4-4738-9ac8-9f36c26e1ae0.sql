
-- Tabela de categorias (Plano de Contas)
CREATE TABLE public.categorias_financeiras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'Entrada', -- 'Entrada' ou 'Saída'
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de movimentações de caixa
CREATE TABLE public.movimentacoes_caixa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL, -- 'Entrada' ou 'Saída'
  valor NUMERIC NOT NULL DEFAULT 0,
  categoria_id UUID REFERENCES public.categorias_financeiras(id),
  categoria_nome TEXT,
  forma_pagamento TEXT NOT NULL DEFAULT 'Dinheiro', -- 'Pix', 'Cartão Débito', 'Cartão Crédito', 'Dinheiro', 'Boleto', 'Transferência'
  descricao TEXT,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  usuario_email TEXT,
  orcamento_id UUID REFERENCES public.orcamentos(id),
  caixa_id UUID, -- Referência ao período de caixa
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de controle de caixa (abertura/fechamento)
CREATE TABLE public.caixas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data_abertura TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_fechamento TIMESTAMP WITH TIME ZONE,
  saldo_inicial NUMERIC NOT NULL DEFAULT 0,
  saldo_final NUMERIC,
  saldo_sistema NUMERIC, -- Calculado automaticamente
  diferenca NUMERIC, -- Diferença entre saldo informado e sistema
  usuario_abertura TEXT NOT NULL,
  usuario_fechamento TEXT,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'Aberto', -- 'Aberto' ou 'Fechado'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar foreign key após criar a tabela caixas
ALTER TABLE public.movimentacoes_caixa 
ADD CONSTRAINT movimentacoes_caixa_caixa_id_fkey 
FOREIGN KEY (caixa_id) REFERENCES public.caixas(id);

-- Enable RLS
ALTER TABLE public.categorias_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_caixa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixas ENABLE ROW LEVEL SECURITY;

-- Policies para categorias_financeiras
CREATE POLICY "Authenticated users can read categorias_financeiras" 
ON public.categorias_financeiras FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert categorias_financeiras" 
ON public.categorias_financeiras FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update categorias_financeiras" 
ON public.categorias_financeiras FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete categorias_financeiras" 
ON public.categorias_financeiras FOR DELETE 
USING (auth.role() = 'authenticated');

-- Policies para movimentacoes_caixa
CREATE POLICY "Authenticated users can read movimentacoes_caixa" 
ON public.movimentacoes_caixa FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert movimentacoes_caixa" 
ON public.movimentacoes_caixa FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update movimentacoes_caixa" 
ON public.movimentacoes_caixa FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete movimentacoes_caixa" 
ON public.movimentacoes_caixa FOR DELETE 
USING (auth.role() = 'authenticated');

-- Policies para caixas
CREATE POLICY "Authenticated users can read caixas" 
ON public.caixas FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert caixas" 
ON public.caixas FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update caixas" 
ON public.caixas FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete caixas" 
ON public.caixas FOR DELETE 
USING (auth.role() = 'authenticated');

-- Inserir categorias padrão
INSERT INTO public.categorias_financeiras (nome, tipo) VALUES
('Venda de Produtos', 'Entrada'),
('Venda de Serviços', 'Entrada'),
('Recebimento de Clientes', 'Entrada'),
('Outras Entradas', 'Entrada'),
('Fornecedores', 'Saída'),
('Despesas Operacionais', 'Saída'),
('Salários e Encargos', 'Saída'),
('Impostos e Taxas', 'Saída'),
('Outras Saídas', 'Saída');

-- Trigger para criar movimentação automática quando orçamento for aprovado
CREATE OR REPLACE FUNCTION public.create_movimentacao_on_orcamento_aprovado()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  venda_categoria_id UUID;
  caixa_aberto_id UUID;
BEGIN
  -- Se mudou para Aprovado
  IF NEW.status = 'Aprovado' AND (OLD.status IS NULL OR OLD.status != 'Aprovado') THEN
    -- Buscar categoria de Venda de Produtos
    SELECT id INTO venda_categoria_id FROM public.categorias_financeiras WHERE nome = 'Venda de Produtos' LIMIT 1;
    
    -- Buscar caixa aberto (se houver)
    SELECT id INTO caixa_aberto_id FROM public.caixas WHERE status = 'Aberto' ORDER BY data_abertura DESC LIMIT 1;
    
    -- Criar movimentação de entrada
    INSERT INTO public.movimentacoes_caixa (
      tipo, 
      valor, 
      categoria_id,
      categoria_nome,
      forma_pagamento, 
      descricao, 
      orcamento_id,
      caixa_id
    ) VALUES (
      'Entrada',
      NEW.valor_total,
      venda_categoria_id,
      'Venda de Produtos',
      'Dinheiro', -- Padrão, pode ser alterado manualmente depois
      'Venda - Orçamento #' || NEW.numero_orcamento || ' - ' || COALESCE(NEW.cliente_nome, 'Cliente não informado'),
      NEW.id,
      caixa_aberto_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger
CREATE TRIGGER trigger_create_movimentacao_on_orcamento_aprovado
AFTER UPDATE ON public.orcamentos
FOR EACH ROW
EXECUTE FUNCTION public.create_movimentacao_on_orcamento_aprovado();
