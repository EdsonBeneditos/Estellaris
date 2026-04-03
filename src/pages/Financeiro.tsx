import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Eye, EyeOff, ShieldOff } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  useMovimentacoes,
  useCaixaAberto,
  useTotaisMovimentacoes,
} from "@/hooks/useFinanceiro";
import { TotalizadoresCard } from "@/components/financeiro/TotalizadoresCard";
import { CaixaControl } from "@/components/financeiro/CaixaControl";
import { MovimentacoesTable } from "@/components/financeiro/MovimentacoesTable";
import { MovimentacaoModal } from "@/components/financeiro/MovimentacaoModal";
import { FiltrosMovimentacoes } from "@/components/financeiro/FiltrosMovimentacoes";
import { AguardandoFaturamento } from "@/components/financeiro/AguardandoFaturamento";

export default function Financeiro() {
  const { hasMenuAccess, isAdmin } = usePermissions();

  if (!isAdmin && !hasMenuAccess("financeiro")) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <ShieldOff className="h-12 w-12 text-muted-foreground" />
        <div>
          <h2 className="text-lg font-semibold">Acesso Restrito</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Você não tem permissão para acessar o Financeiro / Caixa.
            <br />
            Entre em contato com o administrador da organização.
          </p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const [filtros, setFiltros] = useState({
    dataInicio: format(startOfMonth(now), "yyyy-MM-dd"),
    dataFim: format(endOfMonth(now), "yyyy-MM-dd"),
    formaPagamento: "todos",
    tipo: "todos",
    busca: "",
  });

  const [novaMovimentacaoOpen, setNovaMovimentacaoOpen] = useState(false);
  const [valoresVisiveis, setValoresVisiveis] = useState(false);

  const { data: movimentacoes, isLoading } = useMovimentacoes(filtros);
  const { data: caixaAberto } = useCaixaAberto();
  const totais = useTotaisMovimentacoes(movimentacoes);

  // Check if using default month filter
  const isDefaultMonth =
    filtros.dataInicio === format(startOfMonth(now), "yyyy-MM-dd") &&
    filtros.dataFim === format(endOfMonth(now), "yyyy-MM-dd");

  const periodLabel = isDefaultMonth ? "Neste mês" : `${filtros.dataInicio} a ${filtros.dataFim}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Financeiro / Caixa</h1>
            <p className="text-muted-foreground">
              Controle de movimentações, entradas e saídas
            </p>
          </div>
          <button
            onClick={() => setValoresVisiveis((v) => !v)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title={valoresVisiveis ? "Ocultar valores" : "Mostrar valores"}
          >
            {valoresVisiveis ? (
              <Eye className="h-5 w-5 text-foreground" />
            ) : (
              <EyeOff className="h-5 w-5 text-foreground" />
            )}
          </button>
        </div>
        <Button onClick={() => setNovaMovimentacaoOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Movimentação
        </Button>
      </div>

      {/* Aguardando Faturamento */}
      <AguardandoFaturamento caixaId={caixaAberto?.id} />

      {/* Layout principal */}
      <div className="grid gap-6 xl:grid-cols-[1fr_minmax(0,320px)]">
        {/* Coluna principal */}
        <div className="space-y-6 min-w-0">
          {/* Totalizadores */}
          <TotalizadoresCard
            {...totais}
            valoresVisiveis={valoresVisiveis}
            periodLabel={periodLabel}
          />

          {/* Filtros */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <FiltrosMovimentacoes filtros={filtros} onFiltrosChange={setFiltros} />
            </CardContent>
          </Card>

          {/* Tabela de Movimentações */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Movimentações
                {movimentacoes && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({movimentacoes.length} registros)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando movimentações...
                </div>
              ) : (
                <MovimentacoesTable
                  movimentacoes={(movimentacoes || []).filter((m) => {
                    if (!filtros.busca) return true;
                    const term = filtros.busca.toLowerCase();
                    return (
                      m.descricao?.toLowerCase().includes(term) ||
                      m.categoria_nome?.toLowerCase().includes(term) ||
                      m.usuario_email?.toLowerCase().includes(term)
                    );
                  })}
                  caixaId={caixaAberto?.id}
                  valoresVisiveis={valoresVisiveis}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Controle de Caixa */}
        <div className="space-y-6 min-w-0">
          <CaixaControl caixaAberto={caixaAberto || null} movimentacoes={movimentacoes} />
        </div>
      </div>

      {/* Modal Nova Movimentação */}
      <MovimentacaoModal
        open={novaMovimentacaoOpen}
        onOpenChange={setNovaMovimentacaoOpen}
        caixaId={caixaAberto?.id}
      />
    </div>
  );
}
