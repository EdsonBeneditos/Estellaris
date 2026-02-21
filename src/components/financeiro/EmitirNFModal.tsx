import { useState, useEffect } from "react";
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
import { useViaCep } from "@/hooks/useViaCep";
import { applyCEPMask } from "@/lib/masks";
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
  const { fetchAddress, isLoading: isLoadingCep } = useViaCep();
  const [isEmitting, setIsEmitting] = useState(false);
  const [destinatarioNome, setDestinatarioNome] = useState("");
  const [destinatarioCnpj, setDestinatarioCnpj] = useState("");
  const [destinatarioCep, setDestinatarioCep] = useState("");
  const [destinatarioLogradouro, setDestinatarioLogradouro] = useState("");
  const [destinatarioNumero, setDestinatarioNumero] = useState("");
  const [destinatarioBairro, setDestinatarioBairro] = useState("");
  const [destinatarioCidade, setDestinatarioCidade] = useState("");
  const [destinatarioUf, setDestinatarioUf] = useState("");
  const [ncm, setNcm] = useState("");
  const [cfop, setCfop] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // Auto-populate from orcamento products
  useEffect(() => {
    if (!movimentacao?.orcamento_id || !open) return;
    
    supabase
      .from("orcamento_itens")
      .select("produto_id")
      .eq("orcamento_id", movimentacao.orcamento_id)
      .limit(1)
      .then(({ data: itens }) => {
        if (itens?.[0]) {
          supabase
            .from("produtos")
            .select("ncm, cfop, cest")
            .eq("id", itens[0].produto_id)
            .single()
            .then(({ data: produto }) => {
              if (produto) {
                setNcm(produto.ncm || "");
                setCfop(produto.cfop || "");
              }
            });
        }
      });

    supabase
      .from("orcamentos")
      .select("cliente_nome, cliente_cnpj, cliente_endereco")
      .eq("id", movimentacao.orcamento_id)
      .single()
      .then(({ data: orc }) => {
        if (orc) {
          setDestinatarioNome(orc.cliente_nome || "");
          setDestinatarioCnpj(orc.cliente_cnpj || "");
        }
      });
  }, [movimentacao?.orcamento_id, open]);

  const handleCepBlur = async () => {
    const result = await fetchAddress(destinatarioCep);
    if (result) {
      setDestinatarioLogradouro(result.logradouro || "");
      setDestinatarioBairro(result.bairro || "");
      setDestinatarioCidade(result.localidade || "");
      setDestinatarioUf(result.uf || "");
    }
  };

  const dadosFiscaisIncompletos = !ncm || ncm === "00000000" || !destinatarioCnpj.trim();

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
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
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
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-2">
                <Label>Nome do Destinatário *</Label>
                <Input placeholder="Razão social ou nome" value={destinatarioNome} onChange={(e) => setDestinatarioNome(e.target.value)} disabled={isEmitting} className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>CNPJ/CPF *</Label>
                <Input placeholder="00.000.000/0001-00" value={destinatarioCnpj} onChange={(e) => setDestinatarioCnpj(e.target.value)} disabled={isEmitting} className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>CEP</Label>
                <Input placeholder="00000-000" value={destinatarioCep} onChange={(e) => setDestinatarioCep(applyCEPMask(e.target.value))} onBlur={handleCepBlur} disabled={isEmitting} className="bg-background" />
                {isLoadingCep && <span className="text-xs text-muted-foreground">Buscando...</span>}
              </div>
              <div className="space-y-2">
                <Label>Logradouro</Label>
                <Input value={destinatarioLogradouro} onChange={(e) => setDestinatarioLogradouro(e.target.value)} disabled={isEmitting} className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Número</Label>
                <Input value={destinatarioNumero} onChange={(e) => setDestinatarioNumero(e.target.value)} disabled={isEmitting} className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Bairro</Label>
                <Input value={destinatarioBairro} onChange={(e) => setDestinatarioBairro(e.target.value)} disabled={isEmitting} className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input value={destinatarioCidade} onChange={(e) => setDestinatarioCidade(e.target.value)} disabled={isEmitting} className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>UF</Label>
                <Input value={destinatarioUf} onChange={(e) => setDestinatarioUf(e.target.value)} maxLength={2} disabled={isEmitting} className="bg-background w-20" />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>NCM *</Label>
                <Input placeholder="00000000" value={ncm} onChange={(e) => setNcm(e.target.value)} disabled={isEmitting} className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>CFOP</Label>
                <Input placeholder="5102" value={cfop} onChange={(e) => setCfop(e.target.value)} disabled={isEmitting} className="bg-background" />
              </div>
            </div>

            {dadosFiscaisIncompletos && (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
                ⚠️ Dados fiscais incompletos — NCM e CNPJ/CPF são obrigatórios para emissão.
              </div>
            )}

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea placeholder="Informações adicionais da nota..." value={observacoes} onChange={(e) => setObservacoes(e.target.value)} disabled={isEmitting} className="bg-background resize-none" rows={2} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isEmitting}>
            Cancelar
          </Button>
          <Button onClick={handleEmitir} disabled={isEmitting || dadosFiscaisIncompletos} className="gap-2">
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
