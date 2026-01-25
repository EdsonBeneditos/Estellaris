-- Tabela para registrar notificações enviadas (evitar duplicatas)
CREATE TABLE public.notificacoes_contratos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  contrato_id UUID NOT NULL,
  cliente_id UUID NOT NULL,
  admin_email TEXT NOT NULL,
  tipo_notificacao TEXT NOT NULL DEFAULT 'vencimento_60_dias',
  data_vencimento DATE NOT NULL,
  data_envio DATE NOT NULL DEFAULT CURRENT_DATE,
  enviado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para evitar duplicatas (usando coluna date diretamente)
CREATE UNIQUE INDEX idx_notificacao_unica 
ON public.notificacoes_contratos (contrato_id, tipo_notificacao, data_envio);

-- Enable RLS
ALTER TABLE public.notificacoes_contratos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Org users can read notificacoes" 
ON public.notificacoes_contratos 
FOR SELECT 
USING (organization_id = get_user_organization_id());

CREATE POLICY "System can insert notificacoes" 
ON public.notificacoes_contratos 
FOR INSERT 
WITH CHECK (true);

-- Habilitar extensões para cron
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;