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
import { FileText, Loader2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { MovimentacaoCaixa } from "@/hooks/useFinanceiro";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentProfile, useCurrentOrganization } from "@/hooks/useOrganization";
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
  const { data: organization } = useCurrentOrganization();
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
      // Registrar log de tentativa
      const { error: logError } = await supabase
        .from("notas_fiscais_logs")
        .insert({
          movimentacao_id: movimentacao.id,
          status: "Pendente",
          organization_id: profile?.organization_id,
        });

      if (logError) throw logError;

      // Criar nota fiscal
      const { data: nota, error: nfError } = await supabase
        .from("notas_fiscais")
        .insert({
          destinatario_nome: destinatarioNome,
          destinatario_cnpj: destinatarioCnpj || null,
          valor_produtos: Number(movimentacao.valor),
          valor_total: Number(movimentacao.valor),
          status: "Pendente",
          informacoes_adicionais: observacoes || null,
          organization_id: profile?.organization_id,
          emitente_razao_social: (organization as any)?.nome || null,
          emitente_cnpj: (organization as any)?.cnpj || null,
        })
        .select()
        .single();

      if (nfError) throw nfError;

      // Atualizar log com sucesso
      await supabase
        .from("notas_fiscais_logs")
        .update({ status: "Autorizada" })
        .eq("movimentacao_id", movimentacao.id)
        .eq("status", "Pendente");

      toast.success(`NF #${nota.numero_nota} criada com sucesso!`);
      onOpenChange(false);
      setDestinatarioNome("");
      setDestinatarioCnpj("");
      setObservacoes("");
    } catch (error: any) {
      console.error("Erro ao emitir NF:", error);

      // Registrar log de erro
      await supabase
        .from("notas_fiscais_logs")
        .update({ status: "Erro", mensagem_erro: error.message })
        .eq("movimentacao_id", movimentacao.id)
        .eq("status", "Pendente");

      toast.error("Erro ao emitir nota fiscal", { description: error.message });
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
          {/* Dados da movimentação */}
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

          {/* Dados do destinatário */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Destinatário *</Label>
              <Input
                placeholder="Razão social ou nome"
                value={destinatarioNome}
                onChange={(e) => setDestinatarioNome(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>CNPJ/CPF do Destinatário</Label>
              <Input
                placeholder="00.000.000/0001-00"
                value={destinatarioCnpj}
                onChange={(e) => setDestinatarioCnpj(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Informações adicionais da nota..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
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
