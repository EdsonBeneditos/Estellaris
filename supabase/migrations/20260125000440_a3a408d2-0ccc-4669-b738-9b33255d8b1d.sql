-- Configurar cron job para verificar contratos vencendo em 60 dias
-- Roda diariamente às 08:00 (horário UTC, ajustar conforme timezone)
SELECT cron.schedule(
  'check-contract-expiration-daily',
  '0 11 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://rgcajpyjnftyheagpszn.supabase.co/functions/v1/check-contract-expiration',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnY2FqcHlqbmZ0eWhlYWdwc3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzOTY3MTUsImV4cCI6MjA4Mzk3MjcxNX0._Qsp5hNjdkp73lD9EJqBbtTGZtZD_8prcY06Taf75mI"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);