-- Create function to update timestamps if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create grupos_produtos table
CREATE TABLE public.grupos_produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  numero_referencia TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create produtos table
CREATE TABLE public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  preco_venda DECIMAL(10,2) NOT NULL DEFAULT 0,
  preco_custo DECIMAL(10,2) NOT NULL DEFAULT 0,
  quantidade_estoque INTEGER NOT NULL DEFAULT 0,
  unidade_medida TEXT NOT NULL DEFAULT 'UN',
  grupo_id UUID REFERENCES public.grupos_produtos(id) ON DELETE SET NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.grupos_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- RLS policies for grupos_produtos
CREATE POLICY "Authenticated users can read grupos_produtos"
ON public.grupos_produtos FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert grupos_produtos"
ON public.grupos_produtos FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update grupos_produtos"
ON public.grupos_produtos FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete grupos_produtos"
ON public.grupos_produtos FOR DELETE
USING (auth.role() = 'authenticated');

-- RLS policies for produtos
CREATE POLICY "Authenticated users can read produtos"
ON public.produtos FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert produtos"
ON public.produtos FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update produtos"
ON public.produtos FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete produtos"
ON public.produtos FOR DELETE
USING (auth.role() = 'authenticated');

-- Create trigger for updated_at on grupos_produtos
CREATE TRIGGER update_grupos_produtos_updated_at
BEFORE UPDATE ON public.grupos_produtos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on produtos
CREATE TRIGGER update_produtos_updated_at
BEFORE UPDATE ON public.produtos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();