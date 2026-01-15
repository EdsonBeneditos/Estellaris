import { useState, useMemo } from "react";
import { BarChart3, Users, TrendingUp, PieChart, Briefcase, Calendar } from "lucide-react";
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

// Vibrant colors for origin chart slices
const ORIGEM_COLORS: Record<string, string> = {
  "WhatsApp": "hsl(142, 70%, 45%)",     // Green (WhatsApp brand)
  "Site": "hsl(210, 100%, 50%)",        // Blue
  "Indicação": "hsl(280, 70%, 55%)",    // Purple
  "Instagram": "hsl(340, 75%, 55%)",    // Pink/Magenta
  "Google": "hsl(45, 95%, 50%)",        // Yellow/Gold
  "Telefone": "hsl(25, 95%, 53%)",      // Orange
  "E-mail": "hsl(195, 85%, 45%)",       // Cyan
  "Evento": "hsl(0, 75%, 55%)",         // Red
  "LinkedIn": "hsl(201, 100%, 35%)",    // LinkedIn Blue
  "Facebook": "hsl(220, 70%, 50%)",     // Facebook Blue
};

const DEFAULT_ORIGIN_COLORS = [
  "hsl(215, 60%, 50%)",
  "hsl(180, 60%, 45%)",
  "hsl(320, 60%, 50%)",
  "hsl(60, 70%, 45%)",
  "hsl(150, 60%, 45%)",
];

// Fixed colors for each salesperson
const VENDEDOR_COLORS: Record<string, string> = {
  "Maria Victoria": "hsl(210, 100%, 45%)", // Blue
  "Francielli": "hsl(142, 71%, 45%)",      // Green
  "Mikaela": "hsl(280, 70%, 50%)",         // Purple
  "Cleriston": "hsl(25, 95%, 53%)",        // Orange
  "Roberto": "hsl(340, 75%, 55%)",         // Pink/Red
};

const DEFAULT_VENDEDOR_COLOR = "hsl(215, 20%, 60%)";

const getOrigemColor = (origem: string, index: number): string => {
  return ORIGEM_COLORS[origem] || DEFAULT_ORIGIN_COLORS[index % DEFAULT_ORIGIN_COLORS.length];
};

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

  // Vendedor stats for selected period with fixed colors
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
        color: VENDEDOR_COLORS[vendedor] || DEFAULT_VENDEDOR_COLOR 
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredLeads]);

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

  // Origem stats
  const origemStats = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLeads.forEach((lead) => {
      const origem = lead.origem || "Não informado";
      counts[origem] = (counts[origem] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([origem, count]) => ({ origem, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredLeads]);

  // Serviço stats
  const servicoStats = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLeads.forEach((lead) => {
      const servico = lead.tipo_servico || "Não informado";
      counts[servico] = (counts[servico] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([servico, count]) => ({ servico, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredLeads]);

  const totalLeads = filteredLeads.length;

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Serviços Solicitados
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{servicoStats.length}</div>
            <p className="text-xs text-muted-foreground">Tipos diferentes</p>
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
                  layout="vertical"
                  margin={{ left: 0, right: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={true}
                    vertical={false}
                  />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="vendedor"
                    type="category"
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Leads">
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
                          fill={getOrigemColor(item.origem, index)}
                        />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ChartContainer>
                <div className="w-full sm:w-1/2 space-y-2 mt-4 sm:mt-0">
                  {origemStats.map((item, index) => (
                    <div key={item.origem} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{
                          backgroundColor: getOrigemColor(item.origem, index),
                        }}
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
                  layout="vertical"
                  margin={{ left: 0, right: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={true}
                    vertical={false}
                  />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="servico"
                    type="category"
                    width={150}
                    tick={{ fontSize: 11 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--chart-2))"
                    radius={[0, 4, 4, 0]}
                    name="Leads"
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Volume de Leads por Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
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
      </div>
    </div>
  );
}
