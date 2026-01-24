import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Cliente, useCreateCliente, useUpdateCliente } from "@/hooks/useClientes";
import { applyCNPJMask, applyPhoneMask, applyCEPMask } from "@/lib/masks";

interface ClienteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: Cliente | null;
}

const FREQUENCIAS_VISITA = [
  { value: "Semanal", label: "Semanal" },
  { value: "Quinzenal", label: "Quinzenal" },
  { value: "Mensal", label: "Mensal" },
  { value: "Bimestral", label: "Bimestral" },
  { value: "Trimestral", label: "Trimestral" },
];

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export function ClienteModal({ open, onOpenChange, cliente }: ClienteModalProps) {
  const createCliente = useCreateCliente();
  const updateCliente = useUpdateCliente();
  
  const [formData, setFormData] = useState({
    nome: "",
    cnpj: "",
    email: "",
    telefone: "",
    endereco: "",
    cidade: "",
    uf: "",
    cep: "",
    rotina_visitas: false,
    frequencia_visita: "",
    ultima_visita: "",
    observacoes: "",
  });

  useEffect(() => {
    if (cliente) {
      setFormData({
        nome: cliente.nome || "",
        cnpj: cliente.cnpj || "",
        email: cliente.email || "",
        telefone: cliente.telefone || "",
        endereco: cliente.endereco || "",
        cidade: cliente.cidade || "",
        uf: cliente.uf || "",
        cep: cliente.cep || "",
        rotina_visitas: cliente.rotina_visitas || false,
        frequencia_visita: cliente.frequencia_visita || "",
        ultima_visita: cliente.ultima_visita || "",
        observacoes: cliente.observacoes || "",
      });
    } else {
      setFormData({
        nome: "",
        cnpj: "",
        email: "",
        telefone: "",
        endereco: "",
        cidade: "",
        uf: "",
        cep: "",
        rotina_visitas: false,
        frequencia_visita: "",
        ultima_visita: "",
        observacoes: "",
      });
    }
  }, [cliente, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      frequencia_visita: formData.rotina_visitas ? formData.frequencia_visita : null,
      ultima_visita: formData.rotina_visitas && formData.ultima_visita ? formData.ultima_visita : null,
    };

    if (cliente) {
      await updateCliente.mutateAsync({ id: cliente.id, data });
    } else {
      await createCliente.mutateAsync(data);
    }
    
    onOpenChange(false);
  };

  const isLoading = createCliente.isPending || updateCliente.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-zinc-950">
            {cliente ? "Editar Cliente" : "Novo Cliente"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Básicos */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-700 border-b pb-2">Dados Básicos</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                  placeholder="Nome do cliente"
                />
              </div>

              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: applyCNPJMask(e.target.value) })}
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: applyPhoneMask(e.target.value) })}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@empresa.com"
                />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-700 border-b pb-2">Endereço</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Rua, número, complemento"
                />
              </div>

              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  placeholder="Cidade"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="uf">UF</Label>
                  <Select
                    value={formData.uf}
                    onValueChange={(value) => setFormData({ ...formData, uf: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {UFS.map((uf) => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => setFormData({ ...formData, cep: applyCEPMask(e.target.value) })}
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Rotina de Visitas */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-700 border-b pb-2">Rotina de Visitas</h3>
            
            <div className="flex items-center space-x-3">
              <Switch
                id="rotina_visitas"
                checked={formData.rotina_visitas}
                onCheckedChange={(checked) => setFormData({ ...formData, rotina_visitas: checked })}
              />
              <Label htmlFor="rotina_visitas" className="cursor-pointer">
                Cliente possui rotina de visitas
              </Label>
            </div>

            {formData.rotina_visitas && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div>
                  <Label htmlFor="frequencia_visita">Frequência</Label>
                  <Select
                    value={formData.frequencia_visita}
                    onValueChange={(value) => setFormData({ ...formData, frequencia_visita: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIAS_VISITA.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ultima_visita">Última Visita</Label>
                  <Input
                    id="ultima_visita"
                    type="date"
                    value={formData.ultima_visita}
                    onChange={(e) => setFormData({ ...formData, ultima_visita: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Observações gerais sobre o cliente..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : cliente ? "Salvar" : "Cadastrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
