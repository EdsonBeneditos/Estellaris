-- Add motivo_perda column to leads table
ALTER TABLE public.leads 
ADD COLUMN motivo_perda text;

-- Add a comment to document the column
COMMENT ON COLUMN public.leads.motivo_perda IS 'Motivo obrigatório quando o status é alterado para Perdido';