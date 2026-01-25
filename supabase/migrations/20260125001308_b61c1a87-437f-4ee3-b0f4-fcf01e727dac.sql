-- Criar tabela de atividades/histórico do cliente
CREATE TABLE public.atividades_cliente (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('Nota', 'Sistema', 'Contrato')),
  descricao TEXT NOT NULL,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  realizado_por UUID REFERENCES auth.users(id),
  realizado_por_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_atividades_cliente_id ON public.atividades_cliente(cliente_id);
CREATE INDEX idx_atividades_org_id ON public.atividades_cliente(organization_id);
CREATE INDEX idx_atividades_data ON public.atividades_cliente(data_hora DESC);

-- Enable RLS
ALTER TABLE public.atividades_cliente ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Org users can read atividades"
  ON public.atividades_cliente FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org users can insert atividades"
  ON public.atividades_cliente FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Org admins can delete atividades"
  ON public.atividades_cliente FOR DELETE
  USING (organization_id = get_user_organization_id() AND is_org_admin());

-- Trigger para registrar renovações de contrato automaticamente
CREATE OR REPLACE FUNCTION public.log_contract_renewal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cliente_nome TEXT;
BEGIN
  -- Quando um novo contrato é criado a partir de renovação
  IF NEW.contrato_anterior_id IS NOT NULL THEN
    SELECT nome INTO v_cliente_nome FROM public.clientes WHERE id = NEW.cliente_id;
    
    INSERT INTO public.atividades_cliente (
      organization_id,
      cliente_id,
      tipo,
      descricao,
      realizado_por,
      realizado_por_email
    ) VALUES (
      NEW.organization_id,
      NEW.cliente_id,
      'Contrato',
      'Contrato renovado. Novo valor: R$ ' || COALESCE(NEW.valor::TEXT, '0') || '. Vigência: ' || 
        TO_CHAR(NEW.data_inicio, 'DD/MM/YYYY') || ' a ' || COALESCE(TO_CHAR(NEW.data_fim, 'DD/MM/YYYY'), 'Indeterminado'),
      auth.uid(),
      (SELECT email FROM auth.users WHERE id = auth.uid())
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_contract_renewal
  AFTER INSERT ON public.contratos_historico
  FOR EACH ROW
  EXECUTE FUNCTION public.log_contract_renewal();

-- Trigger para registrar criação de novos contratos (não renovações)
CREATE OR REPLACE FUNCTION public.log_contract_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Apenas para contratos novos (não renovações)
  IF NEW.contrato_anterior_id IS NULL THEN
    INSERT INTO public.atividades_cliente (
      organization_id,
      cliente_id,
      tipo,
      descricao,
      realizado_por,
      realizado_por_email
    ) VALUES (
      NEW.organization_id,
      NEW.cliente_id,
      'Contrato',
      'Novo contrato criado. Serviço: ' || NEW.servico_prestado || '. Valor: R$ ' || COALESCE(NEW.valor::TEXT, '0'),
      auth.uid(),
      (SELECT email FROM auth.users WHERE id = auth.uid())
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_contract_creation
  AFTER INSERT ON public.contratos_historico
  FOR EACH ROW
  EXECUTE FUNCTION public.log_contract_creation();