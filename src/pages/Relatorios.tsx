import { BarChart3, Users, TrendingUp, PieChart } from "lucide-react";
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
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";
import {
  useVendedorStats,
  useLeadsPerDay,
  useOrigemStats,
} from "@/hooks/useReportStats";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(210 40% 60%)",
  "hsl(210 40% 70%)",
  "hsl(210 40% 80%)",
];

const chartConfig = {
  count: {
    label: "Leads",
    color: "hsl(var(--primary))",
  },
};

export default function Relatorios() {
  const { data: vendedorStats = [], isLoading: vendedorLoading } =
    useVendedorStats();
  const { data: leadsPerDay = [], isLoading: leadsPerDayLoading } =
    useLeadsPerDay();
  const { data: origemStats = [], isLoading: origemLoading } = useOrigemStats();

  const totalLeads = origemStats.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Relatórios e Análises
        </h1>
        <p className="text-muted-foreground mt-1">
          Dashboard analítico do funil de vendas da Acqua Nobilis
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              Todos os leads cadastrados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendedores Ativos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vendedorStats.filter((v) => v.vendedor !== "Não atribuído").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Com leads atribuídos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Origens de Lead</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{origemStats.length}</div>
            <p className="text-xs text-muted-foreground">
              Canais de captação identificados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Desempenho por Vendedor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Desempenho por Vendedor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vendedorLoading ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Carregando...
              </div>
            ) : vendedorStats.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart
                  data={vendedorStats}
                  layout="vertical"
                  margin={{ left: 0, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="vendedor"
                    type="category"
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                    name="Leads"
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Origem dos Leads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Origem dos Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {origemLoading ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Carregando...
              </div>
            ) : origemStats.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            ) : (
              <div className="h-[300px] flex items-center">
                <ChartContainer config={chartConfig} className="h-full w-1/2">
                  <RechartsPieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={origemStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="count"
                      nameKey="origem"
                    >
                      {origemStats.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ChartContainer>
                <div className="w-1/2 space-y-2">
                  {origemStats.map((item, index) => (
                    <div key={item.origem} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm text-muted-foreground truncate">
                        {item.origem}
                      </span>
                      <span className="text-sm font-medium ml-auto">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Volume de Leads por Data */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Volume de Leads por Data (Últimos 30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leadsPerDayLoading ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Carregando...
              </div>
            ) : leadsPerDay.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <AreaChart
                  data={leadsPerDay}
                  margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      format(parseISO(value), "dd/MM", { locale: ptBR })
                    }
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    labelFormatter={(value) =>
                      format(parseISO(value as string), "dd 'de' MMMM", {
                        locale: ptBR,
                      })
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorCount)"
                    name="Leads"
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
