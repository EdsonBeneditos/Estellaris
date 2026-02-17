import { useState } from "react";
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
import { AlertCircle } from "lucide-react";
import { useUpdateOrcamento, Orcamento } from "@/hooks/useOrcamentos";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useCurrentProfile } from "@/hooks/useOrganization";
import { toast } from "sonner";

interface CancelarOrcamentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orcamento: Orcamento | null;
}

export function CancelarOrcamentoModal({
  open,
  onOpenChange,
  orcamento,
}: CancelarOrcamentoModalProps) {
  const { user } = useAuthContext();
  const { data: profile } = useCurrentProfile();
  const updateOrcamento = useUpdateOrcamento();
  const [motivo, setMotivo] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleCancel = async () => {
    if (!orcamento || !motivo.trim()) return;
    setIsPending(true);

    try {
      // Update orcamento status to Cancelado (trigger handles stock reversal)
      await updateOrcamento.mutateAsync({
        id: orcamento.id,
        data: {
          status: "Cancelado",
          motivo_cancelamento: motivo.trim(),
        } as any,
      });

      // Register in audit_logs
      await supabase.from("audit_logs").insert({
        organization_id: profile?.organization_id,
        user_id: user?.id,
        acao: "cancelamento_orcamento",
        detalhes: {
          orcamento_id: orcamento.id,
          numero_orcamento: orcamento.numero_orcamento,
          cliente_nome: orcamento.cliente_nome,
          valor_total: orcamento.valor_total,
          motivo: motivo.trim(),
          data_hora: new Date().toISOString(),
        },
      });

      toast.success("Orçamento cancelado. Estoque estornado automaticamente.");
      setMotivo("");
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erro ao cancelar orçamento", { description: error.message });
    } finally {
      setIsPending(false);
    }
  };

  if (!orcamento) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Cancelar Orçamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <p className="text-sm font-medium">
              Orçamento #{String(orcamento.numero_orcamento).padStart(5, "0")}
            </p>
            <p className="text-xs text-muted-foreground">{orcamento.cliente_nome}</p>
            <p className="text-xs text-muted-foreground mt-1">
              ⚠️ O estoque será estornado automaticamente.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">
              Motivo do Cancelamento <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="motivo"
              placeholder="Descreva o motivo do cancelamento..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={4}
              className="resize-none"
            />
            {motivo.trim().length === 0 && (
              <p className="text-xs text-destructive">O motivo é obrigatório.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Voltar
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isPending || !motivo.trim()}
          >
            {isPending ? "Cancelando..." : "Confirmar Cancelamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
