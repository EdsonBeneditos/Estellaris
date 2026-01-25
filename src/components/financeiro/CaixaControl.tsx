import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DoorOpen, DoorClosed, Clock, User, Lock } from "lucide-react";
import { Caixa, useAbrirCaixa, useTotaisMovimentacoes, useTotaisPorFormaPagamento, MovimentacaoCaixa } from "@/hooks/useFinanceiro";
import { useAuthContext } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FechamentoCegoModal } from "./FechamentoCegoModal";

interface CaixaControlProps {
  caixaAberto: Caixa | null;
  movimentacoes: MovimentacaoCaixa[] | undefined;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export function CaixaControl({ caixaAberto, movimentacoes }: CaixaControlProps) {
  const { user } = useAuthContext();
  const abrirCaixa = useAbrirCaixa();
  const { totalEntradas, totalSaidas } = useTotaisMovimentacoes(movimentacoes);
  const totaisPorForma = useTotaisPorFormaPagamento(movimentacoes);

  const [abrirModalOpen, setAbrirModalOpen] = useState(false);
  const [fecharModalOpen, setFecharModalOpen] = useState(false);
  const [saldoInicial, setSaldoInicial] = useState("");

  const saldoSistema = caixaAberto
    ? Number(caixaAberto.saldo_inicial) + totalEntradas - totalSaidas
    : 0;

  const handleAbrirCaixa = async () => {
    if (!user?.email) return;

    await abrirCaixa.mutateAsync({
      saldo_inicial: Number(saldoInicial) || 0,
      usuario_abertura: user.email,
    });

    setSaldoInicial("");
    setAbrirModalOpen(false);
  };

  return (
    <>
      <Card className="border-border/50 bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Controle de Caixa</CardTitle>
            <Badge
              variant={caixaAberto ? "default" : "secondary"}
              className={caixaAberto ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" : ""}
            >
              {caixaAberto ? "Caixa Aberto" : "Caixa Fechado"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {caixaAberto ? (
            <>
              <div className="grid gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    Aberto em{" "}
                    {format(new Date(caixaAberto.data_abertura), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{caixaAberto.usuario_abertura}</span>
                </div>
              </div>

              <div className="flex flex-col gap-4 pt-2">
                <div className="space-y-1.5 p-3 rounded-lg bg-muted/50 border border-border/50">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Saldo Inicial</span>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(Number(caixaAberto.saldo_inicial))}</p>
                </div>
                <div className="space-y-1.5 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Saldo Atual (Sistema)</span>
                  <p className="text-xl font-bold text-primary">{formatCurrency(saldoSistema)}</p>
                </div>
              </div>

              <Button
                variant="destructive"
                className="w-full mt-4"
                onClick={() => setFecharModalOpen(true)}
              >
                <Lock className="h-4 w-4 mr-2" />
                Fechamento Cego
              </Button>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Nenhum caixa aberto. Abra o caixa para registrar movimentações.
              </p>
              <Button onClick={() => setAbrirModalOpen(true)}>
                <DoorOpen className="h-4 w-4 mr-2" />
                Abrir Caixa
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Abrir Caixa */}
      <Dialog open={abrirModalOpen} onOpenChange={setAbrirModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir Caixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="saldo-inicial">Saldo Inicial (R$)</Label>
              <Input
                id="saldo-inicial"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={saldoInicial}
                onChange={(e) => setSaldoInicial(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Informe o valor em dinheiro disponível no início do dia.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbrirModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAbrirCaixa} disabled={abrirCaixa.isPending}>
              {abrirCaixa.isPending ? "Abrindo..." : "Abrir Caixa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Fechamento Cego */}
      {caixaAberto && (
        <FechamentoCegoModal
          open={fecharModalOpen}
          onOpenChange={setFecharModalOpen}
          caixa={caixaAberto}
          valoresSistema={totaisPorForma}
          saldoInicial={Number(caixaAberto.saldo_inicial)}
        />
      )}
    </>
  );
}
