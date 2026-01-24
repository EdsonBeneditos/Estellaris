-- Corrigir políticas RLS permissivas nas tabelas filhas

-- LEAD_INTERACOES - adicionar organization_id e corrigir RLS
ALTER TABLE public.lead_interacoes ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
CREATE INDEX idx_lead_interacoes_org ON public.lead_interacoes(organization_id);

DROP POLICY IF EXISTS "Authenticated users can delete lead_interacoes" ON public.lead_interacoes;
DROP POLICY IF EXISTS "Authenticated users can insert lead_interacoes" ON public.lead_interacoes;
DROP POLICY IF EXISTS "Authenticated users can read lead_interacoes" ON public.lead_interacoes;
DROP POLICY IF EXISTS "Authenticated users can update lead_interacoes" ON public.lead_interacoes;

CREATE POLICY "Org users can read lead_interacoes"
  ON public.lead_interacoes FOR SELECT
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can insert lead_interacoes"
  ON public.lead_interacoes FOR INSERT
  WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can update lead_interacoes"
  ON public.lead_interacoes FOR UPDATE
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org admins can delete lead_interacoes"
  ON public.lead_interacoes FOR DELETE
  USING (organization_id = public.get_user_organization_id() AND public.is_org_admin());

-- ORCAMENTO_ITENS - adicionar organization_id e corrigir RLS
ALTER TABLE public.orcamento_itens ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
CREATE INDEX idx_orcamento_itens_org ON public.orcamento_itens(organization_id);

DROP POLICY IF EXISTS "Authenticated users can delete orcamento_itens" ON public.orcamento_itens;
DROP POLICY IF EXISTS "Authenticated users can insert orcamento_itens" ON public.orcamento_itens;
DROP POLICY IF EXISTS "Authenticated users can read orcamento_itens" ON public.orcamento_itens;
DROP POLICY IF EXISTS "Authenticated users can update orcamento_itens" ON public.orcamento_itens;

CREATE POLICY "Org users can read orcamento_itens"
  ON public.orcamento_itens FOR SELECT
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can insert orcamento_itens"
  ON public.orcamento_itens FOR INSERT
  WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can update orcamento_itens"
  ON public.orcamento_itens FOR UPDATE
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org admins can delete orcamento_itens"
  ON public.orcamento_itens FOR DELETE
  USING (organization_id = public.get_user_organization_id() AND public.is_org_admin());

-- NOTA_FISCAL_ITENS - adicionar organization_id e corrigir RLS
ALTER TABLE public.nota_fiscal_itens ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
CREATE INDEX idx_nota_fiscal_itens_org ON public.nota_fiscal_itens(organization_id);

DROP POLICY IF EXISTS "Authenticated users can delete nota_fiscal_itens" ON public.nota_fiscal_itens;
DROP POLICY IF EXISTS "Authenticated users can insert nota_fiscal_itens" ON public.nota_fiscal_itens;
DROP POLICY IF EXISTS "Authenticated users can read nota_fiscal_itens" ON public.nota_fiscal_itens;
DROP POLICY IF EXISTS "Authenticated users can update nota_fiscal_itens" ON public.nota_fiscal_itens;

CREATE POLICY "Org users can read nota_fiscal_itens"
  ON public.nota_fiscal_itens FOR SELECT
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can insert nota_fiscal_itens"
  ON public.nota_fiscal_itens FOR INSERT
  WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can update nota_fiscal_itens"
  ON public.nota_fiscal_itens FOR UPDATE
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org admins can delete nota_fiscal_itens"
  ON public.nota_fiscal_itens FOR DELETE
  USING (organization_id = public.get_user_organization_id() AND public.is_org_admin());

-- FECHAMENTOS_CAIXA - adicionar organization_id e corrigir RLS
ALTER TABLE public.fechamentos_caixa ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
CREATE INDEX idx_fechamentos_caixa_org ON public.fechamentos_caixa(organization_id);

DROP POLICY IF EXISTS "Authenticated users can insert fechamentos_caixa" ON public.fechamentos_caixa;
DROP POLICY IF EXISTS "Authenticated users can read fechamentos_caixa" ON public.fechamentos_caixa;

CREATE POLICY "Org users can read fechamentos_caixa"
  ON public.fechamentos_caixa FOR SELECT
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can insert fechamentos_caixa"
  ON public.fechamentos_caixa FOR INSERT
  WITH CHECK (organization_id = public.get_user_organization_id());