import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Contrato, useRenovarContrato } from "@/hooks/useClientes";
import { addYears, format } from "date-fns";

interface RenovarContratoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contrato: Contrato | null;
}

export function RenovarContratoModal({ open, onOpenChange, contrato }: RenovarContratoModalProps) {
  const renovarContrato = useRenovarContrato();
  
  const hoje = new Date();
  const umAnoDepois = addYears(hoje, 1);

  const [formData, setFormData] = useState({
    novaDataInicio: format(hoje, "yyyy-MM-dd"),
    novaDataFim: format(umAnoDepois, "yyyy-MM-dd"),
    novoValor: contrato?.valor?.toString() || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contrato) return;

    await renovarContrato.mutateAsync({
      contratoId: contrato.id,
      novaDataInicio: formData.novaDataInicio,
      novaDataFim: formData.novaDataFim,
      novoValor: formData.novoValor ? parseFloat(formData.novoValor) : undefined,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-zinc-950">Renovar Contrato</DialogTitle>
          <DialogDescription>
            O contrato atual será marcado como "Renovado" e um novo contrato será criado com os dados abaixo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="novaDataInicio">Nova Data de Início *</Label>
            <Input
              id="novaDataInicio"
              type="date"
              value={formData.novaDataInicio}
              onChange={(e) => setFormData({ ...formData, novaDataInicio: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="novaDataFim">Nova Data de Fim *</Label>
            <Input
              id="novaDataFim"
              type="date"
              value={formData.novaDataFim}
              onChange={(e) => setFormData({ ...formData, novaDataFim: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="novoValor">Novo Valor (R$)</Label>
            <Input
              id="novoValor"
              type="number"
              step="0.01"
              min="0"
              value={formData.novoValor}
              onChange={(e) => setFormData({ ...formData, novoValor: e.target.value })}
              placeholder={`Manter valor atual: R$ ${contrato?.valor?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Deixe vazio para manter o valor atual
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={renovarContrato.isPending}>
              {renovarContrato.isPending ? "Renovando..." : "Renovar Contrato"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
