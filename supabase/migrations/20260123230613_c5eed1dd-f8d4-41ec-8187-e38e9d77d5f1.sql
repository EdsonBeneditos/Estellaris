-- Add realizado_por field to movimentacoes_caixa for user tracking
ALTER TABLE public.movimentacoes_caixa 
ADD COLUMN IF NOT EXISTS realizado_por UUID;

-- Update the trigger to capture the user who made the action
CREATE OR REPLACE FUNCTION public.create_movimentacao_on_orcamento_aprovado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    
    -- Criar movimentação de entrada com user tracking
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
      usuario_email
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
      (SELECT email FROM auth.users WHERE id = auth.uid())
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Add additional financial categories if they don't exist
INSERT INTO public.categorias_financeiras (nome, tipo) 
SELECT * FROM (VALUES
  ('Receita de Serviços', 'Entrada'),
  ('Recebimento de Clientes', 'Entrada'),
  ('Juros Recebidos', 'Entrada'),
  ('Outras Receitas', 'Entrada'),
  ('Fornecedores', 'Saída'),
  ('Salários e Encargos', 'Saída'),
  ('Impostos e Taxas', 'Saída'),
  ('Despesas Administrativas', 'Saída'),
  ('Despesas Operacionais', 'Saída'),
  ('Manutenção e Reparos', 'Saída'),
  ('Marketing e Publicidade', 'Saída'),
  ('Utilidades (Água, Luz, Internet)', 'Saída'),
  ('Material de Escritório', 'Saída'),
  ('Outras Despesas', 'Saída')
) AS t(nome, tipo)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categorias_financeiras WHERE categorias_financeiras.nome = t.nome
);