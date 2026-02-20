
-- Add detailed address fields for NF-e compliance
ALTER TABLE public.notas_fiscais 
  ADD COLUMN IF NOT EXISTS destinatario_logradouro text,
  ADD COLUMN IF NOT EXISTS destinatario_numero text,
  ADD COLUMN IF NOT EXISTS destinatario_bairro text;

-- Add CFOP to produtos (already exists but ensure it's there)
-- Column 'cfop' already exists in produtos table, no action needed.
