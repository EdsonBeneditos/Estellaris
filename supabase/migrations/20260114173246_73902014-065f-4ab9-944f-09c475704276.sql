-- Criar tabelas para configurações dinâmicas

-- Tabela de Vendedores
CREATE TABLE public.vendedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Tipos de Serviço
CREATE TABLE public.tipos_servico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Origens
CREATE TABLE public.origens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Histórico de Interações do Lead
CREATE TABLE public.lead_interacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'status_change', 'observacao', 'retorno_agendado'
  descricao TEXT,
  status_anterior TEXT,
  status_novo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.origens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_interacoes ENABLE ROW LEVEL SECURITY;

-- Policies for vendedores
CREATE POLICY "Allow read vendedores" ON public.vendedores FOR SELECT USING (true);
CREATE POLICY "Allow insert vendedores" ON public.vendedores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update vendedores" ON public.vendedores FOR UPDATE USING (true);
CREATE POLICY "Allow delete vendedores" ON public.vendedores FOR DELETE USING (true);

-- Policies for tipos_servico
CREATE POLICY "Allow read tipos_servico" ON public.tipos_servico FOR SELECT USING (true);
CREATE POLICY "Allow insert tipos_servico" ON public.tipos_servico FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update tipos_servico" ON public.tipos_servico FOR UPDATE USING (true);
CREATE POLICY "Allow delete tipos_servico" ON public.tipos_servico FOR DELETE USING (true);

-- Policies for origens
CREATE POLICY "Allow read origens" ON public.origens FOR SELECT USING (true);
CREATE POLICY "Allow insert origens" ON public.origens FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update origens" ON public.origens FOR UPDATE USING (true);
CREATE POLICY "Allow delete origens" ON public.origens FOR DELETE USING (true);

-- Policies for lead_interacoes
CREATE POLICY "Allow read lead_interacoes" ON public.lead_interacoes FOR SELECT USING (true);
CREATE POLICY "Allow insert lead_interacoes" ON public.lead_interacoes FOR INSERT WITH CHECK (true);

-- Add UPDATE and DELETE policies to leads table
CREATE POLICY "Allow update leads" ON public.leads FOR UPDATE USING (true);
CREATE POLICY "Allow delete leads" ON public.leads FOR DELETE USING (true);

-- Insert initial data - Vendedores
INSERT INTO public.vendedores (nome) VALUES 
  ('Maria Victoria'),
  ('Francielli'),
  ('Mikaela Deodato'),
  ('Cleriston'),
  ('Roberto Roberti');

-- Insert initial data - Tipos de Serviço
INSERT INTO public.tipos_servico (nome) VALUES 
  ('Outorga de Água'),
  ('Licenciamento Ambiental'),
  ('PGRS (Resíduos Sólidos)'),
  ('Tratamento de Efluentes'),
  ('Projetos de Reuso'),
  ('Consultoria Ambiental');

-- Insert initial data - Origens
INSERT INTO public.origens (nome) VALUES 
  ('WhatsApp'),
  ('Site'),
  ('Indicação'),
  ('LinkedIn'),
  ('Google'),
  ('Evento'),
  ('Telefone'),
  ('Outro');