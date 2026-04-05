-- Create oportunidades table
CREATE TABLE IF NOT EXISTS public.oportunidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text,
  valor_estimado numeric(15,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Aberta'
    CHECK (status IN ('Aberta','Proposta Enviada','Em Negociação','Ganha','Perdida')),
  motivo_perda text,
  data_fechamento date,
  vendedor text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.oportunidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON public.oportunidades
  USING (organization_id = (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER oportunidades_updated_at
  BEFORE UPDATE ON public.oportunidades
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Index for fast lookups by lead
CREATE INDEX IF NOT EXISTS oportunidades_lead_id_idx ON public.oportunidades(lead_id);
CREATE INDEX IF NOT EXISTS oportunidades_org_id_idx  ON public.oportunidades(organization_id);
