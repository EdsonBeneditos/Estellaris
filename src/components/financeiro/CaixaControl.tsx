import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DoorOpen, DoorClosed, Clock, User } from "lucide-react";
import { Caixa, useAbrirCaixa, useFecharCaixa, useTotaisMovimentacoes, MovimentacaoCaixa } from "@/hooks/useFinanceiro";
import { useAuthContext } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  const fecharCaixa = useFecharCaixa();
  const { totalEntradas, totalSaidas } = useTotaisMovimentacoes(movimentacoes);

  const [abrirModalOpen, setAbrirModalOpen] = useState(false);
  const [fecharModalOpen, setFecharModalOpen] = useState(false);
  const [saldoInicial, setSaldoInicial] = useState("");
  const [saldoFinal, setSaldoFinal] = useState("");
  const [observacoes, setObservacoes] = useState("");

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

  const handleFecharCaixa = async () => {
    if (!caixaAberto || !user?.email) return;

    await fecharCaixa.mutateAsync({
      id: caixaAberto.id,
      saldo_final: Number(saldoFinal) || 0,
      saldo_sistema: saldoSistema,
      usuario_fechamento: user.email,
      observacoes: observacoes || undefined,
    });

    setSaldoFinal("");
    setObservacoes("");
    setFecharModalOpen(false);
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

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Saldo Inicial</span>
                  <p className="font-semibold">{formatCurrency(Number(caixaAberto.saldo_inicial))}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Saldo Atual (Sistema)</span>
                  <p className="font-semibold text-primary">{formatCurrency(saldoSistema)}</p>
                </div>
              </div>

              <Button
                variant="destructive"
                className="w-full mt-4"
                onClick={() => {
                  setSaldoFinal(saldoSistema.toFixed(2));
                  setFecharModalOpen(true);
                }}
              >
                <DoorClosed className="h-4 w-4 mr-2" />
                Fechar Caixa
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

      {/* Modal Fechar Caixa */}
      <Dialog open={fecharModalOpen} onOpenChange={setFecharModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar Caixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
              <div>
                <span className="text-xs text-muted-foreground">Saldo Sistema</span>
                <p className="font-semibold text-primary">{formatCurrency(saldoSistema)}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Entradas/Saídas</span>
                <p className="text-sm">
                  <span className="text-emerald-600">+{formatCurrency(totalEntradas)}</span>
                  {" / "}
                  <span className="text-red-600">-{formatCurrency(totalSaidas)}</span>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="saldo-final">Saldo Final Conferido (R$)</Label>
              <Input
                id="saldo-final"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={saldoFinal}
                onChange={(e) => setSaldoFinal(e.target.value)}
              />
              {saldoFinal && Number(saldoFinal) !== saldoSistema && (
                <p className="text-xs text-amber-600">
                  Diferença: {formatCurrency(Number(saldoFinal) - saldoSistema)}
                </p>
              )}
            </div>

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
            <Button variant="outline" onClick={() => setFecharModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleFecharCaixa}
              disabled={fecharCaixa.isPending}
            >
              {fecharCaixa.isPending ? "Fechando..." : "Confirmar Fechamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
