import { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  PieChart,
  Activity,
  Target,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MovimentacaoCaixa } from "@/hooks/useFinanceiro";
import { useCentrosCusto } from "@/hooks/useCentrosCusto";
import { cn } from "@/lib/utils";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const chartConfig = {
  entradas: { label: "Entradas", color: "#10B981" },
  saidas: { label: "Saídas", color: "#EF4444" },
  saldo: { label: "Saldo", color: "#3B82F6" },
};

export function RelatorioFinanceiro() {
  const now = new Date();
  const [dataInicio, setDataInicio] = useState(format(startOfMonth(now), "yyyy-MM-dd"));
  const [dataFim, setDataFim] = useState(format(endOfMonth(now), "yyyy-MM-dd"));
  const { data: centrosCusto = [] } = useCentrosCusto();

  // Fetch movimentações filtered by date range using data_movimentacao
  const { data: movimentacoes, isLoading } = useQuery({
    queryKey: ["relatorio_movimentacoes", dataInicio, dataFim],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movimentacoes_caixa")
        .select("*")
        .gte("data_movimentacao", dataInicio)
        .lte("data_movimentacao", dataFim)
        .order("data_movimentacao", { ascending: true });

      if (error) throw error;
      return data as MovimentacaoCaixa[];
    },
  });

  // Also fetch all for projection
  const { data: allMovimentacoes } = useQuery({
    queryKey: ["all_movimentacoes_relatorio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movimentacoes_caixa")
        .select("*")
        .order("data_hora", { ascending: true });
      if (error) throw error;
      return data as MovimentacaoCaixa[];
    },
  });

  // Totais do período filtrado
  const totais = useMemo(() => {
    if (!movimentacoes) return { totalEntradas: 0, totalSaidas: 0, saldoLiquido: 0 };
    const totalEntradas = movimentacoes.filter(m => m.tipo === "Entrada").reduce((acc, m) => acc + Number(m.valor), 0);
    const totalSaidas = movimentacoes.filter(m => m.tipo === "Saída").reduce((acc, m) => acc + Number(m.valor), 0);
    return { totalEntradas, totalSaidas, saldoLiquido: totalEntradas - totalSaidas };
  }, [movimentacoes]);

  // Entradas vs Saídas últimos 6 meses
  const entradasVsSaidas = useMemo(() => {
    if (!allMovimentacoes) return [];
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(now, i);
      const mesKey = format(date, "yyyy-MM");
      const mesLabel = format(date, "MMM/yy", { locale: ptBR });
      const movMes = allMovimentacoes.filter(m => {
        const mDate = m.data_movimentacao || format(parseISO(m.data_hora), "yyyy-MM-dd");
        return mDate.startsWith(mesKey);
      });
      months.push({
        mes: mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1),
        entradas: movMes.filter(m => m.tipo === "Entrada").reduce((acc, m) => acc + Number(m.valor), 0),
        saidas: movMes.filter(m => m.tipo === "Saída").reduce((acc, m) => acc + Number(m.valor), 0),
      });
    }
    return months;
  }, [allMovimentacoes]);

  // Saldo acumulado diário no período filtrado
  const saldoAcumulado = useMemo(() => {
    if (!movimentacoes || !dataInicio || !dataFim) return [];
    const start = parseISO(dataInicio);
    const end = parseISO(dataFim);
    const days = eachDayOfInterval({ start, end });

    let saldo = 0;
    return days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      movimentacoes
        .filter(m => (m.data_movimentacao || format(parseISO(m.data_hora), "yyyy-MM-dd")) === dayStr)
        .forEach(m => {
          saldo += m.tipo === "Entrada" ? Number(m.valor) : -Number(m.valor);
        });
      return { dia: format(day, "dd"), diaCompleto: format(day, "dd/MM", { locale: ptBR }), saldo };
    });
  }, [movimentacoes, dataInicio, dataFim]);

  // Mix pagamentos entradas
  const mixEntradas = useMemo(() => {
    if (!movimentacoes) return [];
    const byForma: Record<string, number> = {};
    movimentacoes.filter(m => m.tipo === "Entrada").forEach(m => {
      const f = m.forma_pagamento || "Outros";
      byForma[f] = (byForma[f] || 0) + Number(m.valor);
    });
    const cores: Record<string, string> = { Dinheiro: "#10B981", Pix: "#8B5CF6", "Cartão Crédito": "#3B82F6", "Cartão Débito": "#06B6D4", Boleto: "#F59E0B", Transferência: "#EC4899", Outros: "#6B7280" };
    return Object.entries(byForma).map(([forma, valor]) => ({ forma, valor, color: cores[forma] || "#6B7280" })).sort((a, b) => b.valor - a.valor);
  }, [movimentacoes]);

  // Mix pagamentos saídas
  const mixSaidas = useMemo(() => {
    if (!movimentacoes) return [];
    const byForma: Record<string, number> = {};
    movimentacoes.filter(m => m.tipo === "Saída").forEach(m => {
      const f = m.forma_pagamento || "Outros";
      byForma[f] = (byForma[f] || 0) + Number(m.valor);
    });
    const cores: Record<string, string> = { Dinheiro: "#EF4444", Pix: "#F97316", "Cartão Crédito": "#DC2626", "Cartão Débito": "#FB7185", Boleto: "#FBBF24", Transferência: "#A855F7", Outros: "#6B7280" };
    return Object.entries(byForma).map(([forma, valor]) => ({ forma, valor, color: cores[forma] || "#6B7280" })).sort((a, b) => b.valor - a.valor);
  }, [movimentacoes]);

  // Gastos por centro de custo
  const gastosCentro = useMemo(() => {
    if (!movimentacoes) return [];
    const byCenter: Record<string, number> = {};
    movimentacoes.filter(m => m.tipo === "Saída" && m.centro_custo_id).forEach(m => {
      byCenter[m.centro_custo_id!] = (byCenter[m.centro_custo_id!] || 0) + Number(m.valor);
    });
    const cores = ["#EF4444","#F97316","#F59E0B","#84CC16","#10B981","#14B8A6","#06B6D4","#3B82F6","#6366F1","#8B5CF6","#A855F7","#EC4899"];
    return Object.entries(byCenter).map(([id, valor], i) => {
      const centro = centrosCusto.find(c => c.id === id);
      return { id, nome: centro?.nome || "Sem centro", valor, color: cores[i % cores.length] };
    }).sort((a, b) => b.valor - a.valor);
  }, [movimentacoes, centrosCusto]);

  // Projeção
  const projecao = useMemo(() => {
    if (!allMovimentacoes || allMovimentacoes.length === 0) return { mediaLiquida: 0, saldoAtual: 0, projecao: 0, tendencia: "estavel" as const };
    const ultimos3: number[] = [];
    for (let i = 1; i <= 3; i++) {
      const d = subMonths(now, i);
      const mk = format(d, "yyyy-MM");
      const movMes = allMovimentacoes.filter(m => {
        const md = m.data_movimentacao || format(parseISO(m.data_hora), "yyyy-MM-dd");
        return md.startsWith(mk);
      });
      const e = movMes.filter(m => m.tipo === "Entrada").reduce((a, m) => a + Number(m.valor), 0);
      const s = movMes.filter(m => m.tipo === "Saída").reduce((a, m) => a + Number(m.valor), 0);
      ultimos3.push(e - s);
    }
    const mediaLiquida = ultimos3.length > 0 ? ultimos3.reduce((a, b) => a + b, 0) / ultimos3.length : 0;
    const saldoAtual = allMovimentacoes.reduce((acc, m) => acc + (m.tipo === "Entrada" ? Number(m.valor) : -Number(m.valor)), 0);
    return { mediaLiquida, saldoAtual, projecao: saldoAtual + mediaLiquida, tendencia: mediaLiquida > 0 ? "positiva" as const : mediaLiquida < 0 ? "negativa" as const : "estavel" as const };
  }, [allMovimentacoes]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando dados financeiros...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Date Range Filters */}
      <Card className="border-primary/20">
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Período:
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Início</Label>
              <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-[160px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Fim</Label>
              <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-[160px]" />
            </div>
            <span className="text-sm text-muted-foreground">{movimentacoes?.length || 0} movimentações</span>
          </div>
        </CardContent>
      </Card>

      {/* Projeção */}
      <Card className="relative overflow-visible border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:border-primary/40">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Projeção para o Próximo Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Saldo Atual</span>
              <span className={cn("text-2xl font-bold", projecao.saldoAtual >= 0 ? "text-emerald-600" : "text-rose-600")}>{formatCurrency(projecao.saldoAtual)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Média Líquida (3 meses)</span>
              <div className="flex items-center gap-2">
                {projecao.tendencia === "positiva" ? <TrendingUp className="h-5 w-5 text-emerald-500" /> : projecao.tendencia === "negativa" ? <TrendingDown className="h-5 w-5 text-rose-500" /> : <Activity className="h-5 w-5 text-muted-foreground" />}
                <span className={cn("text-2xl font-bold", projecao.mediaLiquida >= 0 ? "text-emerald-600" : "text-rose-600")}>{formatCurrency(projecao.mediaLiquida)}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1 p-4 rounded-xl bg-primary/10 border border-primary/20">
              <span className="text-sm font-medium text-primary">Projeção de Fechamento</span>
              <span className={cn("text-3xl font-bold", projecao.projecao >= 0 ? "text-emerald-600" : "text-rose-600")}>{formatCurrency(projecao.projecao)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Totais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-1 -m-1 overflow-visible">
        <Card className="relative overflow-visible transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-emerald-400/50 hover:z-10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Entradas (Período)</CardTitle>
            <ArrowUpCircle className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-600">{formatCurrency(totais.totalEntradas)}</div></CardContent>
        </Card>
        <Card className="relative overflow-visible transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-rose-400/50 hover:z-10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saídas (Período)</CardTitle>
            <ArrowDownCircle className="h-5 w-5 text-rose-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-rose-600">{formatCurrency(totais.totalSaidas)}</div></CardContent>
        </Card>
        <Card className="relative overflow-visible transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-primary/50 hover:z-10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Líquido (Período)</CardTitle>
            <Wallet className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent><div className={cn("text-2xl font-bold", totais.saldoLiquido >= 0 ? "text-emerald-600" : "text-rose-600")}>{formatCurrency(totais.saldoLiquido)}</div></CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-1 -m-1 overflow-visible">
        {/* Entradas vs Saídas */}
        <Card className="relative overflow-visible transition-all duration-200 hover:shadow-lg hover:border-primary/30">
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />Entradas vs Saídas (6 Meses)</CardTitle></CardHeader>
          <CardContent>
            {entradasVsSaidas.length === 0 ? <div className="h-[300px] flex items-center justify-center text-muted-foreground">Nenhum dado</div> : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={entradasVsSaidas} margin={{ left: 10, right: 10, top: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(v)} />
                  <ChartTooltip content={<ChartTooltipContent formatter={v => formatCurrency(Number(v))} />} />
                  <Legend />
                  <Bar dataKey="entradas" name="Entradas" fill="#10B981" radius={[4,4,0,0]} barSize={20} />
                  <Bar dataKey="saidas" name="Saídas" fill="#EF4444" radius={[4,4,0,0]} barSize={20} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Saúde do Caixa */}
        <Card className="relative overflow-visible transition-all duration-200 hover:shadow-lg hover:border-primary/30">
          <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Saúde do Caixa (Período)</CardTitle></CardHeader>
          <CardContent>
            {saldoAcumulado.length === 0 ? <div className="h-[300px] flex items-center justify-center text-muted-foreground">Nenhum dado</div> : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <LineChart data={saldoAcumulado} margin={{ left: 10, right: 10, top: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="dia" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(v)} />
                  <ChartTooltip content={<ChartTooltipContent formatter={v => formatCurrency(Number(v))} labelFormatter={(_, p) => p?.[0] ? `Dia ${p[0].payload.diaCompleto}` : ""} />} />
                  <Line type="monotone" dataKey="saldo" name="Saldo" stroke="#3B82F6" strokeWidth={2} dot={false} activeDot={{ r: 6, fill: "#3B82F6" }} />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Mix Entradas */}
        <Card className="relative overflow-visible transition-all duration-200 hover:shadow-lg hover:border-primary/30">
          <CardHeader><CardTitle className="flex items-center gap-2"><PieChart className="h-5 w-5 text-emerald-500" />Formas de Entrada</CardTitle></CardHeader>
          <CardContent>
            {mixEntradas.length === 0 ? <div className="h-[300px] flex items-center justify-center text-muted-foreground">Nenhuma entrada</div> : (
              <div className="h-[300px] flex flex-col sm:flex-row items-center">
                <ChartContainer config={chartConfig} className="h-full w-full sm:w-1/2">
                  <RechartsPieChart>
                    <ChartTooltip content={<ChartTooltipContent formatter={v => formatCurrency(Number(v))} />} />
                    <Pie data={mixEntradas} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="valor" nameKey="forma">
                      {mixEntradas.map((item, i) => <Cell key={i} fill={item.color} />)}
                    </Pie>
                  </RechartsPieChart>
                </ChartContainer>
                <div className="w-full sm:w-1/2 space-y-2 mt-4 sm:mt-0">
                  {mixEntradas.map(item => (
                    <div key={item.forma} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-muted-foreground truncate flex-1">{item.forma}</span>
                      <span className="text-sm font-medium">{formatCurrency(item.valor)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mix Saídas */}
        <Card className="relative overflow-visible transition-all duration-200 hover:shadow-lg hover:border-primary/30">
          <CardHeader><CardTitle className="flex items-center gap-2"><PieChart className="h-5 w-5 text-rose-500" />Canais de Saída</CardTitle></CardHeader>
          <CardContent>
            {mixSaidas.length === 0 ? <div className="h-[300px] flex items-center justify-center text-muted-foreground">Nenhuma saída</div> : (
              <div className="h-[300px] flex flex-col sm:flex-row items-center">
                <ChartContainer config={chartConfig} className="h-full w-full sm:w-1/2">
                  <RechartsPieChart>
                    <ChartTooltip content={<ChartTooltipContent formatter={v => formatCurrency(Number(v))} />} />
                    <Pie data={mixSaidas} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="valor" nameKey="forma">
                      {mixSaidas.map((item, i) => <Cell key={i} fill={item.color} />)}
                    </Pie>
                  </RechartsPieChart>
                </ChartContainer>
                <div className="w-full sm:w-1/2 space-y-2 mt-4 sm:mt-0">
                  {mixSaidas.map(item => (
                    <div key={item.forma} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-muted-foreground truncate flex-1">{item.forma}</span>
                      <span className="text-sm font-medium">{formatCurrency(item.valor)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gastos por Centro de Custo */}
        {gastosCentro.length > 0 && (
          <Card className="relative overflow-visible transition-all duration-200 hover:shadow-lg hover:border-primary/30 lg:col-span-2">
            <CardHeader><CardTitle className="flex items-center gap-2"><PieChart className="h-5 w-5 text-amber-500" />Gastos por Centro de Custo</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[300px] flex flex-col sm:flex-row items-center">
                <ChartContainer config={chartConfig} className="h-full w-full sm:w-1/2">
                  <RechartsPieChart>
                    <ChartTooltip content={<ChartTooltipContent formatter={v => formatCurrency(Number(v))} />} />
                    <Pie data={gastosCentro} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="valor" nameKey="nome">
                      {gastosCentro.map((item, i) => <Cell key={i} fill={item.color} />)}
                    </Pie>
                  </RechartsPieChart>
                </ChartContainer>
                <div className="w-full sm:w-1/2 space-y-2 mt-4 sm:mt-0">
                  {gastosCentro.map(item => (
                    <div key={item.id} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-muted-foreground truncate flex-1">{item.nome}</span>
                      <span className="text-sm font-medium">{formatCurrency(item.valor)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
