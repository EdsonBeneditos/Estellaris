-- Add data_prevista_contato field to futuros_leads table
ALTER TABLE public.futuros_leads 
ADD COLUMN data_prevista_contato DATE NOT NULL DEFAULT CURRENT_DATE;