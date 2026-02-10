
-- Adicionar coluna regime_tributario na tabela organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS regime_tributario text DEFAULT 'simples_nacional';

-- Adicionar coluna senha_certificado (hash, não armazena em texto plano)
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS certificado_arquivo_path text;

-- Criar bucket privado para certificados digitais
INSERT INTO storage.buckets (id, name, public) 
VALUES ('certificados', 'certificados', false)
ON CONFLICT (id) DO NOTHING;

-- Política: apenas admins da org podem fazer upload do certificado
CREATE POLICY "Org admins can upload certificados"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'certificados' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (SELECT organization_id::text FROM public.profiles WHERE id = auth.uid())
  AND public.is_org_admin()
);

-- Política: membros da org podem visualizar certificados
CREATE POLICY "Org users can view certificados"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'certificados'
  AND (storage.foldername(name))[1] = (SELECT organization_id::text FROM public.profiles WHERE id = auth.uid())
);

-- Política: admins podem deletar certificados
CREATE POLICY "Org admins can delete certificados"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'certificados'
  AND (storage.foldername(name))[1] = (SELECT organization_id::text FROM public.profiles WHERE id = auth.uid())
  AND public.is_org_admin()
);

-- Política: admins podem atualizar certificados
CREATE POLICY "Org admins can update certificados"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'certificados'
  AND (storage.foldername(name))[1] = (SELECT organization_id::text FROM public.profiles WHERE id = auth.uid())
  AND public.is_org_admin()
);
