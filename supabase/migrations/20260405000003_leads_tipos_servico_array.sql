-- Add array field for multiple services per lead
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS tipos_servico text[] NOT NULL DEFAULT '{}';

-- Migrate existing single tipo_servico value into the new array
UPDATE public.leads
  SET tipos_servico = ARRAY[tipo_servico]
  WHERE tipo_servico IS NOT NULL AND tipo_servico <> '' AND tipos_servico = '{}';
