-- Add motivo_perda_detalhe column to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS motivo_perda_detalhe text;

-- Add cor (color) column to origens table
ALTER TABLE public.origens ADD COLUMN IF NOT EXISTS cor text DEFAULT '#3B82F6';

-- Add cor (color) column to vendedores table
ALTER TABLE public.vendedores ADD COLUMN IF NOT EXISTS cor text DEFAULT '#10B981';

-- Add cor (color) column to tipos_servico table
ALTER TABLE public.tipos_servico ADD COLUMN IF NOT EXISTS cor text DEFAULT '#8B5CF6';

-- Create futuros_leads table for prospecting
CREATE TABLE IF NOT EXISTS public.futuros_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa TEXT,
  cnpj TEXT,
  nome_contato TEXT,
  telefone TEXT,
  email TEXT,
  origem TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on futuros_leads
ALTER TABLE public.futuros_leads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for futuros_leads
CREATE POLICY "Authenticated users can read futuros_leads" 
ON public.futuros_leads 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert futuros_leads" 
ON public.futuros_leads 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update futuros_leads" 
ON public.futuros_leads 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete futuros_leads" 
ON public.futuros_leads 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- Add comment
COMMENT ON TABLE public.futuros_leads IS 'Table for storing prospecting/future leads before they become active leads';