import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Loader2, ArrowUpCircle, ArrowDownCircle, ExternalLink } from "lucide-react";
import { MovimentacaoCaixa } from "@/hooks/useFinanceiro";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentProfile } from "@/hooks/useOrganization";
import { toast } from "sonner";

interface EmitirNFModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movimentacao: MovimentacaoCaixa | null;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function EmitirNFModal({ open, onOpenChange, movimentacao }: EmitirNFModalProps) {
  const { data: profile } = useCurrentProfile();
  const [isEmitting, setIsEmitting] = useState(false);
  const [destinatarioNome, setDestinatarioNome] = useState("");
  const [destinatarioCnpj, setDestinatarioCnpj] = useState("");
  const [observacoes, setObservacoes] = useState("");

  if (!movimentacao) return null;

  const handleEmitir = async () => {
    if (!destinatarioNome.trim()) {
      toast.error("Informe o nome do destinatário.");
      return;
    }

    setIsEmitting(true);
    try {
      const ref = `nfe-${movimentacao.id.substring(0, 8)}-${Date.now()}`;

      const { data, error } = await supabase.functions.invoke("focus-nfe", {
        body: {
          action: "create_nfe",
          movimentacao_id: movimentacao.id,
          organization_id: profile?.organization_id,
          ref,
          destinatario_nome: destinatarioNome,
          destinatario_cnpj: destinatarioCnpj || null,
          valor: Number(movimentacao.valor),
          descricao: movimentacao.descricao || `Movimentação #${movimentacao.id.substring(0, 8)}`,
          observacoes: observacoes || null,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`NF #${data.numero_nota} autorizada com sucesso!`, {
          description: data.pdf_url
            ? "PDF disponível para download."
            : data.message || "Nota registrada.",
          action: data.pdf_url
            ? {
                label: "Ver PDF",
                onClick: () => window.open(data.pdf_url, "_blank"),
              }
            : undefined,
          duration: 8000,
          className: "border-emerald-500/30 bg-emerald-500/10",
        });
      } else {
        toast.error("Erro ao emitir nota fiscal", {
          description: data?.error || "Erro desconhecido da Focus NFe",
          duration: 10000,
          className: "border-red-500/30 bg-red-500/10",
        });
      }

      onOpenChange(false);
      setDestinatarioNome("");
      setDestinatarioCnpj("");
      setObservacoes("");
    } catch (error: any) {
      console.error("Erro ao emitir NF:", error);
      toast.error("Erro ao emitir nota fiscal", {
        description: error.message,
        duration: 10000,
      });
    } finally {
      setIsEmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Emitir Nota Fiscal
          </DialogTitle>
          <DialogDescription>
            Gerar nota fiscal a partir desta movimentação
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border/50 p-4 bg-muted/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tipo:</span>
              <Badge variant="secondary" className="gap-1">
                {movimentacao.tipo === "Entrada" ? (
                  <ArrowUpCircle className="h-3 w-3 text-emerald-500" />
                ) : (
                  <ArrowDownCircle className="h-3 w-3 text-red-500" />
                )}
                {movimentacao.tipo}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Valor:</span>
              <span className="font-semibold text-foreground">
                {formatCurrency(Number(movimentacao.valor))}
              </span>
            </div>
            {movimentacao.descricao && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Descrição:</span>
                <span className="text-sm text-foreground truncate max-w-[200px]">
                  {movimentacao.descricao}
                </span>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Destinatário *</Label>
              <Input
                placeholder="Razão social ou nome"
                value={destinatarioNome}
                onChange={(e) => setDestinatarioNome(e.target.value)}
                disabled={isEmitting}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>CNPJ/CPF do Destinatário</Label>
              <Input
                placeholder="00.000.000/0001-00"
                value={destinatarioCnpj}
                onChange={(e) => setDestinatarioCnpj(e.target.value)}
                disabled={isEmitting}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Informações adicionais da nota..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                disabled={isEmitting}
                className="bg-background resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isEmitting}>
            Cancelar
          </Button>
          <Button onClick={handleEmitir} disabled={isEmitting} className="gap-2">
            {isEmitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Emitindo...</>
            ) : (
              <><FileText className="h-4 w-4" /> Emitir NF</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
