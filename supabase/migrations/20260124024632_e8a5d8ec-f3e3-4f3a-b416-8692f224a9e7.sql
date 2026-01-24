-- Enum para planos de assinatura
CREATE TYPE public.plano_organizacao AS ENUM ('Basico', 'Pro', 'Enterprise');

-- Enum para cargos/roles
CREATE TYPE public.app_role AS ENUM ('admin', 'gerente', 'vendedor');

-- Tabela de Organizações (Tenants)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  plano plano_organizacao NOT NULL DEFAULT 'Basico',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Perfis de Usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela separada para roles (seguindo boas práticas de segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'vendedor',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Adicionar organization_id às tabelas existentes
ALTER TABLE public.leads ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.futuros_leads ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.produtos ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.grupos_produtos ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.orcamentos ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.notas_fiscais ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.caixas ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.movimentacoes_caixa ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.categorias_financeiras ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.vendedores ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.origens ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.tipos_servico ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- Criar índices para performance
CREATE INDEX idx_profiles_org ON public.profiles(organization_id);
CREATE INDEX idx_leads_org ON public.leads(organization_id);
CREATE INDEX idx_futuros_leads_org ON public.futuros_leads(organization_id);
CREATE INDEX idx_produtos_org ON public.produtos(organization_id);
CREATE INDEX idx_grupos_produtos_org ON public.grupos_produtos(organization_id);
CREATE INDEX idx_orcamentos_org ON public.orcamentos(organization_id);
CREATE INDEX idx_notas_fiscais_org ON public.notas_fiscais(organization_id);
CREATE INDEX idx_caixas_org ON public.caixas(organization_id);
CREATE INDEX idx_movimentacoes_caixa_org ON public.movimentacoes_caixa(organization_id);
CREATE INDEX idx_categorias_financeiras_org ON public.categorias_financeiras(organization_id);
CREATE INDEX idx_vendedores_org ON public.vendedores(organization_id);
CREATE INDEX idx_origens_org ON public.origens(organization_id);
CREATE INDEX idx_tipos_servico_org ON public.tipos_servico(organization_id);

-- Função SECURITY DEFINER para obter organization_id do usuário logado (evita recursão RLS)
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Função SECURITY DEFINER para verificar role do usuário
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Função para verificar se usuário é admin da organização
CREATE OR REPLACE FUNCTION public.is_org_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Habilitar RLS em novas tabelas
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para organizations
CREATE POLICY "Users can view their organization"
  ON public.organizations FOR SELECT
  USING (id = public.get_user_organization_id());

CREATE POLICY "Admins can update their organization"
  ON public.organizations FOR UPDATE
  USING (id = public.get_user_organization_id() AND public.is_org_admin());

-- Políticas RLS para profiles
CREATE POLICY "Users can view profiles in their organization"
  ON public.profiles FOR SELECT
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins can insert profiles in their organization"
  ON public.profiles FOR INSERT
  WITH CHECK (organization_id = public.get_user_organization_id() AND public.is_org_admin());

CREATE POLICY "Admins can delete profiles in their organization"
  ON public.profiles FOR DELETE
  USING (organization_id = public.get_user_organization_id() AND public.is_org_admin() AND id != auth.uid());

-- Políticas RLS para user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles in their organization"
  ON public.user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = public.user_roles.user_id
      AND p.organization_id = public.get_user_organization_id()
    )
    AND public.is_org_admin()
  );

-- Remover políticas antigas e criar novas com filtro por organization_id

-- LEADS
DROP POLICY IF EXISTS "Acesso Gerencial Acqua Nobilis" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can delete leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can read leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON public.leads;
DROP POLICY IF EXISTS "Edicao_Gerencial" ON public.leads;
DROP POLICY IF EXISTS "Exclusao_Admin" ON public.leads;
DROP POLICY IF EXISTS "Insercao_Gerencial" ON public.leads;
DROP POLICY IF EXISTS "Leitura_Gerencial" ON public.leads;

CREATE POLICY "Org users can read leads"
  ON public.leads FOR SELECT
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can insert leads"
  ON public.leads FOR INSERT
  WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can update leads"
  ON public.leads FOR UPDATE
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org admins can delete leads"
  ON public.leads FOR DELETE
  USING (organization_id = public.get_user_organization_id() AND public.is_org_admin());

-- FUTUROS_LEADS
DROP POLICY IF EXISTS "Authenticated users can delete futuros_leads" ON public.futuros_leads;
DROP POLICY IF EXISTS "Authenticated users can insert futuros_leads" ON public.futuros_leads;
DROP POLICY IF EXISTS "Authenticated users can read futuros_leads" ON public.futuros_leads;
DROP POLICY IF EXISTS "Authenticated users can update futuros_leads" ON public.futuros_leads;

