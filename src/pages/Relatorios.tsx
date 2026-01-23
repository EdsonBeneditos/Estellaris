import { useState, useMemo } from "react";
import { BarChart3, Users, TrendingUp, PieChart, Briefcase, Calendar, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVendedores, useOrigens, useTiposServico } from "@/hooks/useSettings";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameYear,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { MOTIVOS_PERDA } from "@/lib/constants";

// Default colors as fallback
const DEFAULT_ORIGEM_COLOR = "#3B82F6";
const DEFAULT_VENDEDOR_COLOR = "#10B981";
const DEFAULT_SERVICO_COLOR = "#8B5CF6";

// Colors for loss reasons chart
const LOSS_COLORS = [
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#84CC16", // Lime
  "#14B8A6", // Teal
  "#6366F1", // Indigo
];

const chartConfig = {
  count: {
    label: "Leads",
    color: "hsl(var(--primary))",
  },
};

export default function Relatorios() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  // Fetch settings with colors
  const { data: vendedoresConfig = [] } = useVendedores();
  const { data: origensConfig = [] } = useOrigens();
  const { data: servicosConfig = [] } = useTiposServico();

  // Fetch all leads
  const { data: allLeads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ["all-leads-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Filter leads by selected month/year
  const filteredLeads = useMemo(() => {
    return allLeads.filter((lead) => {
      const leadDate = parseISO(lead.created_at);
      return (
        isSameMonth(leadDate, new Date(selectedYear, selectedMonth)) &&
        isSameYear(leadDate, new Date(selectedYear, selectedMonth))
      );
    });
  }, [allLeads, selectedMonth, selectedYear]);

  // Get color from config
  const getVendedorColor = (vendedor: string) => {
    const config = vendedoresConfig.find((v) => v.nome === vendedor);
    return config?.cor || DEFAULT_VENDEDOR_COLOR;
  };

  const getOrigemColor = (origem: string) => {
    const config = origensConfig.find((o) => o.nome === origem);
    return config?.cor || DEFAULT_ORIGEM_COLOR;
  };

  const getServicoColor = (servico: string) => {
    const config = servicosConfig.find((s) => s.nome === servico);
    return config?.cor || DEFAULT_SERVICO_COLOR;
  };

  // Vendedor stats for selected period with custom colors
  const vendedorStats = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLeads.forEach((lead) => {
      const vendedor = lead.vendedor || "Não atribuído";
      counts[vendedor] = (counts[vendedor] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([vendedor, count]) => ({ 
        vendedor, 
        count,
        color: getVendedorColor(vendedor)
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredLeads, vendedoresConfig]);

  // Leads per day for selected month (starting from day 1)
  const leadsPerDay = useMemo(() => {
    const start = startOfMonth(new Date(selectedYear, selectedMonth));
    const end = endOfMonth(new Date(selectedYear, selectedMonth));
    const days = eachDayOfInterval({ start, end });

    const counts: Record<string, number> = {};
    filteredLeads.forEach((lead) => {
      const date = lead.created_at.split("T")[0];
      counts[date] = (counts[date] || 0) + 1;
    });

    return days.map((day) => ({
      date: format(day, "yyyy-MM-dd"),
      displayDate: format(day, "dd"),
      count: counts[format(day, "yyyy-MM-dd")] || 0,
    }));
  }, [filteredLeads, selectedMonth, selectedYear]);

  // Origem stats with custom colors
  const origemStats = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLeads.forEach((lead) => {
      const origem = lead.origem || "Não informado";
      counts[origem] = (counts[origem] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([origem, count]) => ({ 
        origem, 
        count,
        color: getOrigemColor(origem)
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredLeads, origensConfig]);

  // Serviço stats with custom colors
  const servicoStats = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLeads.forEach((lead) => {
      const servico = lead.tipo_servico || "Não informado";
      counts[servico] = (counts[servico] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([servico, count]) => ({ 
        servico, 
        count,
        color: getServicoColor(servico)
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredLeads, servicosConfig]);

  // Serviços mais convertidos (only converted leads)
  const servicoConvertidoStats = useMemo(() => {
    const convertedLeads = filteredLeads.filter((lead) => lead.status === "Convertido");
    const counts: Record<string, number> = {};
    convertedLeads.forEach((lead) => {
      const servico = lead.tipo_servico || "Não informado";
      counts[servico] = (counts[servico] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([servico, count]) => ({ 
        servico, 
        count,
        color: getServicoColor(servico)
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredLeads, servicosConfig]);

  // Loss reasons stats
  const lossStats = useMemo(() => {
    const lostLeads = filteredLeads.filter((lead) => lead.status === "Perdido");
    const counts: Record<string, number> = {};
    
    lostLeads.forEach((lead) => {
      const motivo = lead.motivo_perda || "Não informado";
      counts[motivo] = (counts[motivo] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([motivo, count], index) => ({ 
        motivo, 
        count,
        color: LOSS_COLORS[index % LOSS_COLORS.length]
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredLeads]);

  const totalLeads = filteredLeads.length;
  const totalLostLeads = filteredLeads.filter((lead) => lead.status === "Perdido").length;

  // Generate month/year options
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(2024, i), "MMMM", { locale: ptBR }),
  }));

  const years = Array.from({ length: 5 }, (_, i) => ({
    value: currentDate.getFullYear() - 2 + i,
    label: (currentDate.getFullYear() - 2 + i).toString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Relatórios e Análises
          </h1>
          <p className="text-muted-foreground mt-1">
            Dashboard analítico do funil de vendas da Acqua Nobilis
          </p>
        </div>

        {/* Period Filters */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select
            value={selectedMonth.toString()}
            onValueChange={(v) => setSelectedMonth(parseInt(v))}
          >
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value.toString()}>
                  <span className="capitalize">{m.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedYear.toString()}
            onValueChange={(v) => setSelectedYear(parseInt(v))}
          >
            <SelectTrigger className="w-[100px] bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y.value} value={y.value.toString()}>
                  {y.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Leads
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
            <p className="text-xs text-muted-foreground">No período selecionado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Vendedores Ativos
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vendedorStats.filter((v) => v.vendedor !== "Não atribuído").length}
            </div>
            <p className="text-xs text-muted-foreground">Com leads atribuídos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Origens de Lead
            </CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{origemStats.length}</div>
            <p className="text-xs text-muted-foreground">
              Canais de captação
            </p>
          </CardContent>
        </Card>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">
              Leads Perdidos
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{totalLostLeads}</div>
            <p className="text-xs text-muted-foreground">No período selecionado</p>
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
            {leadsLoading ? (
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
                  layout="horizontal"
                  margin={{ left: 10, right: 10, top: 20, bottom: 40 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={true}
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="vendedor" 
                    type="category"
                    tick={{ fontSize: 11 }}
                    angle={-35}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Leads" barSize={32}>
                    {vendedorStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
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
            {leadsLoading ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Carregando...
              </div>
            ) : origemStats.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            ) : (
              <div className="h-[300px] flex flex-col sm:flex-row items-center">
                <ChartContainer
                  config={chartConfig}
                  className="h-full w-full sm:w-1/2"
                >
                  <RechartsPieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={origemStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="count"
                      nameKey="origem"
                    >
                      {origemStats.map((item, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={item.color}
                        />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ChartContainer>
                <div className="w-full sm:w-1/2 space-y-2 mt-4 sm:mt-0">
                  {origemStats.map((item) => (
                    <div key={item.origem} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
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

        {/* Serviços Mais Solicitados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Serviços Mais Solicitados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leadsLoading ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Carregando...
              </div>
            ) : servicoStats.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart
                  data={servicoStats}
                  layout="horizontal"
                  margin={{ left: 10, right: 10, top: 20, bottom: 60 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={true}
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="servico" 
                    type="category"
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Leads" barSize={28}>
                    {servicoStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Serviços Mais Convertidos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Serviços Mais Convertidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leadsLoading ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Carregando...
              </div>
            ) : servicoConvertidoStats.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma conversão no período</p>
                </div>
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart
                  data={servicoConvertidoStats}
                  layout="horizontal"
                  margin={{ left: 10, right: 10, top: 20, bottom: 60 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={true}
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="servico" 
                    type="category"
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Convertidos" barSize={28}>
                    {servicoConvertidoStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Volume de Leads por Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Volume de Leads por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leadsLoading ? (
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
                    dataKey="displayDate"
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    labelFormatter={(_, payload) => {
                      if (payload && payload[0]) {
                        return format(
                          parseISO(payload[0].payload.date),
                          "dd 'de' MMMM",
                          { locale: ptBR }
                        );
                      }
                      return "";
                    }}
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

        {/* Motivos de Perda - BI Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Análise de Motivos de Perda
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leadsLoading ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Carregando...
              </div>
            ) : lossStats.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum lead perdido no período</p>
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col sm:flex-row items-center">
                <ChartContainer
                  config={chartConfig}
                  className="h-full w-full sm:w-1/2"
                >
                  <RechartsPieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={lossStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="motivo"
                    >
                      {lossStats.map((item, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={item.color}
                        />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ChartContainer>
                <div className="w-full sm:w-1/2 space-y-3 mt-4 sm:mt-0">
                  {lossStats.map((item) => (
                    <div key={item.motivo} className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium flex-1">
                        {item.motivo}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">
                          {item.count}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({Math.round((item.count / totalLostLeads) * 100)}%)
                        </span>
                      </div>
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
