
CREATE OR REPLACE FUNCTION public.create_movimentacao_on_orcamento_aprovado()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  venda_categoria_id UUID;
  caixa_aberto_id UUID;
  org_id UUID;
BEGIN
  IF NEW.status = 'Aprovado' AND (OLD.status IS NULL OR OLD.status != 'Aprovado') THEN
    SELECT id INTO venda_categoria_id FROM public.categorias_financeiras WHERE nome = 'Venda de Produtos' LIMIT 1;
    SELECT id INTO caixa_aberto_id FROM public.caixas WHERE status = 'Aberto' ORDER BY data_abertura DESC LIMIT 1;
    
    -- Get organization_id from the orcamento itself
    org_id := NEW.organization_id;
    
    INSERT INTO public.movimentacoes_caixa (
      tipo, 
      valor, 
      categoria_id,
      categoria_nome,
      forma_pagamento, 
      descricao, 
      orcamento_id,
      caixa_id,
      organization_id,
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
      org_id,
      auth.uid(),
      (SELECT email FROM auth.users WHERE id = auth.uid()),
      auth.uid(),
      (SELECT email FROM auth.users WHERE id = auth.uid())
    );
  END IF;
  
  RETURN NEW;
END;
$function$;
