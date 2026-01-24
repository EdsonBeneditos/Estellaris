import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, CheckCircle2, Lock, Banknote, Smartphone, CreditCard, Coins } from "lucide-react";
import { Caixa, useFecharCaixaCego } from "@/hooks/useFinanceiro";
import { useAuthContext } from "@/contexts/AuthContext";

interface FechamentoCegoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caixa: Caixa;
  valoresSistema: {
    dinheiro: number;
    pix: number;
    cartao: number;
    outros: number;
    total: number;
  };
  saldoInicial: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export function FechamentoCegoModal({
  open,
  onOpenChange,
  caixa,
  valoresSistema,
  saldoInicial,
}: FechamentoCegoModalProps) {
  const { user } = useAuthContext();
  const fecharCaixaCego = useFecharCaixaCego();

  const [valoresContados, setValoresContados] = useState({
    dinheiro: "",
    pix: "",
    cartao: "",
    outros: "",
  });
  const [observacoes, setObservacoes] = useState("");
  const [showResultado, setShowResultado] = useState(false);

  const totalContado =
    (Number(valoresContados.dinheiro) || 0) +
    (Number(valoresContados.pix) || 0) +
    (Number(valoresContados.cartao) || 0) +
    (Number(valoresContados.outros) || 0);

  // Calcular saldo esperado do sistema (saldo inicial + movimentações)
  const saldoSistemaTotal = saldoInicial + valoresSistema.total;

  const handleSubmit = async () => {
    if (!user?.id || !user?.email) return;

    // Para dinheiro, incluir o saldo inicial
    const valoresSistemaAjustados = {
      dinheiro: saldoInicial + valoresSistema.dinheiro,
      pix: valoresSistema.pix,
      cartao: valoresSistema.cartao,
      outros: valoresSistema.outros,
    };

    await fecharCaixaCego.mutateAsync({
      caixaId: caixa.id,
      valoresContados: {
        dinheiro: Number(valoresContados.dinheiro) || 0,
        pix: Number(valoresContados.pix) || 0,
        cartao: Number(valoresContados.cartao) || 0,
        outros: Number(valoresContados.outros) || 0,
      },
      valoresSistema: valoresSistemaAjustados,
      usuario_fechamento: user.email,
      usuario_id: user.id,
      observacoes: observacoes || undefined,
    });

    setShowResultado(true);
  };

  const handleClose = () => {
    setValoresContados({ dinheiro: "", pix: "", cartao: "", outros: "" });
    setObservacoes("");
    setShowResultado(false);
    onOpenChange(false);
  };

  // Calcular diferenças para exibição no resultado
  const diferencas = {
    dinheiro: (Number(valoresContados.dinheiro) || 0) - (saldoInicial + valoresSistema.dinheiro),
    pix: (Number(valoresContados.pix) || 0) - valoresSistema.pix,
    cartao: (Number(valoresContados.cartao) || 0) - valoresSistema.cartao,
    outros: (Number(valoresContados.outros) || 0) - valoresSistema.outros,
    total: totalContado - saldoSistemaTotal,
  };

  const temDiferenca = diferencas.total !== 0;

  if (showResultado) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {temDiferenca ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Fechamento com Diferença
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Fechamento Concluído
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Registro de auditoria gerado automaticamente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Resumo por forma de pagamento */}
            <div className="grid gap-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium">Dinheiro</span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    Contado: {formatCurrency(Number(valoresContados.dinheiro) || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Sistema: {formatCurrency(saldoInicial + valoresSistema.dinheiro)}
                  </div>
                  <Badge variant={diferencas.dinheiro === 0 ? "default" : "destructive"}>
                    {diferencas.dinheiro >= 0 ? "+" : ""}{formatCurrency(diferencas.dinheiro)}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-cyan-600" />
                  <span className="font-medium">PIX</span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    Contado: {formatCurrency(Number(valoresContados.pix) || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Sistema: {formatCurrency(valoresSistema.pix)}
                  </div>
                  <Badge variant={diferencas.pix === 0 ? "default" : "destructive"}>
                    {diferencas.pix >= 0 ? "+" : ""}{formatCurrency(diferencas.pix)}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-violet-600" />
                  <span className="font-medium">Cartão</span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    Contado: {formatCurrency(Number(valoresContados.cartao) || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Sistema: {formatCurrency(valoresSistema.cartao)}
                  </div>
                  <Badge variant={diferencas.cartao === 0 ? "default" : "destructive"}>
                    {diferencas.cartao >= 0 ? "+" : ""}{formatCurrency(diferencas.cartao)}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-orange-600" />
                  <span className="font-medium">Outros</span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    Contado: {formatCurrency(Number(valoresContados.outros) || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Sistema: {formatCurrency(valoresSistema.outros)}
                  </div>
                  <Badge variant={diferencas.outros === 0 ? "default" : "destructive"}>
                    {diferencas.outros >= 0 ? "+" : ""}{formatCurrency(diferencas.outros)}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Total */}
            <Card className={temDiferenca ? "border-amber-500/50 bg-amber-500/5" : "border-emerald-500/50 bg-emerald-500/5"}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg">Diferença Total</span>
                  <span className={`text-2xl font-bold ${temDiferenca ? "text-amber-600" : "text-emerald-600"}`}>
                    {diferencas.total >= 0 ? "+" : ""}{formatCurrency(diferencas.total)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Registro de auditoria */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
              <Lock className="h-4 w-4" />
              <span>
                Fechamento registrado por <strong>{user?.email}</strong> em {new Date().toLocaleString("pt-BR")}. 
                Este registro é imutável e será mantido para auditoria.
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleClose}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Fechamento de Caixa (Contagem Cega)
          </DialogTitle>
          <DialogDescription>
            Informe os valores contados fisicamente. O sistema comparará automaticamente 
            com os registros internos para identificar diferenças.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Contagem Cega Ativa:</strong> Os valores do sistema estão ocultos. 
                Conte fisicamente cada forma de pagamento antes de informar.
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {/* Dinheiro */}
            <div className="space-y-2">
              <Label htmlFor="dinheiro" className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-emerald-600" />
                Dinheiro em Caixa (inclui troco inicial)
              </Label>
              <Input
                id="dinheiro"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={valoresContados.dinheiro}
                onChange={(e) => setValoresContados({ ...valoresContados, dinheiro: e.target.value })}
                className="text-lg"
              />
            </div>

            {/* PIX */}
            <div className="space-y-2">
              <Label htmlFor="pix" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-cyan-600" />
                Total Recebido via PIX
              </Label>
              <Input
                id="pix"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={valoresContados.pix}
                onChange={(e) => setValoresContados({ ...valoresContados, pix: e.target.value })}
                className="text-lg"
              />
            </div>

            {/* Cartão */}
            <div className="space-y-2">
              <Label htmlFor="cartao" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-violet-600" />
                Total Recebido em Cartão
              </Label>
              <Input
                id="cartao"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={valoresContados.cartao}
                onChange={(e) => setValoresContados({ ...valoresContados, cartao: e.target.value })}
                className="text-lg"
              />
            </div>

            {/* Outros */}
            <div className="space-y-2">
              <Label htmlFor="outros" className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-orange-600" />
                Outros (Cheque, Transferência, etc.)
              </Label>
              <Input
                id="outros"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={valoresContados.outros}
                onChange={(e) => setValoresContados({ ...valoresContados, outros: e.target.value })}
                className="text-lg"
              />
            </div>
          </div>

          <Separator />

          {/* Total Contado */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Contado</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(totalContado)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              id="observacoes"
              placeholder="Notas sobre o fechamento..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={fecharCaixaCego.isPending || totalContado === 0}
          >
            {fecharCaixaCego.isPending ? "Processando..." : "Confirmar Fechamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