CREATE POLICY "Org users can read futuros_leads"
  ON public.futuros_leads FOR SELECT
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can insert futuros_leads"
  ON public.futuros_leads FOR INSERT
  WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can update futuros_leads"
  ON public.futuros_leads FOR UPDATE
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org admins can delete futuros_leads"
  ON public.futuros_leads FOR DELETE
  USING (organization_id = public.get_user_organization_id() AND public.is_org_admin());

-- PRODUTOS
DROP POLICY IF EXISTS "Authenticated users can delete produtos" ON public.produtos;
DROP POLICY IF EXISTS "Authenticated users can insert produtos" ON public.produtos;
DROP POLICY IF EXISTS "Authenticated users can read produtos" ON public.produtos;
DROP POLICY IF EXISTS "Authenticated users can update produtos" ON public.produtos;

CREATE POLICY "Org users can read produtos"
  ON public.produtos FOR SELECT
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can insert produtos"
  ON public.produtos FOR INSERT
  WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can update produtos"
  ON public.produtos FOR UPDATE
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org admins can delete produtos"
  ON public.produtos FOR DELETE
  USING (organization_id = public.get_user_organization_id() AND public.is_org_admin());

-- GRUPOS_PRODUTOS
DROP POLICY IF EXISTS "Authenticated users can delete grupos_produtos" ON public.grupos_produtos;
DROP POLICY IF EXISTS "Authenticated users can insert grupos_produtos" ON public.grupos_produtos;
DROP POLICY IF EXISTS "Authenticated users can read grupos_produtos" ON public.grupos_produtos;
DROP POLICY IF EXISTS "Authenticated users can update grupos_produtos" ON public.grupos_produtos;

CREATE POLICY "Org users can read grupos_produtos"
  ON public.grupos_produtos FOR SELECT
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can insert grupos_produtos"
  ON public.grupos_produtos FOR INSERT
  WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can update grupos_produtos"
  ON public.grupos_produtos FOR UPDATE
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org admins can delete grupos_produtos"
  ON public.grupos_produtos FOR DELETE
  USING (organization_id = public.get_user_organization_id() AND public.is_org_admin());

-- ORCAMENTOS
DROP POLICY IF EXISTS "Authenticated users can delete orcamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Authenticated users can insert orcamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Authenticated users can read orcamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Authenticated users can update orcamentos" ON public.orcamentos;

CREATE POLICY "Org users can read orcamentos"
  ON public.orcamentos FOR SELECT
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can insert orcamentos"
  ON public.orcamentos FOR INSERT
  WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can update orcamentos"
  ON public.orcamentos FOR UPDATE
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org admins can delete orcamentos"
  ON public.orcamentos FOR DELETE
  USING (organization_id = public.get_user_organization_id() AND public.is_org_admin());

-- NOTAS_FISCAIS
DROP POLICY IF EXISTS "Authenticated users can delete notas_fiscais" ON public.notas_fiscais;
DROP POLICY IF EXISTS "Authenticated users can insert notas_fiscais" ON public.notas_fiscais;
DROP POLICY IF EXISTS "Authenticated users can read notas_fiscais" ON public.notas_fiscais;
DROP POLICY IF EXISTS "Authenticated users can update notas_fiscais" ON public.notas_fiscais;

CREATE POLICY "Org users can read notas_fiscais"
  ON public.notas_fiscais FOR SELECT
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can insert notas_fiscais"
  ON public.notas_fiscais FOR INSERT
  WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can update notas_fiscais"
  ON public.notas_fiscais FOR UPDATE
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org admins can delete notas_fiscais"
  ON public.notas_fiscais FOR DELETE
  USING (organization_id = public.get_user_organization_id() AND public.is_org_admin());

-- CAIXAS
DROP POLICY IF EXISTS "Authenticated users can delete caixas" ON public.caixas;
DROP POLICY IF EXISTS "Authenticated users can insert caixas" ON public.caixas;
DROP POLICY IF EXISTS "Authenticated users can read caixas" ON public.caixas;
DROP POLICY IF EXISTS "Authenticated users can update caixas" ON public.caixas;

CREATE POLICY "Org users can read caixas"
  ON public.caixas FOR SELECT
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can insert caixas"
  ON public.caixas FOR INSERT
  WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can update caixas"
  ON public.caixas FOR UPDATE
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org admins can delete caixas"
  ON public.caixas FOR DELETE
  USING (organization_id = public.get_user_organization_id() AND public.is_org_admin());

