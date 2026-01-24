-- Tabela de Clientes
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Dados básicos
  nome TEXT NOT NULL,
  cnpj TEXT,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  cidade TEXT,
  uf TEXT,
  cep TEXT,
  
  -- Rotina de Visitas
  rotina_visitas BOOLEAN NOT NULL DEFAULT false,
  frequencia_visita TEXT, -- Semanal, Quinzenal, Mensal, Bimestral, Trimestral
  ultima_visita DATE,
  proxima_visita DATE,
  
  -- Observações
  observacoes TEXT,
  
  -- Metadata
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Histórico de Contratos
CREATE TABLE public.contratos_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  
  -- Dados do Contrato
  tipo_vinculo TEXT NOT NULL, -- Contrato Formal, Acordo Verbal, Parceria, etc.
  servico_prestado TEXT NOT NULL,
  valor NUMERIC NOT NULL DEFAULT 0,
  recorrente BOOLEAN NOT NULL DEFAULT false,
  
  -- Datas
  data_inicio DATE NOT NULL,
  data_fim DATE,
  
  -- Status: Ativo, Finalizado, Cancelado, Renovado
  status TEXT NOT NULL DEFAULT 'Ativo',
  
  -- Referência ao contrato anterior (para renovações)
  contrato_anterior_id UUID REFERENCES public.contratos_historico(id),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_clientes_organization ON public.clientes(organization_id);
CREATE INDEX idx_clientes_nome ON public.clientes(nome);
CREATE INDEX idx_contratos_organization ON public.contratos_historico(organization_id);
CREATE INDEX idx_contratos_cliente ON public.contratos_historico(cliente_id);
CREATE INDEX idx_contratos_status ON public.contratos_historico(status);
CREATE INDEX idx_contratos_data_fim ON public.contratos_historico(data_fim);

-- Trigger para updated_at
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contratos_updated_at
  BEFORE UPDATE ON public.contratos_historico
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos_historico ENABLE ROW LEVEL SECURITY;

-- RLS Policies para Clientes
CREATE POLICY "Org users can read clientes"
  ON public.clientes FOR SELECT
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can insert clientes"
  ON public.clientes FOR INSERT
  WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can update clientes"
  ON public.clientes FOR UPDATE
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org admins can delete clientes"
  ON public.clientes FOR DELETE
  USING (organization_id = public.get_user_organization_id() AND public.is_org_admin());

-- RLS Policies para Contratos
CREATE POLICY "Org users can read contratos"
  ON public.contratos_historico FOR SELECT
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can insert contratos"
  ON public.contratos_historico FOR INSERT
  WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can update contratos"
  ON public.contratos_historico FOR UPDATE
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org admins can delete contratos"
  ON public.contratos_historico FOR DELETE
  USING (organization_id = public.get_user_organization_id() AND public.is_org_admin());

-- Função para renovar contrato
CREATE OR REPLACE FUNCTION public.renovar_contrato(
  p_contrato_id UUID,
  p_nova_data_inicio DATE,
  p_nova_data_fim DATE,
  p_novo_valor NUMERIC DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contrato_antigo RECORD;
  v_novo_contrato_id UUID;
BEGIN
  -- Buscar contrato atual
  SELECT * INTO v_contrato_antigo
  FROM public.contratos_historico
  WHERE id = p_contrato_id
    AND organization_id = get_user_organization_id();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contrato não encontrado';
  END IF;
  
  -- Marcar contrato atual como Renovado
  UPDATE public.contratos_historico
  SET status = 'Renovado',
      updated_at = now()
  WHERE id = p_contrato_id;
  
  -- Criar novo contrato
  INSERT INTO public.contratos_historico (
    organization_id,
    cliente_id,
    tipo_vinculo,
    servico_prestado,
    valor,
    recorrente,
    data_inicio,
    data_fim,
    status,
    contrato_anterior_id
  ) VALUES (
    v_contrato_antigo.organization_id,
    v_contrato_antigo.cliente_id,
    v_contrato_antigo.tipo_vinculo,
    v_contrato_antigo.servico_prestado,
    COALESCE(p_novo_valor, v_contrato_antigo.valor),
    v_contrato_antigo.recorrente,
    p_nova_data_inicio,
    p_nova_data_fim,
    'Ativo',
    p_contrato_id
  )
  RETURNING id INTO v_novo_contrato_id;
  
  RETURN v_novo_contrato_id;
END;
$$;