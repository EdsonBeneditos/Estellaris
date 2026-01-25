import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  PieChart,
  Activity,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  useAllMovimentacoes,
  useEntradasVsSaidasMensal,
  useSaldoAcumuladoDiario,
  useMixPagamentosEntradas,
  useMixPagamentosSaidas,
  useProjecaoProximoMes,
  useTotaisGerais,
} from "@/hooks/useFinanceiroRelatorio";
import { cn } from "@/lib/utils";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const chartConfig = {
  entradas: {
    label: "Entradas",
    color: "#10B981",
  },
  saidas: {
    label: "Saídas",
    color: "#EF4444",
  },
  saldo: {
    label: "Saldo",
    color: "#3B82F6",
  },
};

export function RelatorioFinanceiro() {
  const { data: movimentacoes, isLoading } = useAllMovimentacoes();

  const entradasVsSaidas = useEntradasVsSaidasMensal(movimentacoes);
  const saldoAcumulado = useSaldoAcumuladoDiario(movimentacoes);
  const mixEntradas = useMixPagamentosEntradas(movimentacoes);
  const mixSaidas = useMixPagamentosSaidas(movimentacoes);
  const projecao = useProjecaoProximoMes(movimentacoes);
  const totais = useTotaisGerais(movimentacoes);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Carregando dados financeiros...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Projeção Card no Topo */}
      <Card className="relative overflow-visible border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:border-primary/40">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Projeção para o Próximo Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Saldo Atual */}
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Saldo Atual</span>
              <span
                className={cn(
                  "text-2xl font-bold",
                  projecao.saldoAtual >= 0 ? "text-emerald-600" : "text-rose-600"
                )}
              >
                {formatCurrency(projecao.saldoAtual)}
              </span>
            </div>

            {/* Média Líquida */}
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">
                Média Líquida (3 meses)
              </span>
              <div className="flex items-center gap-2">
                {projecao.tendencia === "positiva" ? (
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                ) : projecao.tendencia === "negativa" ? (
                  <TrendingDown className="h-5 w-5 text-rose-500" />
                ) : (
                  <Activity className="h-5 w-5 text-muted-foreground" />
                )}
                <span
                  className={cn(
                    "text-2xl font-bold",
                    projecao.mediaLiquida >= 0 ? "text-emerald-600" : "text-rose-600"
                  )}
                >
                  {formatCurrency(projecao.mediaLiquida)}
                </span>
              </div>
            </div>

            {/* Projeção */}
            <div className="flex flex-col gap-1 p-4 rounded-xl bg-primary/10 border border-primary/20">
              <span className="text-sm font-medium text-primary">
                Projeção de Fechamento
              </span>
              <span
                className={cn(
                  "text-3xl font-bold",
                  projecao.projecao >= 0 ? "text-emerald-600" : "text-rose-600"
                )}
              >
                {formatCurrency(projecao.projecao)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Totais do Mês */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-1 -m-1 overflow-visible">
        <Card className="relative overflow-visible transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-emerald-400/50 hover:z-10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Entradas (Mês)
            </CardTitle>
            <ArrowUpCircle className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(totais.totalEntradas)}
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-visible transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-rose-400/50 hover:z-10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saídas (Mês)
            </CardTitle>
            <ArrowDownCircle className="h-5 w-5 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">
              {formatCurrency(totais.totalSaidas)}
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-visible transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-primary/50 hover:z-10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Líquido (Mês)
            </CardTitle>
            <Wallet className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-bold",
                totais.saldoLiquido >= 0 ? "text-emerald-600" : "text-rose-600"
              )}
            >
              {formatCurrency(totais.saldoLiquido)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-1 -m-1 overflow-visible">
        {/* Gráfico Comparativo - Entradas vs Saídas */}
        <Card className="relative overflow-visible transition-all duration-200 hover:shadow-lg hover:border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Entradas vs Saídas (Últimos 6 Meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {entradasVsSaidas.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart
                  data={entradasVsSaidas}
                  margin={{ left: 10, right: 10, top: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) =>
                      new Intl.NumberFormat("pt-BR", {
                        notation: "compact",
                        compactDisplay: "short",
                      }).format(value)
                    }
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                    }
                  />
                  <Legend />
                  <Bar
                    dataKey="entradas"
                    name="Entradas"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                  <Bar
                    dataKey="saidas"
                    name="Saídas"
                    fill="#EF4444"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Linha - Saúde do Caixa */}
        <Card className="relative overflow-visible transition-all duration-200 hover:shadow-lg hover:border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Saúde do Caixa (Evolução Diária)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {saldoAcumulado.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <LineChart
                  data={saldoAcumulado}
                  margin={{ left: 10, right: 10, top: 20, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="saldoGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="dia"
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) =>
                      new Intl.NumberFormat("pt-BR", {
                        notation: "compact",
                        compactDisplay: "short",
                      }).format(value)
                    }
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatCurrency(Number(value))}
                        labelFormatter={(_, payload) => {
                          if (payload && payload[0]) {
                            return `Dia ${payload[0].payload.diaCompleto}`;
                          }
                          return "";
                        }}
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="saldo"
                    name="Saldo"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, fill: "#3B82F6" }}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Pizza - Formas de Entrada */}
        <Card className="relative overflow-visible transition-all duration-200 hover:shadow-lg hover:border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-emerald-500" />
              Formas de Entrada
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mixEntradas.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhuma entrada registrada
              </div>
            ) : (
              <div className="h-[300px] flex flex-col sm:flex-row items-center">
                <ChartContainer
                  config={chartConfig}
                  className="h-full w-full sm:w-1/2"
                >
                  <RechartsPieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => formatCurrency(Number(value))}
                        />
                      }
                    />
                    <Pie
                      data={mixEntradas}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="valor"
                      nameKey="forma"
                    >
                      {mixEntradas.map((item, index) => (
                        <Cell key={`cell-${index}`} fill={item.color} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ChartContainer>
                <div className="w-full sm:w-1/2 space-y-2 mt-4 sm:mt-0">
                  {mixEntradas.map((item) => (
                    <div key={item.forma} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-muted-foreground truncate flex-1">
                        {item.forma}
                      </span>
                      <span className="text-sm font-medium">
                        {formatCurrency(item.valor)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Pizza - Canais de Saída */}
        <Card className="relative overflow-visible transition-all duration-200 hover:shadow-lg hover:border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-rose-500" />
              Canais de Saída
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mixSaidas.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhuma saída registrada
              </div>
            ) : (
              <div className="h-[300px] flex flex-col sm:flex-row items-center">
                <ChartContainer
                  config={chartConfig}
                  className="h-full w-full sm:w-1/2"
                >
                  <RechartsPieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => formatCurrency(Number(value))}
                        />
                      }
                    />
                    <Pie
                      data={mixSaidas}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="valor"
                      nameKey="forma"
                    >
                      {mixSaidas.map((item, index) => (
                        <Cell key={`cell-${index}`} fill={item.color} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ChartContainer>
                <div className="w-full sm:w-1/2 space-y-2 mt-4 sm:mt-0">
                  {mixSaidas.map((item) => (
                    <div key={item.forma} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-muted-foreground truncate flex-1">
                        {item.forma}
                      </span>
                      <span className="text-sm font-medium">
                        {formatCurrency(item.valor)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