-- MOVIMENTACOES_CAIXA
DROP POLICY IF EXISTS "Authenticated users can delete movimentacoes_caixa" ON public.movimentacoes_caixa;
DROP POLICY IF EXISTS "Authenticated users can insert movimentacoes_caixa" ON public.movimentacoes_caixa;
DROP POLICY IF EXISTS "Authenticated users can read movimentacoes_caixa" ON public.movimentacoes_caixa;
DROP POLICY IF EXISTS "Authenticated users can update movimentacoes_caixa" ON public.movimentacoes_caixa;

CREATE POLICY "Org users can read movimentacoes_caixa"
  ON public.movimentacoes_caixa FOR SELECT
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can insert movimentacoes_caixa"
  ON public.movimentacoes_caixa FOR INSERT
  WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can update movimentacoes_caixa"
  ON public.movimentacoes_caixa FOR UPDATE
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org admins can delete movimentacoes_caixa"
  ON public.movimentacoes_caixa FOR DELETE
  USING (organization_id = public.get_user_organization_id() AND public.is_org_admin());

-- CATEGORIAS_FINANCEIRAS
DROP POLICY IF EXISTS "Authenticated users can delete categorias_financeiras" ON public.categorias_financeiras;
DROP POLICY IF EXISTS "Authenticated users can insert categorias_financeiras" ON public.categorias_financeiras;
DROP POLICY IF EXISTS "Authenticated users can read categorias_financeiras" ON public.categorias_financeiras;
DROP POLICY IF EXISTS "Authenticated users can update categorias_financeiras" ON public.categorias_financeiras;

CREATE POLICY "Org users can read categorias_financeiras"
  ON public.categorias_financeiras FOR SELECT
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can insert categorias_financeiras"
  ON public.categorias_financeiras FOR INSERT
  WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can update categorias_financeiras"
  ON public.categorias_financeiras FOR UPDATE
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org admins can delete categorias_financeiras"
  ON public.categorias_financeiras FOR DELETE
  USING (organization_id = public.get_user_organization_id() AND public.is_org_admin());

-- VENDEDORES
DROP POLICY IF EXISTS "Authenticated users can delete vendedores" ON public.vendedores;
DROP POLICY IF EXISTS "Authenticated users can insert vendedores" ON public.vendedores;
DROP POLICY IF EXISTS "Authenticated users can read vendedores" ON public.vendedores;
DROP POLICY IF EXISTS "Authenticated users can update vendedores" ON public.vendedores;

CREATE POLICY "Org users can read vendedores"
  ON public.vendedores FOR SELECT
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can insert vendedores"
  ON public.vendedores FOR INSERT
  WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can update vendedores"
  ON public.vendedores FOR UPDATE
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org admins can delete vendedores"
  ON public.vendedores FOR DELETE
  USING (organization_id = public.get_user_organization_id() AND public.is_org_admin());

-- ORIGENS
DROP POLICY IF EXISTS "Authenticated users can read origens" ON public.origens;
DROP POLICY IF EXISTS "Gerenciamento de Configuração Admin" ON public.origens;
DROP POLICY IF EXISTS "Leitura de Configuração SDR" ON public.origens;

CREATE POLICY "Org users can read origens"
  ON public.origens FOR SELECT
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can insert origens"
  ON public.origens FOR INSERT
  WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can update origens"
  ON public.origens FOR UPDATE
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org admins can delete origens"
  ON public.origens FOR DELETE
  USING (organization_id = public.get_user_organization_id() AND public.is_org_admin());

-- TIPOS_SERVICO
DROP POLICY IF EXISTS "Authenticated users can delete tipos_servico" ON public.tipos_servico;
DROP POLICY IF EXISTS "Authenticated users can insert tipos_servico" ON public.tipos_servico;
DROP POLICY IF EXISTS "Authenticated users can read tipos_servico" ON public.tipos_servico;
DROP POLICY IF EXISTS "Authenticated users can update tipos_servico" ON public.tipos_servico;

CREATE POLICY "Org users can read tipos_servico"
  ON public.tipos_servico FOR SELECT
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can insert tipos_servico"
  ON public.tipos_servico FOR INSERT
  WITH CHECK (organization_id = public.get_user_organization_id());

CREATE POLICY "Org users can update tipos_servico"
  ON public.tipos_servico FOR UPDATE
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Org admins can delete tipos_servico"
  ON public.tipos_servico FOR DELETE
  USING (organization_id = public.get_user_organization_id() AND public.is_org_admin());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- O perfil será criado manualmente pelo admin ao convidar usuários
  -- Esta função pode ser expandida para criar perfis automaticamente se necessário
  RETURN NEW;
END;
$$;