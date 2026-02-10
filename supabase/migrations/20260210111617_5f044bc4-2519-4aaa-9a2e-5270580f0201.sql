
-- Add letterhead fields to organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS orcamento_logo_url text DEFAULT NULL;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS orcamento_cabecalho text DEFAULT NULL;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS orcamento_rodape text DEFAULT NULL;

-- Create storage bucket for organization logos
INSERT INTO storage.buckets (id, name, public) VALUES ('org-logos', 'org-logos', true) ON CONFLICT DO NOTHING;

-- Storage policies for org-logos
CREATE POLICY "Org logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'org-logos');

CREATE POLICY "Authenticated users can upload org logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'org-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update org logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'org-logos' AND auth.role() = 'authenticated');
