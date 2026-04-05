import { useState } from "react";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Clock, AlertCircle, XCircle, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type CobrancaComCliente, useMarcarComoPago } from "@/hooks/useCobrancas";
import { cn } from "@/lib/utils";

const FORMAS_PAGAMENTO = [
  "Dinheiro",
  "Pix",
  "Cartão Crédito",
  "Cartão Débito",
  "Transferência",
  "Boleto",
];

const STATUS_CONFIG = {
  Pendente: {
    label: "Pendente",
    icon: Clock,
    className: "bg-amber-500/10 text-amber-600 border-amber-300",
  },
  Atrasado: {
    label: "Atrasado",
    icon: AlertCircle,
    className: "bg-red-500/10 text-red-600 border-red-300",
  },
  Pago: {
    label: "Pago",
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-300",
  },
  Cancelado: {
    label: "Cancelado",
    icon: XCircle,
    className: "bg-gray-500/10 text-gray-500 border-gray-300",
  },
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function DiasBadge({ cobranca }: { cobranca: CobrancaComCliente }) {
  if (cobranca.status === "Pago" || cobranca.status === "Cancelado") return null;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const vencimento = parseISO(cobranca.data_vencimento);
  const diff = differenceInDays(vencimento, hoje);

  if (diff > 0) {
    return (
      <span className="text-xs text-muted-foreground">
        Vence em {diff} {diff === 1 ? "dia" : "dias"}
      </span>
    );
  } else if (diff === 0) {
    return <span className="text-xs text-amber-600 font-medium">Vence hoje</span>;
  } else {
    const atraso = Math.abs(diff);
    return (
      <span className="text-xs text-red-600 font-medium">
        {atraso} {atraso === 1 ? "dia" : "dias"} em atraso
      </span>
    );
  }
}

interface PagarModalProps {
  cobranca: CobrancaComCliente;
  open: boolean;
  onClose: () => void;
}

function PagarModal({ cobranca, open, onClose }: PagarModalProps) {
  const marcarPago = useMarcarComoPago();
  const [dataPagamento, setDataPagamento] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [formaPagamento, setFormaPagamento] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const handleConfirm = async () => {
    if (!formaPagamento) return;
    await marcarPago.mutateAsync({
      id: cobranca.id,
      clienteId: cobranca.cliente_id,
      dataPagamento,
      formaPagamento,
      observacoes,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <p className="text-sm text-muted-foreground">
              {cobranca.cliente_nome} — {cobranca.descricao}
            </p>
            <p className="text-lg font-semibold mt-1">{formatCurrency(cobranca.valor)}</p>
          </div>
          <div className="space-y-1.5">
            <Label>Data do Pagamento</Label>
            <Input
              type="date"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Forma de Pagamento *</Label>
            <Select value={formaPagamento} onValueChange={setFormaPagamento}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {FORMAS_PAGAMENTO.map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea
              placeholder="Opcional..."
              rows={2}
              className="resize-none"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleConfirm}
            disabled={!formaPagamento || marcarPago.isPending}
          >
            {marcarPago.isPending ? "Salvando..." : "Confirmar Pagamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CobrancasListProps {
  cobrancas: CobrancaComCliente[];
  showClienteNome?: boolean;
}

export function CobrancasList({ cobrancas, showClienteNome = true }: CobrancasListProps) {
  const [pagarCobranca, setPagarCobranca] = useState<CobrancaComCliente | null>(null);

  if (cobrancas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
        <DollarSign className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">Nenhuma cobrança encontrada</p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-border/40">
        {cobrancas.map((c) => {
          const cfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.Pendente;
          const Icon = cfg.icon;
          const canPay = c.status === "Pendente" || c.status === "Atrasado";

          return (
            <div
              key={c.id}
              className="flex items-center gap-4 px-4 py-3 hover:bg-accent/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {showClienteNome && (
                    <span className="font-semibold text-sm text-foreground truncate">
                      {c.cliente_nome}
                    </span>
                  )}
                  <span className={cn("text-sm", showClienteNome ? "text-muted-foreground" : "font-medium text-foreground")}>
                    {c.descricao}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className="text-xs text-muted-foreground">
                    Venc. {format(parseISO(c.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                  {c.data_pagamento && (
                    <span className="text-xs text-emerald-600">
                      Pago {format(parseISO(c.data_pagamento), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  )}
                  {c.forma_pagamento && (
                    <span className="text-xs text-muted-foreground">{c.forma_pagamento}</span>
                  )}
                  <DiasBadge cobranca={c} />
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="font-semibold text-sm">{formatCurrency(c.valor)}</span>
                <Badge variant="outline" className={cn("text-xs gap-1 border", cfg.className)}>
                  <Icon className="h-3 w-3" />
                  {cfg.label}
                </Badge>
                {canPay && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={() => setPagarCobranca(c)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Pagar
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {pagarCobranca && (
        <PagarModal
          cobranca={pagarCobranca}
          open={true}
          onClose={() => setPagarCobranca(null)}
        />
      )}
    </>
  );
}
