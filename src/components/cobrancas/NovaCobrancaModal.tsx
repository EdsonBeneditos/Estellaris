import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useClientes } from "@/hooks/useClientes";
import { useContratosByCliente } from "@/hooks/useClientes";
import { useCreateCobranca } from "@/hooks/useCobrancas";

interface NovaCobrancaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultClienteId?: string;
}

export function NovaCobrancaModal({ open, onOpenChange, defaultClienteId }: NovaCobrancaModalProps) {
  const createCobranca = useCreateCobranca();
  const { data: clientes = [] } = useClientes();

  const [clienteId, setClienteId] = useState(defaultClienteId || "");
  const [contratoId, setContratoId] = useState<string>("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState<number>(0);
  const [dataVencimento, setDataVencimento] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [observacoes, setObservacoes] = useState("");

  const { data: contratos = [] } = useContratosByCliente(clienteId || null);

  useEffect(() => {
    if (open) {
      setClienteId(defaultClienteId || "");
      setContratoId("");
      setDescricao("");
      setValor(0);
      setDataVencimento(new Date().toISOString().split("T")[0]);
      setObservacoes("");
    }
  }, [open, defaultClienteId]);

  // When contrato is selected, pre-fill description and value
  useEffect(() => {
    if (contratoId) {
      const c = contratos.find((c) => c.id === contratoId);
      if (c) {
        setDescricao(`Mensalidade - ${c.servico_prestado}`);
        setValor(c.valor);
      }
    }
  }, [contratoId, contratos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || !descricao || !valor || !dataVencimento) return;

    await createCobranca.mutateAsync({
      cliente_id: clienteId,
      contrato_id: contratoId || null,
      descricao,
      valor,
      data_vencimento: dataVencimento,
      data_pagamento: null,
      status: "Pendente",
      forma_pagamento: null,
      observacoes: observacoes || null,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Cobrança</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Cliente *</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {clienteId && contratos.length > 0 && (
            <div className="space-y-1.5">
              <Label>Contrato vinculado (opcional)</Label>
              <Select value={contratoId} onValueChange={setContratoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um contrato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">— Sem contrato —</SelectItem>
                  {contratos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.servico_prestado} ({c.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Descrição *</Label>
            <Input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Mensalidade - Monitoramento"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Valor (R$) *</Label>
              <CurrencyInput value={valor} onChange={setValor} placeholder="0,00" />
            </div>
            <div className="space-y-1.5">
              <Label>Data de Vencimento *</Label>
              <Input
                type="date"
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Opcional..."
              rows={2}
              className="resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createCobranca.isPending || !clienteId || !descricao || !valor}>
              {createCobranca.isPending ? "Salvando..." : "Criar Cobrança"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
