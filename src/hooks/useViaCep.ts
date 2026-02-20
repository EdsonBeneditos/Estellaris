import { useState } from "react";
import { toast } from "sonner";

interface ViaCepResult {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export function useViaCep() {
  const [isLoading, setIsLoading] = useState(false);

  const fetchAddress = async (cep: string): Promise<ViaCepResult | null> => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return null;

    setIsLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast.error("CEP não encontrado");
        return null;
      }

      return data as ViaCepResult;
    } catch {
      toast.error("Erro ao buscar CEP");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { fetchAddress, isLoading };
}
