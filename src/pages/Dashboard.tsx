import { useState, useMemo } from "react";
import { Plus, Users, CalendarClock, FolderOpen, Filter, X, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import { StatsCard } from "@/components/leads/StatsCard";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { NewLeadModal } from "@/components/leads/NewLeadModal";
import { DateRangePicker } from "@/components/leads/DateRangePicker";
import { useLeads, useLeadsStats } from "@/hooks/useLeads";
import { useActiveVendedores, useActiveTiposServico } from "@/hooks/useSettings";
import { DateRange } from "react-day-picker";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

// Fixed colors for each salesperson
const VENDEDOR_COLORS: Record<string, string> = {
  "Maria Victoria": "hsl(210, 100%, 45%)", // Blue
  "Francielli": "hsl(142, 71%, 45%)",      // Green
  "Mikaela": "hsl(280, 70%, 50%)",         // Purple
  "Cleriston": "hsl(25, 95%, 53%)",        // Orange
  "Roberto": "hsl(340, 75%, 55%)",         // Pink/Red
};

const DEFAULT_VENDEDOR_COLOR = "hsl(215, 20%, 60%)";

const chartConfig = {
  count: {
    label: "Leads",
    color: "hsl(var(--primary))",
  },
};

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vendedorFilter, setVendedorFilter] = useState<string>("all");
  const [servicoFilter, setServicoFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: stats, isLoading: statsLoading } = useLeadsStats();
  const { data: vendedores = [] } = useActiveVendedores();
  const { data: tiposServico = [] } = useActiveTiposServico();

  // Filter out "Perdido" status leads and sort by most recent
  const activeLeads = useMemo(() => {
    return leads
      .filter((lead) => lead.status !== "Perdido")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [leads]);

  // Group leads by month (using activeLeads)
  const groupedLeads = useMemo(() => {
    const groups: Record<string, typeof activeLeads> = {};
    
    activeLeads.forEach((lead) => {
      const monthKey = lead.mes_referencia || lead.created_at.slice(0, 7);
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(lead);
    });

    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [activeLeads]);

  // Vendedor stats for chart
  const vendedorStats = useMemo(() => {
    const counts: Record<string, number> = {};
    activeLeads.forEach((lead) => {
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
  }, [activeLeads]);

  // Apply filters (using activeLeads which already excludes "Perdido")
  const filteredLeads = useMemo(() => {
    return activeLeads.filter((lead) => {
      const matchVendedor =
        vendedorFilter === "all" || lead.vendedor === vendedorFilter;
      const matchServico =
        servicoFilter === "all" || lead.tipo_servico === servicoFilter;
      
      let matchDate = true;
      if (dateRange?.from) {
        const leadDate = parseISO(lead.created_at);
        const from = startOfDay(dateRange.from);
        const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
        matchDate = isWithinInterval(leadDate, { start: from, end: to });
      }

      return matchVendedor && matchServico && matchDate;
    });
  }, [activeLeads, vendedorFilter, servicoFilter, dateRange]);

  const hasActiveFilters =
    vendedorFilter !== "all" || servicoFilter !== "all" || dateRange !== undefined;

  const clearFilters = () => {
    setVendedorFilter("all");
    setServicoFilter("all");
    setDateRange(undefined);
  };

  const formatMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return format(date, "MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus leads e acompanhe o progresso
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Novo Lead
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard
          title="Total de Leads (Mês)"
          value={statsLoading ? "..." : stats?.totalMonth || 0}
          icon={Users}
          description="Leads captados este mês"
        />
        <StatsCard
          title="Retornos para Hoje"
          value={statsLoading ? "..." : stats?.todayReturns || 0}
          icon={CalendarClock}
          description="Leads com retorno programado"
        />
        <StatsCard
          title="Leads em Aberto"
          value={statsLoading ? "..." : stats?.openLeads || 0}
          icon={FolderOpen}
          description="Leads ativos aguardando fechamento"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filtros:
        </div>
        
        <Select value={vendedorFilter} onValueChange={setVendedorFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-background">
            <SelectValue placeholder="Vendedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Vendedores</SelectItem>
            {vendedores.map((v) => (
              <SelectItem key={v.id} value={v.nome}>
                {v.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={servicoFilter} onValueChange={setServicoFilter}>
          <SelectTrigger className="w-full sm:w-[200px] bg-background">
            <SelectValue placeholder="Tipo de Serviço" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Serviços</SelectItem>
            {tiposServico.map((s) => (
              <SelectItem key={s.id} value={s.nome}>
                {s.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
          className="w-full sm:w-auto"
        />

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Limpar
          </Button>
        )}

        {hasActiveFilters && (
          <span className="text-sm text-muted-foreground ml-auto">
            {filteredLeads.length} lead(s) encontrado(s)
          </span>
        )}
      </div>

      {/* Leads Table - Grouped by Month when no filters */}
      {!hasActiveFilters ? (
        <div className="space-y-8">
          {groupedLeads.map(([monthKey, monthLeads]) => (
            <div key={monthKey}>
              <h2 className="text-lg font-semibold text-foreground mb-4 capitalize">
                {formatMonthLabel(monthKey)}
              </h2>
              <LeadsTable leads={monthLeads} isLoading={leadsLoading} />
            </div>
          ))}
          {groupedLeads.length === 0 && !leadsLoading && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum lead encontrado.
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Resultados Filtrados
          </h2>
          <LeadsTable leads={filteredLeads} isLoading={leadsLoading} />
        </div>
      )}

      {/* Desempenho por Vendedor Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Desempenho por Vendedor
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leadsLoading ? (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
              Carregando...
            </div>
          ) : vendedorStats.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
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

      {/* New Lead Modal */}
      <NewLeadModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}
