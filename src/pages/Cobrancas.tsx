import { useEffect, useState, useMemo } from "react";
import { Plus, RefreshCw, DollarSign, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { CobrancasList } from "@/components/cobrancas/CobrancasList";
import { NovaCobrancaModal } from "@/components/cobrancas/NovaCobrancaModal";
import {
  useCobrancas,
  useGerarCobrancasDoMes,
  atualizarCobrancasAtrasadas,
} from "@/hooks/useCobrancas";
import { useQueryClient } from "@tanstack/react-query";
import { parseISO, isAfter, isBefore, startOfDay, addDays, format } from "date-fns";

const MESES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Cobrancas() {
  const queryClient = useQueryClient();
  const { data: cobrancas = [], isLoading } = useCobrancas();
  const gerarCobrancas = useGerarCobrancasDoMes();

  const hoje = startOfDay(new Date());
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  const [novaCobrancaOpen, setNovaCobrancaOpen] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [filtroBusca, setFiltroBusca] = useState("");
  const [filtroMes, setFiltroMes] = useState(mesAtual);
  const [filtroAno, setFiltroAno] = useState(anoAtual);

  // Update overdue on mount
  useEffect(() => {
    atualizarCobrancasAtrasadas().then(() => {
      queryClient.invalidateQueries({ queryKey: ["cobrancas"] });
      queryClient.invalidateQueries({ queryKey: ["cobrancas_atrasadas_count"] });
    });
  }, [queryClient]);

  // Summary cards
  const aVencer = useMemo(() => {
    const em7dias = addDays(hoje, 7);
    return cobrancas.filter((c) => {
      if (c.status !== "Pendente") return false;
      const v = parseISO(c.data_vencimento);
      return !isBefore(v, hoje) && !isAfter(v, em7dias);
    });
  }, [cobrancas, hoje]);

  const atrasadas = useMemo(() =>
    cobrancas.filter((c) => c.status === "Atrasado" || (c.status === "Pendente" && isBefore(parseISO(c.data_vencimento), hoje))),
    [cobrancas, hoje]
  );

  const pagasNoMes = useMemo(() =>
    cobrancas.filter((c) => {
      if (c.status !== "Pago" || !c.data_pagamento) return false;
      const d = parseISO(c.data_pagamento);
      return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
    }),
    [cobrancas, mesAtual, anoAtual]
  );

  const totalPendente = useMemo(() =>
    cobrancas
      .filter((c) => c.status === "Pendente" || c.status === "Atrasado")
      .reduce((s, c) => s + c.valor, 0),
    [cobrancas]
  );

  // Filtered list
  const filtered = useMemo(() => {
    return cobrancas.filter((c) => {
      // Status filter
      if (filtroStatus !== "Todos" && c.status !== filtroStatus) return false;

      // Month/year filter (by data_vencimento)
      const v = parseISO(c.data_vencimento);
      if (v.getMonth() !== filtroMes || v.getFullYear() !== filtroAno) return false;

      // Search
      if (filtroBusca) {
        const q = filtroBusca.toLowerCase();
        if (!c.cliente_nome.toLowerCase().includes(q) && !c.descricao.toLowerCase().includes(q)) return false;
      }

      return true;
    });
  }, [cobrancas, filtroStatus, filtroMes, filtroAno, filtroBusca]);

  const anos = Array.from({ length: 3 }, (_, i) => anoAtual - 1 + i);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Cobranças</h1>
          <p className="text-sm text-muted-foreground">Controle de pagamentos recorrentes</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => gerarCobrancas.mutate()}
            disabled={gerarCobrancas.isPending}
            className="gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${gerarCobrancas.isPending ? "animate-spin" : ""}`} />
            Gerar Cobranças do Mês
          </Button>
          <Button size="sm" onClick={() => setNovaCobrancaOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nova Cobrança
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-amber-200 dark:border-amber-800/40">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">A Vencer (7 dias)</p>
              <p className="text-xl font-bold text-amber-600">{aVencer.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-800/40">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Atrasadas</p>
              <p className="text-xl font-bold text-red-600">{atrasadas.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 dark:border-emerald-800/40">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pagas no Mês</p>
              <p className="text-xl font-bold text-emerald-600">{pagasNoMes.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 dark:border-blue-800/40">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Pendente</p>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(totalPendente)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Buscar cliente ou descrição..."
          value={filtroBusca}
          onChange={(e) => setFiltroBusca(e.target.value)}
          className="max-w-xs"
        />
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["Todos", "Pendente", "Atrasado", "Pago", "Cancelado"].map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(filtroMes)} onValueChange={(v) => setFiltroMes(Number(v))}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MESES.map((m, i) => (
              <SelectItem key={i} value={String(i)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(filtroAno)} onValueChange={(v) => setFiltroAno(Number(v))}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {anos.map((a) => (
              <SelectItem key={a} value={String(a)}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/20 border-t-primary" />
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
          <CobrancasList cobrancas={filtered} showClienteNome={true} />
        </div>
      )}

      <NovaCobrancaModal open={novaCobrancaOpen} onOpenChange={setNovaCobrancaOpen} />
    </div>
  );
}
