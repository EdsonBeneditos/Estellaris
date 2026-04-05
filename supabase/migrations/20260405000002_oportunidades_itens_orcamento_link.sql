-- Add itens (JSONB) to oportunidades so each opportunity can store product lines
ALTER TABLE public.oportunidades
  ADD COLUMN IF NOT EXISTS itens jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Link orcamentos back to the oportunidade that generated it
ALTER TABLE public.orcamentos
  ADD COLUMN IF NOT EXISTS oportunidade_id uuid
    REFERENCES public.oportunidades(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS orcamentos_oportunidade_id_idx
  ON public.orcamentos(oportunidade_id);
