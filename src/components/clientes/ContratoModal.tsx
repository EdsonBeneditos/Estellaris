import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Contrato, useCreateContrato, useUpdateContrato } from "@/hooks/useClientes";

interface ContratoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteId: string;
  contrato?: Contrato | null;
}

const TIPOS_VINCULO = [
  "Contrato Formal",
  "Acordo Verbal",
  "Parceria Comercial",
  "Prestação de Serviço",
  "Outro",
];

const STATUS_OPTIONS = [
  { value: "Ativo", label: "Ativo" },
  { value: "Finalizado", label: "Finalizado" },
  { value: "Cancelado", label: "Cancelado" },
];

export function ContratoModal({ open, onOpenChange, clienteId, contrato }: ContratoModalProps) {
  const createContrato = useCreateContrato();
  const updateContrato = useUpdateContrato();

  const [formData, setFormData] = useState({
    tipo_vinculo: "",
    servico_prestado: "",
    valor: "",
    recorrente: false,
    data_inicio: "",
    data_fim: "",
    status: "Ativo",
  });

  useEffect(() => {
    if (contrato) {
      setFormData({
        tipo_vinculo: contrato.tipo_vinculo || "",
        servico_prestado: contrato.servico_prestado || "",
        valor: contrato.valor?.toString() || "",
        recorrente: contrato.recorrente || false,
        data_inicio: contrato.data_inicio || "",
        data_fim: contrato.data_fim || "",
        status: contrato.status || "Ativo",
      });
    } else {
      setFormData({
        tipo_vinculo: "",
        servico_prestado: "",
        valor: "",
        recorrente: false,
        data_inicio: new Date().toISOString().split("T")[0],
        data_fim: "",
        status: "Ativo",
      });
    }
  }, [contrato, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      cliente_id: clienteId,
      tipo_vinculo: formData.tipo_vinculo,
      servico_prestado: formData.servico_prestado,
      valor: parseFloat(formData.valor) || 0,
      recorrente: formData.recorrente,
      data_inicio: formData.data_inicio,
      data_fim: formData.data_fim || null,
      status: formData.status,
    };

    if (contrato) {
      await updateContrato.mutateAsync({ id: contrato.id, data });
    } else {
      await createContrato.mutateAsync(data);
    }

    onOpenChange(false);
  };

  const isLoading = createContrato.isPending || updateContrato.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-zinc-950">
            {contrato ? "Editar Contrato" : "Novo Contrato"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="tipo_vinculo">Tipo de Vínculo *</Label>
            <Select
              value={formData.tipo_vinculo}
              onValueChange={(value) => setFormData({ ...formData, tipo_vinculo: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_VINCULO.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="servico_prestado">Serviço Prestado *</Label>
            <Input
              id="servico_prestado"
              value={formData.servico_prestado}
              onChange={(e) => setFormData({ ...formData, servico_prestado: e.target.value })}
              required
              placeholder="Descrição do serviço"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                required
                placeholder="0,00"
              />
            </div>

            <div className="flex items-center space-x-3 pt-6">
              <Switch
                id="recorrente"
                checked={formData.recorrente}
                onCheckedChange={(checked) => setFormData({ ...formData, recorrente: checked })}
              />
              <Label htmlFor="recorrente" className="cursor-pointer">Recorrente</Label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data_inicio">Data de Início *</Label>
              <Input
                id="data_inicio"
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="data_fim">Data de Fim</Label>
              <Input
                id="data_fim"
                type="date"
                value={formData.data_fim}
                onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
              />
            </div>
          </div>

          {contrato && (
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : contrato ? "Salvar" : "Cadastrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
