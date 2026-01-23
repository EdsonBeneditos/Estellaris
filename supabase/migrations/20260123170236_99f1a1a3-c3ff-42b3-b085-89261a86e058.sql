-- Add fiscal fields to produtos table
ALTER TABLE public.produtos
ADD COLUMN ncm TEXT DEFAULT '00000000',
ADD COLUMN cest TEXT,
ADD COLUMN origem_mercadoria INTEGER DEFAULT 0,
ADD COLUMN cst_csosn TEXT DEFAULT '102';

-- Add comment for origin values
COMMENT ON COLUMN public.produtos.origem_mercadoria IS '0-Nacional, 1-Estrangeira importação direta, 2-Estrangeira adquirida mercado interno, 3-Nacional com mais de 40% conteúdo estrangeiro, 4-Nacional conforme processos básicos, 5-Nacional com menos de 40% conteúdo estrangeiro, 6-Estrangeira importação direta sem similar nacional, 7-Estrangeira adquirida mercado interno sem similar nacional, 8-Nacional com mais de 70% conteúdo importado';

-- Add serie_nota to notas_fiscais table
ALTER TABLE public.notas_fiscais
ADD COLUMN serie_nota TEXT DEFAULT '001',
ADD COLUMN cfop_padrao TEXT DEFAULT '5102';