-- Drop existing permissive policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.leads;
DROP POLICY IF EXISTS "Permitir inserção de leads" ON public.leads;
DROP POLICY IF EXISTS "Allow update leads" ON public.leads;
DROP POLICY IF EXISTS "Allow delete leads" ON public.leads;

DROP POLICY IF EXISTS "Allow read lead_interacoes" ON public.lead_interacoes;
DROP POLICY IF EXISTS "Allow insert lead_interacoes" ON public.lead_interacoes;

DROP POLICY IF EXISTS "Allow read vendedores" ON public.vendedores;
DROP POLICY IF EXISTS "Allow insert vendedores" ON public.vendedores;
DROP POLICY IF EXISTS "Allow update vendedores" ON public.vendedores;
DROP POLICY IF EXISTS "Allow delete vendedores" ON public.vendedores;

DROP POLICY IF EXISTS "Allow read tipos_servico" ON public.tipos_servico;
DROP POLICY IF EXISTS "Allow insert tipos_servico" ON public.tipos_servico;
DROP POLICY IF EXISTS "Allow update tipos_servico" ON public.tipos_servico;
DROP POLICY IF EXISTS "Allow delete tipos_servico" ON public.tipos_servico;

DROP POLICY IF EXISTS "Allow read origens" ON public.origens;
DROP POLICY IF EXISTS "Allow insert origens" ON public.origens;
DROP POLICY IF EXISTS "Allow update origens" ON public.origens;
DROP POLICY IF EXISTS "Allow delete origens" ON public.origens;

-- Create secure RLS policies for leads (authenticated users only)
CREATE POLICY "Authenticated users can read leads"
ON public.leads FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert leads"
ON public.leads FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update leads"
ON public.leads FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete leads"
ON public.leads FOR DELETE
TO authenticated
USING (true);

-- Create secure RLS policies for lead_interacoes
CREATE POLICY "Authenticated users can read lead_interacoes"
ON public.lead_interacoes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert lead_interacoes"
ON public.lead_interacoes FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update lead_interacoes"
ON public.lead_interacoes FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete lead_interacoes"
ON public.lead_interacoes FOR DELETE
TO authenticated
USING (true);

-- Create secure RLS policies for vendedores
CREATE POLICY "Authenticated users can read vendedores"
ON public.vendedores FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert vendedores"
ON public.vendedores FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update vendedores"
ON public.vendedores FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete vendedores"
ON public.vendedores FOR DELETE
TO authenticated
USING (true);

-- Create secure RLS policies for tipos_servico
CREATE POLICY "Authenticated users can read tipos_servico"
ON public.tipos_servico FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert tipos_servico"
ON public.tipos_servico FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update tipos_servico"
ON public.tipos_servico FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete tipos_servico"
ON public.tipos_servico FOR DELETE
TO authenticated
USING (true);

-- Create secure RLS policies for origens
CREATE POLICY "Authenticated users can read origens"
ON public.origens FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert origens"
ON public.origens FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update origens"
ON public.origens FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete origens"
ON public.origens FOR DELETE
TO authenticated
USING (true);