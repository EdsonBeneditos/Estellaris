-- Add access control fields to organizations table
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS hora_inicio_acesso TIME DEFAULT '08:00:00',
ADD COLUMN IF NOT EXISTS hora_fim_acesso TIME DEFAULT '18:00:00',
ADD COLUMN IF NOT EXISTS dias_acesso TEXT[] DEFAULT ARRAY['seg', 'ter', 'qua', 'qui', 'sex'],
ADD COLUMN IF NOT EXISTS tema TEXT DEFAULT 'default',
ADD COLUMN IF NOT EXISTS idioma TEXT DEFAULT 'pt-BR';

-- Add comment for documentation
COMMENT ON COLUMN public.organizations.hora_inicio_acesso IS 'Hora de início do acesso permitido';
COMMENT ON COLUMN public.organizations.hora_fim_acesso IS 'Hora de fim do acesso permitido';
COMMENT ON COLUMN public.organizations.dias_acesso IS 'Dias da semana permitidos: seg, ter, qua, qui, sex, sab, dom';
COMMENT ON COLUMN public.organizations.tema IS 'Tema da interface: default, light, dark';
COMMENT ON COLUMN public.organizations.idioma IS 'Idioma: pt-BR, en-US, es-ES';